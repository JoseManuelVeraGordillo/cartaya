import { Router } from 'express';
import { db } from '../db/index.js';
import { listarLineasDePedido, filaALinea } from '../lib/lineasPedido.js';
import { emitirEvento } from '../lib/sse.js';

export const mesasRouter = Router();

const LIMITE_NOTA = 140;

const obtenerMesaPorToken = db.prepare('SELECT id, nombre, token FROM mesas WHERE token = ?');
const obtenerPlatoPorId = db.prepare('SELECT * FROM platos WHERE id = ?');
const insertarPedido = db.prepare(`
  INSERT INTO pedidos (mesa_id, estado, total_centimos, creado_en)
  VALUES (?, 'recibido', ?, ?)
`);
const insertarLinea = db.prepare(`
  INSERT INTO lineas_pedido (pedido_id, plato_id, nombre_plato, precio_centimos, cantidad, nota)
  VALUES (?, ?, ?, ?, ?, ?)
`);
const listarPedidosDeMesa = db.prepare(
  'SELECT id, estado, total_centimos, creado_en FROM pedidos WHERE mesa_id = ? ORDER BY id ASC'
);

function filaAPedido(fila) {
  return {
    id: fila.id,
    estado: fila.estado,
    totalCentimos: fila.total_centimos,
    lineas: listarLineasDePedido.all(fila.id).map(filaALinea),
  };
}

// Un token desconocido responde igual que uno inválido, sin distinguir el
// motivo, para no filtrar información de otras mesas (pedidos-mesa:
// Identificación de la mesa mediante QR).
function mesaOError(req, res) {
  const mesa = obtenerMesaPorToken.get(req.params.token);
  if (!mesa) {
    res.status(404).json({ error: 'Mesa no encontrada.' });
    return null;
  }
  return mesa;
}

mesasRouter.get('/mesas/:token', (req, res) => {
  const mesa = mesaOError(req, res);
  if (!mesa) return;
  res.json({ id: mesa.id, nombre: mesa.nombre });
});

mesasRouter.get('/mesas/:token/pedidos', (req, res) => {
  const mesa = mesaOError(req, res);
  if (!mesa) return;
  res.json({ pedidos: listarPedidosDeMesa.all(mesa.id).map(filaAPedido) });
});

function validarLineas(body) {
  const lineas = Array.isArray(body?.lineas) ? body.lineas : null;
  if (!lineas || lineas.length === 0) {
    return { error: 'El pedido debe incluir al menos un plato.' };
  }

  const validadas = [];
  for (const linea of lineas) {
    const platoId = Number(linea?.platoId);
    const cantidad = Number(linea?.cantidad);
    const nota = typeof linea?.nota === 'string' ? linea.nota.trim() : '';

    if (!Number.isInteger(platoId)) {
      return { error: 'Cada línea del pedido debe indicar un plato válido.' };
    }
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      return { error: 'Cada línea del pedido debe indicar una cantidad mayor que cero.' };
    }
    if (nota.length > LIMITE_NOTA) {
      return { error: `La nota de cada plato no puede superar los ${LIMITE_NOTA} caracteres.` };
    }
    validadas.push({ platoId, cantidad, nota });
  }
  return { lineas: validadas };
}

mesasRouter.post('/mesas/:token/pedidos', (req, res) => {
  const mesa = mesaOError(req, res);
  if (!mesa) return;

  const { error, lineas } = validarLineas(req.body);
  if (error) return res.status(400).json({ error });

  // Revalidación de disponibilidad y creación del pedido dentro de la misma
  // transacción, para que ambas usen el estado más reciente del catálogo y
  // no pueda quedar un pedido a medio escribir (design.md: Decisión de
  // revalidación transaccional).
  const creadoEn = new Date().toISOString();
  const confirmar = db.transaction(() => {
    const lineasValidas = [];
    const descartados = [];

    for (const linea of lineas) {
      const plato = obtenerPlatoPorId.get(linea.platoId);
      if (!plato || plato.archivado_en) {
        descartados.push({ platoId: linea.platoId, nombre: plato?.nombre ?? null });
        continue;
      }
      lineasValidas.push({ ...linea, plato });
    }

    if (lineasValidas.length === 0) {
      return { pedido: null, descartados };
    }

    const totalCentimos = lineasValidas.reduce(
      (suma, l) => suma + l.plato.precio_centimos * l.cantidad,
      0
    );
    const { lastInsertRowid: pedidoId } = insertarPedido.run(mesa.id, totalCentimos, creadoEn);
    for (const l of lineasValidas) {
      insertarLinea.run(pedidoId, l.plato.id, l.plato.nombre, l.plato.precio_centimos, l.cantidad, l.nota);
    }

    return {
      pedido: filaAPedido({ id: pedidoId, estado: 'recibido', total_centimos: totalCentimos }),
      descartados,
    };
  });

  const resultado = confirmar();

  // panel-cocina: aviso en tiempo real de pedido nuevo, emitido tras
  // confirmar la transacción (design.md - Decisión SSE).
  if (resultado.pedido) {
    emitirEvento('pedido-nuevo', {
      id: resultado.pedido.id,
      mesa: mesa.nombre,
      estado: resultado.pedido.estado,
      creadoEn,
      canceladoEn: null,
      lineas: resultado.pedido.lineas,
    });
  }

  res.status(resultado.pedido ? 201 : 200).json(resultado);
});
