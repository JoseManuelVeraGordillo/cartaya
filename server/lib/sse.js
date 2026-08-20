// Primer canal SSE de la aplicación (design.md - Decisión "SSE con un único
// endpoint de suscripción"): registro en memoria de conexiones abiertas, en
// el mismo proceso Node, sin broker externo (mismo patrón que las sesiones
// en memoria de server/middleware/session.js).
const clientesConectados = new Set();

export function registrarClienteSSE(res) {
  clientesConectados.add(res);
}

export function eliminarClienteSSE(res) {
  clientesConectados.delete(res);
}

export function emitirEvento(tipo, datos) {
  const mensaje = `event: ${tipo}\ndata: ${JSON.stringify(datos)}\n\n`;
  for (const res of clientesConectados) {
    res.write(mensaje);
  }
}
