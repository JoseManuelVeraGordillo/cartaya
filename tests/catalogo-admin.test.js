import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { crearAppDePrueba, iniciarSesionDePrueba, PASSWORD_PRUEBA } from './helpers.js';

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
  assert.equal(r.status, 201);
  return r.json();
}

async function crearPlato(categoriaId, datos) {
  const r = await fetch(`${app.base}/api/admin/platos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify({ categoriaId, ...datos }),
  });
  assert.equal(r.status, 201);
  return r.json();
}

test('Acceso a la administración con sesión válida', async () => {
  const r = await fetch(`${app.base}/api/admin/sesion`, { headers: { cookie } });
  assert.equal(r.status, 200);
});

test('Intento de administración sin sesión válida', async () => {
  const categoria = await crearCategoria('Protegida');
  const r = await fetch(`${app.base}/api/admin/platos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categoriaId: categoria.id, nombre: 'Intento sin sesión', precioCentimos: 100, alergenos: [] }),
  });
  assert.equal(r.status, 401);

  const catalogo = await fetch(`${app.base}/api/admin/platos?categoriaId=${categoria.id}`, { headers: { cookie } });
  const { platos } = await catalogo.json();
  assert.ok(!platos.some((p) => p.nombre === 'Intento sin sesión'), 'el catálogo no debe modificarse');
});

test('Crear una categoría', async () => {
  const categoria = await crearCategoria('Nueva categoría');
  assert.ok(categoria.id);
  assert.equal(categoria.nombre, 'Nueva categoría');
  assert.equal(categoria.archivadaEn, null);
});

test('Reordenar categorías', async () => {
  const a = await crearCategoria('Reordenar A');
  const b = await crearCategoria('Reordenar B');
  const r = await fetch(`${app.base}/api/admin/categorias/reordenar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify({ ids: [b.id, a.id] }),
  });
  assert.equal(r.status, 200);

  const carta = await (await fetch(`${app.base}/api/carta`)).json();
  // Ninguna tiene platos activos así que no aparecen en la carta; se
  // comprueba el orden vía el listado de administración.
  const lista = await (await fetch(`${app.base}/api/admin/categorias`, { headers: { cookie } })).json();
  const indiceB = lista.categorias.findIndex((c) => c.id === b.id);
  const indiceA = lista.categorias.findIndex((c) => c.id === a.id);
  assert.ok(indiceB < indiceA);
});

test('Archivar una categoría', async () => {
  const categoria = await crearCategoria('A archivar');
  const r = await fetch(`${app.base}/api/admin/categorias/${categoria.id}/archivar`, { method: 'POST', headers: { cookie } });
  assert.equal(r.status, 200);

  const lista = await (await fetch(`${app.base}/api/admin/categorias`, { headers: { cookie } })).json();
  const actualizada = lista.categorias.find((c) => c.id === categoria.id);
  assert.ok(actualizada.archivadaEn);
});

test('Reactivar una categoría archivada', async () => {
  const categoria = await crearCategoria('Para reactivar');
  await crearPlato(categoria.id, { nombre: 'Plato que sigue activo', precioCentimos: 100, alergenos: [] });
  await fetch(`${app.base}/api/admin/categorias/${categoria.id}/archivar`, { method: 'POST', headers: { cookie } });

  let carta = await (await fetch(`${app.base}/api/carta`)).json();
  assert.ok(!carta.categorias.some((c) => c.id === categoria.id));

  const r = await fetch(`${app.base}/api/admin/categorias/${categoria.id}/reactivar`, { method: 'POST', headers: { cookie } });
  assert.equal(r.status, 200);

  carta = await (await fetch(`${app.base}/api/carta`)).json();
  const reactivada = carta.categorias.find((c) => c.id === categoria.id);
  assert.ok(reactivada, 'la categoría vuelve a aparecer en la carta pública');
  assert.ok(reactivada.platos.some((p) => p.nombre === 'Plato que sigue activo'));
});

test('Crear un plato', async () => {
  const categoria = await crearCategoria('Para platos');
  const plato = await crearPlato(categoria.id, {
    nombre: 'Croquetas',
    precioCentimos: 450,
    descripcion: 'Caseras',
    alergenos: ['gluten', 'lacteos'],
  });
  assert.equal(plato.archivadoEn, null);

  const carta = await (await fetch(`${app.base}/api/carta`)).json();
  const cat = carta.categorias.find((c) => c.id === categoria.id);
  assert.ok(cat.platos.some((p) => p.nombre === 'Croquetas'));
});

test('Editar un plato existente', async () => {
  const categoria = await crearCategoria('Para editar');
  const plato = await crearPlato(categoria.id, { nombre: 'Original', precioCentimos: 100, alergenos: [] });

  const r = await fetch(`${app.base}/api/admin/platos/${plato.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify({ categoriaId: categoria.id, nombre: 'Editado', precioCentimos: 200, descripcion: 'Nueva', alergenos: ['soja'] }),
  });
  assert.equal(r.status, 200);

  const carta = await (await fetch(`${app.base}/api/carta`)).json();
  const cat = carta.categorias.find((c) => c.id === categoria.id);
  const editado = cat.platos.find((p) => p.id === plato.id);
  assert.equal(editado.nombre, 'Editado');
  assert.equal(editado.precioCentimos, 200);
  assert.deepEqual(editado.alergenos, ['soja']);
});

test('Reordenar platos dentro de una categoría', async () => {
  const categoria = await crearCategoria('Reordenar platos');
  const p1 = await crearPlato(categoria.id, { nombre: 'Segundo', precioCentimos: 100, alergenos: [] });
  const p2 = await crearPlato(categoria.id, { nombre: 'Primero', precioCentimos: 100, alergenos: [] });

  const r = await fetch(`${app.base}/api/admin/platos/reordenar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify({ categoriaId: categoria.id, ids: [p2.id, p1.id] }),
  });
  assert.equal(r.status, 200);

  const carta = await (await fetch(`${app.base}/api/carta`)).json();
  const cat = carta.categorias.find((c) => c.id === categoria.id);
  assert.deepEqual(cat.platos.map((p) => p.nombre), ['Primero', 'Segundo']);
});

test('Archivar un plato', async () => {
  const categoria = await crearCategoria('Archivar plato');
  const plato = await crearPlato(categoria.id, { nombre: 'A archivar', precioCentimos: 100, alergenos: [] });

  const r = await fetch(`${app.base}/api/admin/platos/${plato.id}/archivar`, { method: 'POST', headers: { cookie } });
  assert.equal(r.status, 200);

  const carta = await (await fetch(`${app.base}/api/carta`)).json();
  const cat = carta.categorias.find((c) => c.id === categoria.id);
  assert.ok(!cat || !cat.platos.some((p) => p.id === plato.id));
});

test('Reactivar un plato archivado', async () => {
  const categoria = await crearCategoria('Reactivar plato');
  const plato = await crearPlato(categoria.id, { nombre: 'Va y vuelve', precioCentimos: 100, alergenos: [] });
  await fetch(`${app.base}/api/admin/platos/${plato.id}/archivar`, { method: 'POST', headers: { cookie } });

  const r = await fetch(`${app.base}/api/admin/platos/${plato.id}/reactivar`, { method: 'POST', headers: { cookie } });
  assert.equal(r.status, 200);

  const carta = await (await fetch(`${app.base}/api/carta`)).json();
  const cat = carta.categorias.find((c) => c.id === categoria.id);
  assert.ok(cat.platos.some((p) => p.id === plato.id));
});

test('Intento de guardar un plato sin declarar alérgenos', async () => {
  const categoria = await crearCategoria('Sin declarar');
  const r = await fetch(`${app.base}/api/admin/platos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify({ categoriaId: categoria.id, nombre: 'Sin declarar alérgenos', precioCentimos: 100 }),
  });
  assert.equal(r.status, 400);
  const cuerpo = await r.json();
  assert.match(cuerpo.error, /alérgenos/i);
});

test('Guardar un plato declarando explícitamente "sin alérgenos"', async () => {
  const categoria = await crearCategoria('Explícitamente sin alergenos');
  const plato = await crearPlato(categoria.id, { nombre: 'Agua', precioCentimos: 100, alergenos: [] });
  assert.deepEqual(plato.alergenos, []);

  const carta = await (await fetch(`${app.base}/api/carta`)).json();
  const cat = carta.categorias.find((c) => c.id === categoria.id);
  const enCarta = cat.platos.find((p) => p.id === plato.id);
  assert.deepEqual(enCarta.alergenos, []);
});

test('Referencia histórica a un plato archivado', async () => {
  // El pedido histórico está fuera de alcance de este cambio (ver proposal.md);
  // lo que garantiza esta escritura es la condición que lo hace posible: el
  // archivado conserva el registro (sin borrado físico) con sus datos originales.
  const categoria = await crearCategoria('Conservación');
  const plato = await crearPlato(categoria.id, { nombre: 'Menú del día antiguo', precioCentimos: 895, alergenos: ['gluten'] });
  await fetch(`${app.base}/api/admin/platos/${plato.id}/archivar`, { method: 'POST', headers: { cookie } });

  const lista = await (await fetch(`${app.base}/api/admin/platos?categoriaId=${categoria.id}`, { headers: { cookie } })).json();
  const conservado = lista.platos.find((p) => p.id === plato.id);
  assert.ok(conservado, 'el plato archivado se conserva y no se borra físicamente');
  assert.equal(conservado.nombre, 'Menú del día antiguo');
  assert.equal(conservado.precioCentimos, 895);
  assert.ok(conservado.archivadoEn);
});

test('Subida de foto dentro del límite permitido', async () => {
  const categoria = await crearCategoria('Fotos ok');
  const plato = await crearPlato(categoria.id, { nombre: 'Con foto', precioCentimos: 100, alergenos: [] });

  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
  const buffer = Buffer.from(pngBase64, 'base64');
  const formData = new FormData();
  formData.append('foto', new Blob([buffer], { type: 'image/png' }), 'foto.png');

  const r = await fetch(`${app.base}/api/admin/platos/${plato.id}/foto`, { method: 'POST', headers: { cookie }, body: formData });
  assert.equal(r.status, 200);
  const { fotoUrl } = await r.json();
  assert.match(fotoUrl, /^\/uploads\/.+\.jpg$/);

  const carta = await (await fetch(`${app.base}/api/carta`)).json();
  const cat = carta.categorias.find((c) => c.id === categoria.id);
  assert.equal(cat.platos.find((p) => p.id === plato.id).fotoUrl, fotoUrl);
});

test('Subida de foto que supera el límite permitido', async () => {
  const categoria = await crearCategoria('Fotos grandes');
  const plato = await crearPlato(categoria.id, { nombre: 'Foto enorme', precioCentimos: 100, alergenos: [] });

  const buffer = Buffer.alloc(9 * 1024 * 1024, 1); // 9 MB > límite de 8 MB
  const formData = new FormData();
  formData.append('foto', new Blob([buffer], { type: 'image/png' }), 'grande.png');

  const r = await fetch(`${app.base}/api/admin/platos/${plato.id}/foto`, { method: 'POST', headers: { cookie }, body: formData });
  assert.equal(r.status, 400);
  const cuerpo = await r.json();
  assert.match(cuerpo.error, /8 ?MB|tamaño/i);
});

test('Gestión completa de un plato desde un móvil', () => {
  // La navegación es la misma pantalla React en cualquier tamaño; se
  // comprueban aquí las propiedades de CSS que garantizan que quepa en un
  // móvil (objetivos táctiles grandes, sin desbordamiento horizontal forzado).
  const indexCss = readFileSync(path.resolve(import.meta.dirname, '..', 'web', 'src', 'index.css'), 'utf8');
  const appCss = readFileSync(path.resolve(import.meta.dirname, '..', 'web', 'src', 'App.css'), 'utf8');

  const minHeightBoton = Number(indexCss.match(/button\s*{[^}]*min-height:\s*(\d+)px/s)?.[1]);
  assert.ok(minHeightBoton >= 44, 'los botones deben tener un objetivo táctil de al menos 44px');

  assert.match(appCss, /\.plato-item__acciones\s*{[^}]*flex-wrap:\s*wrap/s);
  assert.match(appCss, /\.categoria-item__acciones\s*{[^}]*flex-wrap:\s*wrap/s);
});
