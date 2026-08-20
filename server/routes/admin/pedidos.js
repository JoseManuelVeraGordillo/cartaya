import { Router } from 'express';
import { db } from '../../db/index.js';
import { listarLineasDePedido, filaALinea } from '../../lib/lineasPedido.js';
import { crearGestionPedidos } from '../../lib/pedidos.js';
import { registrarClienteSSE, eliminarClienteSSE, emitirEvento } from '../../lib/sse.js';

export const pedidosRouter = Router();

const { avanzarEstado, cancelarPedido } = crearGestionPedidos(db);

const CAMPOS_PEDIDO = `
  p.id, p.estado, p.total_centimos, p.creado_en, p.cancelado_en, m.nombre AS mesa_nombre
`;

// panel-cocina: Listado de pedidos activos del día por antigüedad - excluye
// servido y cancelado, ordenados del más antiguo al más reciente.
const listarActivosHoy = db.prepare(`
  SELECT ${CAMPOS_PEDIDO}
  FROM pedidos p JOIN mesas m ON m.id = p.mesa_id
  WHERE date(p.creado_en, 'localtime') = date('now', 'localtime')
    AND p.estado NOT IN ('servido', 'cancelado')
  ORDER BY p.creado_en ASC, p.id ASC
`);

// panel-cocina: Histórico de pedidos del día - todos los estados, incluidos
// servido y cancelado.
const listarHistoricoHoy = db.prepare(`
  SELECT ${CAMPOS_PEDIDO}
  FROM pedidos p JOIN mesas m ON m.id = p.mesa_id
  WHERE date(p.creado_en, 'localtime') = date('now', 'localtime')
  ORDER BY p.creado_en DESC, p.id DESC
`);

const obtenerPedido = db.prepare(`
  SELECT ${CAMPOS_PEDIDO}
  FROM pedidos p JOIN mesas m ON m.id = p.mesa_id
  WHERE p.id = ?
`);

function filaAPedido(fila) {
  return {
    id: fila.id,
    mesa: fila.mesa_nombre,
    estado: fila.estado,
    totalCentimos: fila.total_centimos,
    creadoEn: fila.creado_en,
    canceladoEn: fila.cancelado_en,
    lineas: listarLineasDePedido.all(fila.id).map(filaALinea),
  };
}

pedidosRouter.get('/activos', (req, res) => {
  res.json({ pedidos: listarActivosHoy.all().map(filaAPedido) });
});

pedidosRouter.get('/historico', (req, res) => {
  res.json({ pedidos: listarHistoricoHoy.all().map(filaAPedido) });
});

function transicionOError(req, res, transicion, mensajeRechazo) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(404).json({ error: 'Pedido no encontrado.' });
    return null;
  }

  const resultado = transicion(id);
  if (resultado.error === 'no_encontrado') {
    res.status(404).json({ error: 'Pedido no encontrado.' });
    return null;
  }
  if (resultado.error === 'transicion_invalida') {
    res.status(409).json({ error: mensajeRechazo });
    return null;
  }

  const pedido = filaAPedido(obtenerPedido.get(id));
  emitirEvento('pedido-actualizado', pedido);
  return pedido;
}

pedidosRouter.post('/:id/avanzar', (req, res) => {
  const pedido = transicionOError(
    req,
    res,
    avanzarEstado,
    'El pedido no puede avanzar a un estado que no sea el siguiente de la secuencia.'
  );
  if (pedido) res.json(pedido);
});

pedidosRouter.post('/:id/cancelar', (req, res) => {
  const pedido = transicionOError(
    req,
    res,
    cancelarPedido,
    'Solo se puede cancelar un pedido que todavía esté en estado "recibido".'
  );
  if (pedido) res.json(pedido);
});

// panel-cocina: Aparición en tiempo real de pedidos nuevos y cambios de
// estado - conexión SSE mantenida abierta mientras la tablet tiene el panel
// abierto (design.md - Decisión SSE con emisor en memoria).
pedidosRouter.get('/eventos', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  registrarClienteSSE(res);
  req.on('close', () => eliminarClienteSSE(res));
});
