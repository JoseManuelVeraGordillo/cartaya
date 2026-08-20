// pedidos-mesa: Ciclo de vida del pedido tras confirmarse - transición
// lineal recibido -> en_preparacion -> servido, sin saltos ni retrocesos.
const SIGUIENTE_ESTADO = {
  recibido: 'en_preparacion',
  en_preparacion: 'servido',
};

export function siguienteEstadoValido(estadoActual) {
  return SIGUIENTE_ESTADO[estadoActual] ?? null;
}

// Envuelve la comprobación del estado actual y la escritura de cada
// transición en la misma transacción SQLite (serializada por better-sqlite3),
// para que dos tablets marcando el mismo pedido casi a la vez no puedan
// dejarlo en un estado inconsistente (design.md - Decisión de transición
// validada en el servidor).
export function crearGestionPedidos(db) {
  const obtenerEstado = db.prepare('SELECT estado FROM pedidos WHERE id = ?');
  const actualizarEstado = db.prepare('UPDATE pedidos SET estado = ? WHERE id = ?');
  const marcarCancelado = db.prepare('UPDATE pedidos SET estado = ?, cancelado_en = ? WHERE id = ?');

  const avanzarEstado = db.transaction((pedidoId) => {
    const fila = obtenerEstado.get(pedidoId);
    if (!fila) return { error: 'no_encontrado' };

    const siguiente = siguienteEstadoValido(fila.estado);
    if (!siguiente) return { error: 'transicion_invalida' };

    actualizarEstado.run(siguiente, pedidoId);
    return { ok: true };
  });

  const cancelarPedido = db.transaction((pedidoId) => {
    const fila = obtenerEstado.get(pedidoId);
    if (!fila) return { error: 'no_encontrado' };

    if (fila.estado !== 'recibido') return { error: 'transicion_invalida' };

    marcarCancelado.run('cancelado', new Date().toISOString(), pedidoId);
    return { ok: true };
  });

  return { avanzarEstado, cancelarPedido };
}
