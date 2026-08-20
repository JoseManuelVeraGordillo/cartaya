## 1. Modelo de datos

- [x] 1.1 Migrar la tabla `pedidos` (`server/db/schema.js` / migración en `server/db/index.js`) para restringir `estado` con `CHECK` a `recibido`, `en_preparacion`, `servido`, `cancelado`, y añadir la columna `cancelado_en` (nullable).
- [x] 1.2 Verificar que la migración es compatible con los pedidos ya existentes en estado `recibido`.

## 2. Ciclo de vida del pedido en el backend

- [x] 2.1 Implementar la función que valida la transición de estado de un pedido (`recibido → en_preparacion`, `en_preparacion → servido`), rechazando cualquier otra transición.
- [x] 2.2 Implementar la cancelación de un pedido: solo permitida en estado `recibido`, registra `cancelado_en` y no elimina el pedido.
- [x] 2.3 Envolver validación + escritura de cada transición (avance o cancelación) en una única transacción SQLite.

## 3. Canal de eventos en tiempo real (SSE)

- [x] 3.1 Crear `server/lib/sse.js` con el registro en memoria de conexiones abiertas y una función para emitir un evento a todas las conexiones activas.
- [x] 3.2 Añadir el endpoint `GET /api/admin/pedidos/eventos` (protegido por `requireSesion`) que abre y mantiene la conexión SSE.
- [x] 3.3 Emitir un evento de "pedido nuevo" al confirmar un pedido (`server/routes/mesas.js`) y un evento de "cambio de estado" al avanzar o cancelar un pedido (endpoints de la tarea 4).

## 4. Endpoints del panel de cocina

- [x] 4.1 Añadir `server/routes/admin/pedidos.js` y montarlo en `server/routes/admin/index.js` (heredando `requireSesion`).
- [x] 4.2 Endpoint de listado de pedidos activos del día (excluye `servido` y `cancelado`), ordenados por antigüedad, con mesa, líneas (plato, cantidad, nota) y hora de confirmación.
- [x] 4.3 Endpoint de histórico del día (incluye todos los estados, incluidos `servido` y `cancelado`).
- [x] 4.4 Endpoint para avanzar el estado de un pedido (usa la validación de la tarea 2.1).
- [x] 4.5 Endpoint para cancelar un pedido (usa la validación de la tarea 2.2).

## 5. Panel de cocina en el frontend

- [x] 5.1 Crear `web/src/pages/Cocina/CocinaApp.jsx` (o equivalente), protegida por la misma sesión de establecimiento que `web/src/pages/Admin/`.
- [x] 5.2 Vista de pedidos activos: listado por antigüedad con mesa, platos, cantidades, notas y tiempo transcurrido (actualizado en cliente sin recargar).
- [x] 5.3 Suscripción al canal SSE (`GET /api/admin/pedidos/eventos`) para insertar pedidos nuevos y reflejar cambios de estado sin recargar; al reconectar, recargar el listado completo de activos para resincronizar.
- [x] 5.4 Aviso simple (no configurable) al llegar un pedido nuevo.
- [x] 5.5 Acciones por pedido: marcar "en preparación", marcar "servido", cancelar (solo visible en `recibido`); sin opción de saltar ni retroceder estados.
- [x] 5.6 Vista de histórico del día, accesible desde el panel.
- [x] 5.7 Añadir las llamadas correspondientes en `web/src/lib/api.js`.
- [x] 5.8 Revisar que el panel es usable en la tablet apoyada en la barra (tamaños de botón y tipografía coherentes con el resto de la administración).

## 6. Tests

- [x] 6.1 Tests de transición de estado: `recibido → en_preparacion`, `en_preparacion → servido`, y rechazo de saltos y retrocesos (uno por escenario de la spec `pedidos-mesa`).
- [x] 6.2 Tests de cancelación: cancelar en `recibido`, rechazo de cancelar en `en_preparacion`/`servido`, registro de `cancelado_en` sin borrar el pedido.
- [x] 6.3 Tests de acceso protegido por sesión en los nuevos endpoints (`server/routes/admin/pedidos.js`), reutilizando el patrón de `tests/admin-auth.test.js`.
- [x] 6.4 Tests de listado de activos (orden por antigüedad, exclusión de `servido`/`cancelado`, datos completos) y de histórico del día.
- [x] 6.5 Test del canal SSE: un pedido nuevo y un cambio de estado emiten el evento correspondiente a los clientes conectados.
