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
  assert.equal(r.status, 201, 'la creación de categoría de apoyo para el test debe funcionar');
  return r.json();
}

async function crearPlato(categoriaId, datos) {
  const r = await fetch(`${app.base}/api/admin/platos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify({ categoriaId, alergenos: [], ...datos }),
  });
  assert.equal(r.status, 201, 'la creación de plato de apoyo para el test debe funcionar');
  return r.json();
}

async function archivarPlato(id) {
  const r = await fetch(`${app.base}/api/admin/platos/${id}/archivar`, { method: 'POST', headers: { cookie } });
  assert.equal(r.status, 200, 'el archivado de plato de apoyo para el test debe funcionar');
}

async function agotarPlato(id) {
  const r = await fetch(`${app.base}/api/admin/platos/${id}/agotar`, { method: 'POST', headers: { cookie } });
  assert.equal(r.status, 200, 'el agotado de plato de apoyo para el test debe funcionar');
}

async function crearMesa(nombre) {
  const r = await fetch(`${app.base}/api/admin/mesas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify({ nombre }),
  });
  assert.equal(r.status, 201, 'la creación de mesa de apoyo para el test debe funcionar');
  return r.json();
}

async function confirmarPedido(token, lineas) {
  return fetch(`${app.base}/api/mesas/${token}/pedidos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lineas }),
  });
}

test('Cliente escanea el QR de su mesa', async () => {
  const mesa = await crearMesa('Mesa QR');

  const r = await fetch(`${app.base}/api/mesas/${mesa.token}`);
  assert.equal(r.status, 200, 'el token del QR resuelve la mesa sin pedir sesión');
  assert.equal(r.headers.get('set-cookie'), null, 'no se establece ninguna sesión ni identificador de cliente');

  const cuerpo = await r.json();
  assert.equal(cuerpo.nombre, 'Mesa QR');
});

test('Pedido registrado sin dato personal', async () => {
  const categoria = await crearCategoria('Pedido sin dato personal');
  const plato = await crearPlato(categoria.id, { nombre: 'Tostada', precioCentimos: 200 });
  const mesa = await crearMesa('Mesa sin dato personal');

  const r = await confirmarPedido(mesa.token, [{ platoId: plato.id, cantidad: 1 }]);
  assert.equal(r.status, 201);
  const cuerpo = await r.json();

  assert.ok(cuerpo.pedido.id, 'el pedido queda registrado con un identificador');
  assert.deepEqual(
    Object.keys(cuerpo.pedido).sort(),
    ['estado', 'id', 'lineas', 'totalCentimos'],
    'el pedido no contiene ningún campo de dato personal del cliente'
  );
});

test('Añadir un plato con cantidad', async () => {
  const categoria = await crearCategoria('Cantidad');
  const plato = await crearPlato(categoria.id, { nombre: 'Croqueta', precioCentimos: 150 });
  const mesa = await crearMesa('Mesa cantidad');

  const r = await confirmarPedido(mesa.token, [{ platoId: plato.id, cantidad: 3 }]);
  assert.equal(r.status, 201);
  const { pedido } = await r.json();

  assert.equal(pedido.lineas.length, 1);
  assert.equal(pedido.lineas[0].cantidad, 3);
  assert.equal(pedido.totalCentimos, 450);
});

test('Añadir una nota dentro del límite', async () => {
  const categoria = await crearCategoria('Nota corta');
  const plato = await crearPlato(categoria.id, { nombre: 'Bocadillo', precioCentimos: 300 });
  const mesa = await crearMesa('Mesa nota corta');
  const nota = 'Sin cebolla, por favor.';

  const r = await confirmarPedido(mesa.token, [{ platoId: plato.id, cantidad: 1, nota }]);
  assert.equal(r.status, 201);
  const { pedido } = await r.json();

  assert.equal(pedido.lineas[0].nota, nota);
});

test('Intento de nota que supera el límite', async () => {
  const categoria = await crearCategoria('Nota larga');
  const plato = await crearPlato(categoria.id, { nombre: 'Ensalada', precioCentimos: 400 });
  const mesa = await crearMesa('Mesa nota larga');
  const notaDemasiadoLarga = 'x'.repeat(141);

  const r = await confirmarPedido(mesa.token, [{ platoId: plato.id, cantidad: 1, nota: notaDemasiadoLarga }]);
  assert.equal(r.status, 400, 'el servidor no permite superar el límite de 140 caracteres');
  const cuerpo = await r.json();
  assert.match(cuerpo.error, /140/);

  const pedidos = await (await fetch(`${app.base}/api/mesas/${mesa.token}/pedidos`)).json();
  assert.equal(pedidos.pedidos.length, 0, 'no se crea ningún pedido cuando la nota supera el límite');
});

test('Cliente revisa el resumen antes de confirmar', () => {
  // El resumen se calcula en el cliente a partir del carrito ya cargado (no
  // hay un endpoint de "vista previa"); se comprueba aquí que la pantalla de
  // resumen muestra cantidad, nota y total antes del botón de confirmar,
  // igual que el proyecto ya comprueba reglas de UI leyendo el código fuente
  // (ver "Texto legible a contraluz" en carta-publica.test.js).
  const resumen = readFileSync(
    path.resolve(import.meta.dirname, '..', 'web', 'src', 'pages', 'Pedido', 'ResumenPedido.jsx'),
    'utf8'
  );
  assert.match(resumen, /linea\.nombre/);
  assert.match(resumen, /linea\.cantidad/);
  assert.match(resumen, /linea\.nota/);
  assert.match(resumen, /Total/);
  assert.match(resumen, /Confirmar pedido/);
});

test('Cliente confirma el pedido sin dato personal', async () => {
  const categoria = await crearCategoria('Confirmación sin dato');
  const plato = await crearPlato(categoria.id, { nombre: 'Zumo', precioCentimos: 250 });
  const mesa = await crearMesa('Mesa confirmación');

  const r = await confirmarPedido(mesa.token, [{ platoId: plato.id, cantidad: 1 }]);
  assert.equal(r.status, 201, 'el pedido se confirma sin exigir registro, email ni teléfono en la petición');
});

test('Confirmación tras enviar el pedido', async () => {
  const categoria = await crearCategoria('Confirmación visible');
  const plato = await crearPlato(categoria.id, { nombre: 'Café solo', precioCentimos: 120 });
  const mesa = await crearMesa('Mesa confirmación visible');

  const r = await confirmarPedido(mesa.token, [{ platoId: plato.id, cantidad: 1 }]);
  const { pedido } = await r.json();

  assert.ok(Number.isInteger(pedido.id), 'la confirmación incluye un número de pedido');
  assert.equal(pedido.estado, 'recibido', 'la confirmación incluye el estado actual del pedido');
});

test('Un plato del pedido deja de estar activo antes de confirmar', async () => {
  const categoria = await crearCategoria('Un plato no disponible');
  const disponible = await crearPlato(categoria.id, { nombre: 'Se mantiene', precioCentimos: 200 });
  const archivado = await crearPlato(categoria.id, { nombre: 'Se retira', precioCentimos: 300 });
  await archivarPlato(archivado.id);
  const mesa = await crearMesa('Mesa un plato no disponible');

  const r = await confirmarPedido(mesa.token, [
    { platoId: disponible.id, cantidad: 1 },
    { platoId: archivado.id, cantidad: 1 },
  ]);
  assert.equal(r.status, 201, 'el resto del pedido se envía aunque un plato no esté disponible');
  const cuerpo = await r.json();

  assert.equal(cuerpo.pedido.lineas.length, 1);
  assert.equal(cuerpo.pedido.lineas[0].platoId, disponible.id);
  assert.ok(
    cuerpo.descartados.some((d) => d.platoId === archivado.id),
    'el sistema avisa de qué plato se ha retirado del pedido'
  );
});

test('Intento de añadir un plato agotado', () => {
  // Igual que "Cliente revisa el resumen antes de confirmar", no hay endpoint
  // de "añadir al carrito" (el carrito vive solo en el cliente hasta
  // confirmar), así que se comprueba en el código fuente que los controles
  // para añadir quedan deshabilitados cuando el plato está agotado.
  const anadirAlPedido = readFileSync(
    path.resolve(import.meta.dirname, '..', 'web', 'src', 'pages', 'Pedido', 'AnadirAlPedido.jsx'),
    'utf8'
  );
  const coincidencias = anadirAlPedido.match(/disabled=\{agotado\}/g) ?? [];
  assert.ok(
    coincidencias.length >= 3,
    'los controles de cantidad, nota y el botón de añadir deben deshabilitarse cuando el plato está agotado'
  );
});

test('Un plato del pedido pasa a agotado antes de confirmar', async () => {
  const categoria = await crearCategoria('Un plato pasa a agotado');
  const disponible = await crearPlato(categoria.id, { nombre: 'Sigue disponible', precioCentimos: 200 });
  const agotado = await crearPlato(categoria.id, { nombre: 'Se agota antes de confirmar', precioCentimos: 300 });
  await agotarPlato(agotado.id);
  const mesa = await crearMesa('Mesa un plato agotado');

  const r = await confirmarPedido(mesa.token, [
    { platoId: disponible.id, cantidad: 1 },
    { platoId: agotado.id, cantidad: 1 },
  ]);
  assert.equal(r.status, 201, 'el resto del pedido se envía aunque un plato esté agotado');
  const cuerpo = await r.json();

  assert.equal(cuerpo.pedido.lineas.length, 1);
  assert.equal(cuerpo.pedido.lineas[0].platoId, disponible.id);
  assert.ok(
    cuerpo.descartados.some((d) => d.platoId === agotado.id),
    'el sistema avisa de qué plato agotado se ha retirado del pedido'
  );
});

test('Un plato activo y no agotado se añade con normalidad aunque otro plato de la carta esté agotado', async () => {
  const categoria = await crearCategoria('Convive con agotado');
  const disponible = await crearPlato(categoria.id, { nombre: 'No afectado', precioCentimos: 150 });
  const agotado = await crearPlato(categoria.id, { nombre: 'Agotado en la misma carta', precioCentimos: 500 });
  await agotarPlato(agotado.id);
  const mesa = await crearMesa('Mesa convive con agotado');

  const r = await confirmarPedido(mesa.token, [{ platoId: disponible.id, cantidad: 2 }]);
  assert.equal(r.status, 201);
  const { pedido, descartados } = await r.json();

  assert.equal(pedido.lineas.length, 1);
  assert.equal(pedido.lineas[0].cantidad, 2);
  assert.equal(pedido.totalCentimos, 300);
  assert.equal(descartados.length, 0, 'el plato agotado de otro pedido no afecta a uno que no lo incluye');
});

test('Ningún plato disponible por estar archivado o agotado', async () => {
  const categoria = await crearCategoria('Archivado y agotado');
  const archivado = await crearPlato(categoria.id, { nombre: 'Se archiva', precioCentimos: 200 });
  const agotado = await crearPlato(categoria.id, { nombre: 'Se agota', precioCentimos: 300 });
  await archivarPlato(archivado.id);
  await agotarPlato(agotado.id);
  const mesa = await crearMesa('Mesa archivado y agotado');

  const r = await confirmarPedido(mesa.token, [
    { platoId: archivado.id, cantidad: 1 },
    { platoId: agotado.id, cantidad: 1 },
  ]);
  assert.equal(r.status, 200, 'no se crea ningún pedido cuando no queda ningún plato disponible');
  const cuerpo = await r.json();

  assert.equal(cuerpo.pedido, null);
  assert.deepEqual(
    cuerpo.descartados.map((d) => d.platoId).sort(),
    [archivado.id, agotado.id].sort()
  );

  const pedidos = await (await fetch(`${app.base}/api/mesas/${mesa.token}/pedidos`)).json();
  assert.equal(pedidos.pedidos.length, 0, 'no se envía ningún pedido');
});

test('Todos los platos del pedido dejan de estar activos antes de confirmar', async () => {
  const categoria = await crearCategoria('Ningún plato disponible');
  const plato = await crearPlato(categoria.id, { nombre: 'Se retira del todo', precioCentimos: 300 });
  await archivarPlato(plato.id);
  const mesa = await crearMesa('Mesa ningún plato disponible');

  const r = await confirmarPedido(mesa.token, [{ platoId: plato.id, cantidad: 1 }]);
  assert.equal(r.status, 200, 'no se crea ningún pedido cuando no queda ningún plato disponible');
  const cuerpo = await r.json();

  assert.equal(cuerpo.pedido, null);
  assert.ok(cuerpo.descartados.some((d) => d.platoId === plato.id));

  const pedidos = await (await fetch(`${app.base}/api/mesas/${mesa.token}/pedidos`)).json();
  assert.equal(pedidos.pedidos.length, 0, 'no se envía ningún pedido');
});

test('Segunda confirmación de pedido desde la misma mesa', async () => {
  const categoria = await crearCategoria('Varios pedidos');
  const plato = await crearPlato(categoria.id, { nombre: 'Agua', precioCentimos: 100 });
  const mesa = await crearMesa('Mesa varios pedidos');

  const primero = await (await confirmarPedido(mesa.token, [{ platoId: plato.id, cantidad: 1 }])).json();
  const segundo = await (await confirmarPedido(mesa.token, [{ platoId: plato.id, cantidad: 2 }])).json();

  assert.notEqual(primero.pedido.id, segundo.pedido.id, 'cada confirmación crea un pedido independiente');

  const pedidos = await (await fetch(`${app.base}/api/mesas/${mesa.token}/pedidos`)).json();
  assert.equal(pedidos.pedidos.length, 2);
  const primeroTrasSegundo = pedidos.pedidos.find((p) => p.id === primero.pedido.id);
  assert.equal(
    primeroTrasSegundo.lineas[0].cantidad,
    1,
    'el pedido anterior no se modifica al confirmar uno nuevo'
  );
});

test('La confirmación nunca incluye un plato archivado justo antes de confirmar (condición de carrera)', async () => {
  const categoria = await crearCategoria('Condición de carrera');
  const seMantiene = await crearPlato(categoria.id, { nombre: 'Se mantiene en carrera', precioCentimos: 500 });
  const seArchiva = await crearPlato(categoria.id, { nombre: 'Se archiva en carrera', precioCentimos: 700 });
  const mesa = await crearMesa('Mesa condición de carrera');

  // El plato se archiva justo antes de que llegue la confirmación: al ser la
  // revalidación y la creación del pedido parte de la misma transacción
  // SQLite (serializada por better-sqlite3), no puede colarse en el pedido.
  await archivarPlato(seArchiva.id);

  const r = await confirmarPedido(mesa.token, [
    { platoId: seMantiene.id, cantidad: 1 },
    { platoId: seArchiva.id, cantidad: 2 },
  ]);
  const { pedido, descartados } = await r.json();

  assert.ok(
    !pedido.lineas.some((l) => l.platoId === seArchiva.id),
    'el pedido resultante nunca incluye el plato archivado'
  );
  assert.equal(pedido.totalCentimos, 500, 'el total solo refleja los platos que seguían disponibles');
  assert.deepEqual(descartados.map((d) => d.platoId), [seArchiva.id]);
});

test('Token de mesa desconocido o inválido no expone datos de ninguna mesa real', async () => {
  await crearMesa('Mesa real');

  const consulta = await fetch(`${app.base}/api/mesas/token-que-no-existe`);
  assert.equal(consulta.status, 404);
  const cuerpoConsulta = await consulta.json();
  assert.ok(!('nombre' in cuerpoConsulta), 'la respuesta no filtra el nombre de ninguna mesa real');

  const listado = await fetch(`${app.base}/api/mesas/token-que-no-existe/pedidos`);
  assert.equal(listado.status, 404);

  const confirmacion = await confirmarPedido('token-que-no-existe', [{ platoId: 1, cantidad: 1 }]);
  assert.equal(confirmacion.status, 404);
});
