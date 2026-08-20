## Context

`pedidos-mesa` ya persiste `pedidos` y `lineas_pedido` (`server/db/schema.js`); `estado` es hoy un `TEXT` sin restricción que solo llega a valer `'recibido'` (fijado al confirmar, en `server/routes/mesas.js`). `catalogo-admin` protege sus rutas con la sesión de establecimiento de `server/middleware/session.js` (`requireSesion`, cookie `cartaya_sesion`), montada en `server/routes/admin/`. **No existe hoy ningún canal SSE en la aplicación**: `carta-publica` y `catalogo-admin` se sirven con `fetch` puntual al cargar la página; el propio diseño de `add-carta-digital` dejó SSE fuera de alcance explícitamente. Este cambio es, por tanto, la primera vez que la aplicación abre una conexión de eventos en tiempo real. Ver proposal.md - Why.

## Goals / Non-Goals

**Goals:**
- Extender `estado` del pedido a un ciclo de vida validado en el servidor (`recibido` → `en_preparacion` → `servido`), rechazando cualquier transición que no sea la siguiente en orden.
- Registrar la cancelación (solo desde `recibido`) sin borrar el pedido, reutilizando el mismo patrón de conservación que `catalogo-admin` ya usa para platos archivados.
- Servir un flujo de eventos en tiempo real mínimo, del servidor a las tablets del panel, para pedidos nuevos y cambios de estado, sin introducir WebSockets ni polling.

**Non-Goals:**
- No se diseña un sistema de eventos genérico reutilizable por otras pantallas; el canal SSE de este cambio es específico del panel de cocina. Si `pedidos-mesa` necesita en el futuro reflejar el estado en vivo en el móvil del cliente, se revisará entonces si conviene generalizar.
- No se implementa ninguna notificación sonora configurable, ni impresión de tickets, ni métricas (ver proposal.md - fuera de alcance).
- No se introduce un sistema de turnos ni de usuarios por empleado: la sesión sigue siendo la misma sesión única de establecimiento que ya usa `catalogo-admin`.

## Decisions

### Transición de estado validada en el servidor con una tabla de transiciones explícita
El endpoint que avanza un pedido comprueba el estado actual contra una transición única permitida (`recibido → en_preparacion`, `en_preparacion → servido`) antes de escribir; cualquier otro intento se rechaza con un error, sin caer en validaciones ad-hoc dispersas por el código. Igual que la revalidación de disponibilidad de `pedidos-mesa`, la comprobación y la escritura ocurren en la misma transacción SQLite para evitar condiciones de carrera si dos tablets marcan el mismo pedido casi a la vez.

Alternativa descartada: dejar que el frontend decida qué botón mostrar y confiar en que no se manden transiciones inválidas. Cualquier cliente (o un futuro segundo panel) podría saltarse esa validación; la regla de negocio vive en el servidor, no en la interfaz.

### `estado` pasa a tener valores cerrados mediante `CHECK`, con una migración `ALTER TABLE`
`server/db/schema.js` usa `CREATE TABLE IF NOT EXISTS`, por lo que añadir la restricción sobre `estado` y la nueva columna `cancelado_en` (nullable, se rellena solo al cancelar) requiere una migración explícita sobre la tabla `pedidos` ya existente, siguiendo el patrón de migraciones que ya use `server/db/index.js`. Los valores válidos quedan cerrados a `recibido`, `en_preparacion`, `servido`, `cancelado`.

Alternativa descartada: dejar `estado` como texto libre y validar solo en el código de la aplicación. Es más simple de migrar, pero permite que un dato corrupto o un script directo contra la base de datos deje un pedido en un estado inexistente; con una cafetería que puede crecer a más de una tablet, la restricción en la propia base de datos es barata y evita esa clase de error.

### SSE con un único endpoint de suscripción y un emisor en memoria en el mismo proceso
Se añade `server/lib/sse.js` con un registro en memoria de conexiones abiertas (mismo patrón que las sesiones en memoria de `server/middleware/session.js`: un único proceso Node, sin necesidad de un broker externo) y un endpoint `GET /api/admin/pedidos/eventos` (protegido por `requireSesion`, igual que el resto de `server/routes/admin/`) que mantiene la conexión abierta y emite un evento por cada pedido nuevo y por cada cambio de estado. Los endpoints que confirman, avanzan o cancelan un pedido publican el evento correspondiente tras confirmar la transacción.

Alternativa descartada: polling periódico desde el frontend. El contexto del proyecto fija SSE como mecanismo de tiempo real (no polling, no WebSockets); además polling contra SQLite en cada tablet cada pocos segundos es más trabajo para el único proceso Node que una conexión SSE que solo emite cuando hay algo que decir.

### El histórico del día reutiliza la misma consulta de pedidos, sin tabla ni endpoint separado
El histórico no es una entidad distinta: es la misma tabla `pedidos` filtrada por fecha de confirmación (día en curso) sin excluir `servido` ni `cancelado`, frente a la vista activa que sí los excluye. Un único endpoint de listado con un parámetro de filtro (activos vs. todos los del día) evita duplicar la lógica de lectura de pedidos y líneas.

Alternativa descartada: endpoint y modelo de "histórico" independientes. Añadiría una segunda fuente de verdad para el mismo dato sin necesidad real, en una aplicación que ya sigue el principio de simplicidad ante todo.

## Risks / Trade-offs

- [Dos tablets marcan el mismo pedido casi a la vez con acciones distintas (una a "en_preparacion", otra intenta cancelar)] → La comprobación de transición válida y la escritura ocurren en la misma transacción SQLite (serializada por better-sqlite3), igual que ya hace `pedidos-mesa` al confirmar; solo una de las dos operaciones puede ganar, y la otra recibe un rechazo claro.
- [Una tablet pierde la conexión SSE (wifi de cocina inestable) y se pierde algún evento mientras está desconectada] → Al reconectar, el frontend vuelve a pedir el listado completo de pedidos activos (la misma consulta que usa la carga inicial del panel), por lo que el estado se resincroniza aunque se hayan perdido eventos intermedios; el canal SSE es una optimización de latencia, no la única fuente de verdad del estado mostrado.
- [Al ser el primer canal SSE de la aplicación, no hay un patrón previo que seguir dentro del propio código] → Se mantiene deliberadamente simple (un registro en memoria, sin colas ni reintentos) porque el volumen esperado (una cafetería de barrio, unas pocas tablets) no lo justifica; si otra capacidad necesita tiempo real en el futuro, se decidirá entonces si conviene extraer un mecanismo común.

## Migration Plan

Cambio aditivo sobre datos existentes: `ALTER TABLE pedidos` para añadir la restricción `CHECK` sobre `estado` (con `recibido` como único valor ya presente, compatible con los pedidos ya confirmados) y la columna `cancelado_en`. Nuevos endpoints bajo `server/routes/admin/` y nueva pantalla `web/src/pages/Cocina/`; no modifica los endpoints ni pantallas existentes de `carta-publica` ni `catalogo-admin`. Rollback: revertir el despliegue; los pedidos ya avanzados de estado durante la ventana en que estuvo desplegado el cambio conservan su `estado` (dato correcto), simplemente el panel deja de estar disponible hasta volver a desplegar.
