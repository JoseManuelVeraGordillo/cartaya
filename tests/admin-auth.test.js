import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { crearAppDePrueba } from './helpers.js';

let app;

before(async () => {
  app = await crearAppDePrueba();
});

after(async () => {
  await app.cerrar();
});

const rutasProtegidas = [
  { metodo: 'GET', ruta: '/api/admin/sesion' },
  { metodo: 'GET', ruta: '/api/admin/categorias' },
  { metodo: 'POST', ruta: '/api/admin/categorias', body: { nombre: 'x' } },
  { metodo: 'POST', ruta: '/api/admin/categorias/1/archivar' },
  { metodo: 'POST', ruta: '/api/admin/categorias/1/reactivar' },
  { metodo: 'POST', ruta: '/api/admin/categorias/reordenar', body: { ids: [] } },
  { metodo: 'GET', ruta: '/api/admin/platos' },
  { metodo: 'POST', ruta: '/api/admin/platos', body: { categoriaId: 1, nombre: 'x', precioCentimos: 100, alergenos: [] } },
  { metodo: 'POST', ruta: '/api/admin/platos/1/archivar' },
  { metodo: 'POST', ruta: '/api/admin/platos/1/reactivar' },
  { metodo: 'POST', ruta: '/api/admin/platos/reordenar', body: { categoriaId: 1, ids: [] } },
];

for (const { metodo, ruta, body } of rutasProtegidas) {
  test(`rechaza ${metodo} ${ruta} sin sesión de establecimiento`, async () => {
    const r = await fetch(`${app.base}${ruta}`, {
      method: metodo,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    assert.equal(r.status, 401);
  });
}

test('rechaza una cookie de sesión que no corresponde a ninguna sesión activa', async () => {
  const r = await fetch(`${app.base}/api/admin/categorias`, {
    headers: { cookie: 'cartaya_sesion=token-inventado-que-no-existe' },
  });
  assert.equal(r.status, 401);
});

test('el login con contraseña incorrecta no concede sesión', async () => {
  const r = await fetch(`${app.base}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'contraseña-incorrecta' }),
  });
  assert.equal(r.status, 401);
  assert.equal(r.headers.get('set-cookie'), null);
});
