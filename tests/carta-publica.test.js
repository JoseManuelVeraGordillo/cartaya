import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { crearAppDePrueba, iniciarSesionDePrueba } from './helpers.js';

let app;
let cookie;

before(async () => {
  app = await crearAppDePrueba();
  cookie = await iniciarSesionDePrueba(app.base);
});

after(async () => {
  await app.cerrar();
});

async function crearCategoria(nombre) {
  const r = await fetch(`${app.base}/api/admin/categorias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify({ nombre }),
  });
  return r.json();
}

async function crearPlato(categoriaId, datos) {
  const r = await fetch(`${app.base}/api/admin/platos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify({ categoriaId, ...datos }),
  });
  assert.equal(r.status, 201, 'la creación de plato de apoyo para el test debe funcionar');
  return r.json();
}

async function obtenerCarta() {
  const r = await fetch(`${app.base}/api/carta`);
  assert.equal(r.status, 200);
  return r.json();
}

test('Cliente accede a la carta escaneando el QR', async () => {
  const r = await fetch(`${app.base}/api/carta`);
  assert.equal(r.status, 200, 'la carta responde sin pedir sesión ni identificación');
  assert.equal(r.headers.get('set-cookie'), null, 'no se establece ninguna sesión ni identificador de cliente');
});

test('Categorías en el orden definido por el dueño', async () => {
  const a = await crearCategoria('Zeta');
  const b = await crearCategoria('Alfa');
  await crearPlato(a.id, { nombre: 'Plato Z', precioCentimos: 100, alergenos: [] });
  await crearPlato(b.id, { nombre: 'Plato A', precioCentimos: 100, alergenos: [] });

  await fetch(`${app.base}/api/admin/categorias/reordenar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify({ ids: [b.id, a.id] }),
  });

  const carta = await obtenerCarta();
  const nombres = carta.categorias.filter((c) => [a.id, b.id].includes(c.id)).map((c) => c.nombre);
  assert.deepEqual(nombres, ['Alfa', 'Zeta']);
});

test('Platos en el orden definido por el dueño dentro de su categoría', async () => {
  const categoria = await crearCategoria('Orden platos');
  const p1 = await crearPlato(categoria.id, { nombre: 'Segundo', precioCentimos: 100, alergenos: [] });
  const p2 = await crearPlato(categoria.id, { nombre: 'Primero', precioCentimos: 100, alergenos: [] });

  await fetch(`${app.base}/api/admin/platos/reordenar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify({ categoriaId: categoria.id, ids: [p2.id, p1.id] }),
  });

  const carta = await obtenerCarta();
  const cat = carta.categorias.find((c) => c.id === categoria.id);
  assert.deepEqual(cat.platos.map((p) => p.nombre), ['Primero', 'Segundo']);
});

test('Plato archivado no aparece en la carta', async () => {
  const categoria = await crearCategoria('Con archivado');
  const plato = await crearPlato(categoria.id, { nombre: 'A archivar', precioCentimos: 100, alergenos: [] });
  await crearPlato(categoria.id, { nombre: 'Se queda', precioCentimos: 100, alergenos: [] });

  await fetch(`${app.base}/api/admin/platos/${plato.id}/archivar`, { method: 'POST', headers: { cookie } });

  const carta = await obtenerCarta();
  const cat = carta.categorias.find((c) => c.id === categoria.id);
  assert.ok(!cat.platos.some((p) => p.id === plato.id));
});

test('Categoría archivada no aparece en la carta', async () => {
  const categoria = await crearCategoria('Se archiva entera');
  await crearPlato(categoria.id, { nombre: 'Plato activo', precioCentimos: 100, alergenos: [] });

  await fetch(`${app.base}/api/admin/categorias/${categoria.id}/archivar`, { method: 'POST', headers: { cookie } });

  const carta = await obtenerCarta();
  assert.ok(!carta.categorias.some((c) => c.id === categoria.id));
});

test('Categoría sin platos activos no aparece en la carta', async () => {
  const categoria = await crearCategoria('Vacía de activos');
  const plato = await crearPlato(categoria.id, { nombre: 'Único plato', precioCentimos: 100, alergenos: [] });
  await fetch(`${app.base}/api/admin/platos/${plato.id}/archivar`, { method: 'POST', headers: { cookie } });

  const carta = await obtenerCarta();
  assert.ok(!carta.categorias.some((c) => c.id === categoria.id));
});

test('Plato con toda la información', async () => {
  const categoria = await crearCategoria('Info completa');
  await crearPlato(categoria.id, {
    nombre: 'Tortilla',
    precioCentimos: 350,
    descripcion: 'Con cebolla',
    alergenos: ['huevos'],
  });

  const carta = await obtenerCarta();
  const cat = carta.categorias.find((c) => c.id === categoria.id);
  const plato = cat.platos.find((p) => p.nombre === 'Tortilla');
  assert.equal(plato.precioCentimos, 350);
  assert.equal(plato.descripcion, 'Con cebolla');
});

test('Plato sin foto', async () => {
  const categoria = await crearCategoria('Sin foto');
  await crearPlato(categoria.id, { nombre: 'Sin imagen', precioCentimos: 150, alergenos: [] });

  const carta = await obtenerCarta();
  const cat = carta.categorias.find((c) => c.id === categoria.id);
  const plato = cat.platos.find((p) => p.nombre === 'Sin imagen');
  assert.equal(plato.fotoUrl, null);
  assert.equal(plato.nombre, 'Sin imagen');
  assert.equal(plato.precioCentimos, 150);
});

test('Plato con alérgenos declarados', async () => {
  const categoria = await crearCategoria('Con alergenos');
  await crearPlato(categoria.id, { nombre: 'Con gluten', precioCentimos: 100, alergenos: ['gluten', 'lacteos'] });

  const carta = await obtenerCarta();
  const cat = carta.categorias.find((c) => c.id === categoria.id);
  const plato = cat.platos.find((p) => p.nombre === 'Con gluten');
  assert.deepEqual(plato.alergenos, ['gluten', 'lacteos']);
});

test('Plato sin alérgenos declarados', async () => {
  const categoria = await crearCategoria('Sin alergenos declarados');
  await crearPlato(categoria.id, { nombre: 'Sin nada', precioCentimos: 100, alergenos: [] });

  const carta = await obtenerCarta();
  const cat = carta.categorias.find((c) => c.id === categoria.id);
  const plato = cat.platos.find((p) => p.nombre === 'Sin nada');
  assert.deepEqual(plato.alergenos, []);
});

test('Carga rápida en móvil con 4G', async () => {
  // La medición real en condiciones de móvil de gama media / 4G se hizo con
  // Lighthouse (LCP ≈ 1.5 s bajo el throttling móvil por defecto, más
  // exigente que un 4G real) tras activar compresión de respuesta; ver
  // design.md - Decisión de compresión. Este test es un test de regresión
  // que comprueba en CI el mecanismo que sostiene ese resultado.
  const inicio = Date.now();
  const r = await fetch(`${app.base}/api/carta`, { headers: { 'Accept-Encoding': 'gzip' } });
  const duracion = Date.now() - inicio;
  assert.equal(r.headers.get('content-encoding'), 'gzip');
  assert.ok(duracion < 500, `la respuesta de la carta debe ser rápida en local (tomó ${duracion} ms)`);
});

test('Texto legible a contraluz', () => {
  const css = readFileSync(path.resolve(import.meta.dirname, '..', 'web', 'src', 'index.css'), 'utf8');

  const tamanoBase = Number(css.match(/font-size:\s*(\d+)px;/)?.[1]);
  assert.ok(tamanoBase >= 16, 'el tamaño de letra base debe ser legible (>= 16px)');

  const colorTexto = css.match(/--color-texto:\s*(#[0-9a-fA-F]{6})/)?.[1];
  const colorFondo = css.match(/--color-fondo:\s*(#[0-9a-fA-F]{6})/)?.[1];
  assert.ok(contrasteWCAG(colorTexto, colorFondo) >= 4.5, 'el contraste texto/fondo debe cumplir WCAG AA (>= 4.5:1)');
});

function luminanciaRelativa(hex) {
  const canal = (c) => {
    const v = parseInt(c, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const r = canal(hex.slice(1, 3));
  const g = canal(hex.slice(3, 5));
  const b = canal(hex.slice(5, 7));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrasteWCAG(hexA, hexB) {
  const lA = luminanciaRelativa(hexA) + 0.05;
  const lB = luminanciaRelativa(hexB) + 0.05;
  return lA > lB ? lA / lB : lB / lA;
}
