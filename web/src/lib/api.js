async function peticion(ruta, opciones = {}) {
  const respuesta = await fetch(ruta, {
    ...opciones,
    headers: opciones.body ? { 'Content-Type': 'application/json', ...opciones.headers } : opciones.headers,
    credentials: 'same-origin',
  });
  const contentType = respuesta.headers.get('content-type') || '';
  const cuerpo = contentType.includes('application/json') ? await respuesta.json() : null;
  if (!respuesta.ok) {
    throw new Error(cuerpo?.error || `Error inesperado (${respuesta.status}).`);
  }
  return cuerpo;
}

export const api = {
  obtenerCarta: () => peticion('/api/carta'),

  iniciarSesion: (password) =>
    peticion('/api/admin/login', { method: 'POST', body: JSON.stringify({ password }) }),
  cerrarSesion: () => peticion('/api/admin/logout', { method: 'POST' }),
  comprobarSesion: () => peticion('/api/admin/sesion'),

  listarCategorias: () => peticion('/api/admin/categorias'),
  crearCategoria: (nombre) =>
    peticion('/api/admin/categorias', { method: 'POST', body: JSON.stringify({ nombre }) }),
  editarCategoria: (id, nombre) =>
    peticion(`/api/admin/categorias/${id}`, { method: 'PUT', body: JSON.stringify({ nombre }) }),
  archivarCategoria: (id) =>
    peticion(`/api/admin/categorias/${id}/archivar`, { method: 'POST' }),
  reactivarCategoria: (id) =>
    peticion(`/api/admin/categorias/${id}/reactivar`, { method: 'POST' }),
  reordenarCategorias: (ids) =>
    peticion('/api/admin/categorias/reordenar', { method: 'POST', body: JSON.stringify({ ids }) }),

  listarPlatos: () => peticion('/api/admin/platos'),
  crearPlato: (datos) => peticion('/api/admin/platos', { method: 'POST', body: JSON.stringify(datos) }),
  editarPlato: (id, datos) =>
    peticion(`/api/admin/platos/${id}`, { method: 'PUT', body: JSON.stringify(datos) }),
  archivarPlato: (id) => peticion(`/api/admin/platos/${id}/archivar`, { method: 'POST' }),
  reactivarPlato: (id) => peticion(`/api/admin/platos/${id}/reactivar`, { method: 'POST' }),
  reordenarPlatos: (categoriaId, ids) =>
    peticion('/api/admin/platos/reordenar', { method: 'POST', body: JSON.stringify({ categoriaId, ids }) }),
  obtenerMesa: (token) => peticion(`/api/mesas/${token}`),
  confirmarPedido: (token, lineas) =>
    peticion(`/api/mesas/${token}/pedidos`, { method: 'POST', body: JSON.stringify({ lineas }) }),
  listarPedidosMesa: (token) => peticion(`/api/mesas/${token}/pedidos`),

  listarMesas: () => peticion('/api/admin/mesas'),
  crearMesa: (nombre) => peticion('/api/admin/mesas', { method: 'POST', body: JSON.stringify({ nombre }) }),
  regenerarTokenMesa: (id) => peticion(`/api/admin/mesas/${id}/regenerar-token`, { method: 'POST' }),

  subirFotoPlato: async (id, archivo) => {
    const formData = new FormData();
    formData.append('foto', archivo);
    const respuesta = await fetch(`/api/admin/platos/${id}/foto`, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin',
    });
    const cuerpo = await respuesta.json();
    if (!respuesta.ok) throw new Error(cuerpo?.error || 'No se pudo subir la foto.');
    return cuerpo;
  },
};

export function formatearPrecio(precioCentimos) {
  return (precioCentimos / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}
