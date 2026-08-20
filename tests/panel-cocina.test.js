import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { crearAppDePrueba, iniciarSesionDePrueba } from './helpers.js';
import { siguienteEstadoValido } from '../server/lib/pedidos.js';

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
  const r = await fetch(`${app.base}/api/mesas/${token}/pedidos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lineas }),
  });
  assert.equal(r.status, 201, 'la confirmación de pedido de apoyo para el test debe funcionar');
  return (await r.json()).pedido;
}

// Crea de un tirón categoría + plato + mesa + pedido confirmado ('recibido'),
// que es el punto de partida habitual de estos tests.
async function crearPedidoDePrueba(nombreMesa) {
  const sufijo = Math.random().toString(36).slice(2);
  const categoria = await crearCategoria(`Categoría ${sufijo}`);
  const plato = await crearPlato(categoria.id, { nombre: `Plato ${sufijo}`, precioCentimos: 150 });
  const mesa = await crearMesa(nombreMesa ?? `Mesa ${sufijo}`);
  const pedido = await confirmarPedido(mesa.token, [{ platoId: plato.id, cantidad: 1 }]);
  return { pedido, mesa };
}

function avanzar(id) {
  return fetch(`${app.base}/api/admin/pedidos/${id}/avanzar`, { method: 'POST', headers: { cookie } });
}

function cancelar(id) {
  return fetch(`${app.base}/api/admin/pedidos/${id}/cancelar`, { method: 'POST', headers: { cookie } });
}

async function listarActivos() {
  const r = await fetch(`${app.base}/api/admin/pedidos/activos`, { headers: { cookie } });
  assert.equal(r.status, 200);
  return (await r.json()).pedidos;
}

async function listarHistorico() {
  const r = await fetch(`${app.base}/api/admin/pedidos/historico`, { headers: { cookie } });
  assert.equal(r.status, 200);
  return (await r.json()).pedidos;
}

// Abre la conexión SSE y expone una forma de esperar el próximo evento de un
// tipo dado, leyendo el stream de la respuesta a mano (no hay EventSource en
// node:test).
async function conectarEventos() {
  const respuesta = await fetch(`${app.base}/api/admin/pedidos/eventos`, { headers: { cookie } });
  assert.equal(respuesta.status, 200);
  const lector = respuesta.body.getReader();
  const decodificador = new TextDecoder();
  let buffer = '';

  function esperarEvento(tipoEsperado, timeoutMs = 2000) {
    const bucle = (async () => {
      while (true) {
        const { value, done } = await lector.read();
        if (done) throw new Error('El canal SSE se cerró antes de recibir el evento esperado.');
        buffer += decodificador.decode(value, { stream: true });

        let indice;
        while ((indice = buffer.indexOf('\n\n')) !== -1) {
          const bloque = buffer.slice(0, indice);
          buffer = buffer.slice(indice + 2);
          const lineas = bloque.split('\n');
          const tipo = lineas.find((l) => l.startsWith('event: '))?.slice('event: '.length);
          const datos = lineas.find((l) => l.startsWith('data: '))?.slice('data: '.length);
          if (tipo === tipoEsperado && datos) return JSON.parse(datos);
        }
      }
    })();

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`No se recibió el evento "${tipoEsperado}" a tiempo.`)), timeoutMs)
    );

    return Promise.race([bucle, timeout]);
  }

  return { esperarEvento, cerrar: () => lector.cancel() };
}

// 6.3 Acceso protegido por sesión (mismo patrón que tests/admin-auth.test.js)

const rutasProtegidas = [
  { metodo: 'GET', ruta: '/api/admin/pedidos/activos' },
  { metodo: 'GET', ruta: '/api/admin/pedidos/historico' },
  { metodo: 'POST', ruta: '/api/admin/pedidos/1/avanzar' },
  { metodo: 'POST', ruta: '/api/admin/pedidos/1/cancelar' },
  { metodo: 'GET', ruta: '/api/admin/pedidos/eventos' },
];

for (const { metodo, ruta } of rutasProtegidas) {
  test(`rechaza ${metodo} ${ruta} sin sesión de establecimiento`, async () => {
    const r = await fetch(`${app.base}${ruta}`, { method: metodo });
    assert.equal(r.status, 401);
  });
}

// 6.1 Transición de estado (pedidos-mesa: Ciclo de vida del pedido tras confirmarse)

test('Transición de recibido a en_preparacion', async () => {
  const { pedido } = await crearPedidoDePrueba();
  const r = await avanzar(pedido.id);
  assert.equal(r.status, 200);
  const cuerpo = await r.json();
  assert.equal(cuerpo.estado, 'en_preparacion');
});

test('Transición de en_preparacion a servido', async () => {
  const { pedido } = await crearPedidoDePrueba();
  await avanzar(pedido.id);
  const r = await avanzar(pedido.id);
  assert.equal(r.status, 200);
  const cuerpo = await r.json();
  assert.equal(cuerpo.estado, 'servido');
});

test('Intento de saltar de recibido a servido', () => {
  // La API solo ofrece "avanzar al siguiente estado": nunca puede llevar a
  // un pedido "recibido" directamente a "servido" en un único paso.
  assert.equal(siguienteEstadoValido('recibido'), 'en_preparacion');
});

test('Intento de retroceder el estado de un pedido', async () => {
  assert.equal(siguienteEstadoValido('servido'), null, 'un pedido servido no tiene transición hacia delante');
  assert.equal(siguienteEstadoValido('cancelado'), null, 'un pedido cancelado no tiene transición hacia delante');

  const { pedido } = await crearPedidoDePrueba();
  await avanzar(pedido.id);
  await avanzar(pedido.id); // servido
  const r = await avanzar(pedido.id); // sin transición válida desde 'servido'
  assert.equal(r.status, 409);

  const historico = await listarHistorico();
  const actualizado = historico.find((p) => p.id === pedido.id);
  assert.equal(actualizado.estado, 'servido', 'el pedido conserva su estado tras el intento rechazado');
});

// 6.2 Cancelación

test('Cancelar un pedido en estado recibido', async () => {
  const { pedido } = await crearPedidoDePrueba();
  const r = await cancelar(pedido.id);
  assert.equal(r.status, 200);
  const cuerpo = await r.json();
  assert.equal(cuerpo.estado, 'cancelado');
  assert.ok(cuerpo.canceladoEn, 'se registra el momento de la cancelación');
});

test('Rechazo de cancelar un pedido ya en preparación', async () => {
  const { pedido } = await crearPedidoDePrueba();
  await avanzar(pedido.id);
  const r = await cancelar(pedido.id);
  assert.equal(r.status, 409);

  const historico = await listarHistorico();
  const actualizado = historico.find((p) => p.id === pedido.id);
  assert.equal(actualizado.estado, 'en_preparacion', 'el pedido conserva su estado tras el intento rechazado');
});

test('Rechazo de cancelar un pedido servido', async () => {
  const { pedido } = await crearPedidoDePrueba();
  await avanzar(pedido.id);
  await avanzar(pedido.id);
  const r = await cancelar(pedido.id);
  assert.equal(r.status, 409);
});

test('La cancelación registra cancelado_en sin eliminar el pedido', async () => {
  const { pedido } = await crearPedidoDePrueba();
  await cancelar(pedido.id);

  const historico = await listarHistorico();
  const actualizado = historico.find((p) => p.id === pedido.id);
  assert.ok(actualizado, 'el pedido cancelado sigue existiendo en el sistema');
  assert.equal(actualizado.estado, 'cancelado');
  assert.ok(actualizado.canceladoEn);
});

// 6.4 Listados de activos e histórico

test('Pedidos activos ordenados por antigüedad', async () => {
  const { pedido: primero } = await crearPedidoDePrueba('Mesa orden 1');
  const { pedido: segundo } = await crearPedidoDePrueba('Mesa orden 2');

  const activos = await listarActivos();
  const indicePrimero = activos.findIndex((p) => p.id === primero.id);
  const indiceSegundo = activos.findIndex((p) => p.id === segundo.id);
  assert.ok(indicePrimero !== -1 && indiceSegundo !== -1);
  assert.ok(indicePrimero < indiceSegundo, 'el pedido más antiguo aparece antes que el más reciente');
});

test('El listado de activos excluye pedidos servidos y cancelados', async () => {
  const { pedido: activo } = await crearPedidoDePrueba('Mesa que sigue activa');
  const { pedido: servido } = await crearPedidoDePrueba('Mesa que se sirve');
  const { pedido: cancelado } = await crearPedidoDePrueba('Mesa que se cancela');

  await avanzar(servido.id);
  await avanzar(servido.id);
  await cancelar(cancelado.id);

  const activos = await listarActivos();
  assert.ok(activos.some((p) => p.id === activo.id));
  assert.ok(!activos.some((p) => p.id === servido.id), 'un pedido servido no aparece entre los activos');
  assert.ok(!activos.some((p) => p.id === cancelado.id), 'un pedido cancelado no aparece entre los activos');
});

test('Datos completos de cada pedido activo', async () => {
  const categoria = await crearCategoria('Datos completos');
  const plato = await crearPlato(categoria.id, { nombre: 'Tostada con tomate', precioCentimos: 250 });
  const mesa = await crearMesa('Mesa datos completos');
  await confirmarPedido(mesa.token, [{ platoId: plato.id, cantidad: 2, nota: 'Sin sal' }]);

  const activos = await listarActivos();
  const pedido = activos.find((p) => p.mesa === 'Mesa datos completos');
  assert.ok(pedido, 'el pedido aparece en el listado de activos con su mesa');
  assert.equal(pedido.lineas.length, 1);
  assert.equal(pedido.lineas[0].nombre, 'Tostada con tomate');
  assert.equal(pedido.lineas[0].cantidad, 2);
  assert.equal(pedido.lineas[0].nota, 'Sin sal');
  assert.ok(pedido.creadoEn, 'incluye el momento de confirmación con el que calcular el tiempo transcurrido');
});

test('El histórico del día incluye todos los estados', async () => {
  const { pedido: recibido } = await crearPedidoDePrueba('Mesa histórico recibido');
  const { pedido: servido } = await crearPedidoDePrueba('Mesa histórico servido');
  const { pedido: cancelado } = await crearPedidoDePrueba('Mesa histórico cancelado');

  await avanzar(servido.id);
  await avanzar(servido.id);
  await cancelar(cancelado.id);

  const historico = await listarHistorico();
  const estadoPorId = new Map(historico.map((p) => [p.id, p.estado]));
  assert.equal(estadoPorId.get(recibido.id), 'recibido');
  assert.equal(estadoPorId.get(servido.id), 'servido');
  assert.equal(estadoPorId.get(cancelado.id), 'cancelado');
});

// 6.5 Canal SSE

test('Un pedido nuevo emite el evento "pedido-nuevo" a los clientes conectados', async () => {
  const eventos = await conectarEventos();
  try {
    const categoria = await crearCategoria('SSE pedido nuevo');
    const plato = await crearPlato(categoria.id, { nombre: 'Café solo', precioCentimos: 120 });
    const mesa = await crearMesa('Mesa SSE pedido nuevo');

    const [, datosEvento] = await Promise.all([
      confirmarPedido(mesa.token, [{ platoId: plato.id, cantidad: 1 }]),
      eventos.esperarEvento('pedido-nuevo'),
    ]);

    assert.equal(datosEvento.mesa, 'Mesa SSE pedido nuevo');
    assert.equal(datosEvento.estado, 'recibido');
  } finally {
    eventos.cerrar();
  }
});

test('Un cambio de estado emite el evento "pedido-actualizado" a los clientes conectados', async () => {
  const { pedido } = await crearPedidoDePrueba('Mesa SSE cambio de estado');
  const eventos = await conectarEventos();
  try {
    const [, datosEvento] = await Promise.all([avanzar(pedido.id), eventos.esperarEvento('pedido-actualizado')]);
    assert.equal(datosEvento.id, pedido.id);
    assert.equal(datosEvento.estado, 'en_preparacion');
  } finally {
    eventos.cerrar();
  }
});
