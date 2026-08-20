## Why

Los pedidos confirmados desde `pedidos-mesa` quedan hoy en estado `recibido` sin que nadie en cocina o barra pueda verlos ni avanzarlos. Andrés necesita una pantalla en una tablet apoyada en la barra donde los pedidos entrantes aparezcan solos y cocina pueda marcarlos según los va preparando y sirviendo, sustituyendo el aviso a viva voz que usan hoy.

## What Changes

- Se añade el panel de cocina: pantalla protegida por sesión de establecimiento que muestra los pedidos del día ordenados por antigüedad (mesa, platos, cantidades, notas y tiempo transcurrido), con aparición en tiempo real vía SSE.
- Se añade la posibilidad de avanzar un pedido de `recibido` a `en_preparacion` y de `en_preparacion` a `servido` desde el panel, sin permitir saltos ni retrocesos.
- Se añade la cancelación de un pedido, solo posible mientras está en `recibido`; la cancelación registra el momento en que ocurre y no borra el pedido.
- Los pedidos `servido` se archivan de la vista activa del panel y pasan a un histórico del día, consultable desde el propio panel.
- (2026-08-20) Decisión: no se incluyen métricas/estadísticas, impresión de tickets, gestión de turnos/empleados ni notificaciones sonoras configurables; un aviso simple de "pedido nuevo" es suficiente. Estas quedan fuera de alcance explícitamente.
- (2026-08-20) Decisión: la cancelación de un pedido en `recibido` es la única transición que sale de la secuencia lineal `recibido → en_preparacion → servido`; una vez en `en_preparacion` el pedido ya no puede cancelarse desde la aplicación.

## Capabilities

### New Capabilities
- `panel-cocina`: pantalla de cocina/barra (tablet) con sesión de establecimiento, listado en tiempo real de pedidos del día por antigüedad, avance de estado por pedido, archivado a histórico al servirse y consulta del histórico del día.

### Modified Capabilities
- `pedidos-mesa`: el pedido confirmado gana un ciclo de vida de estados (`recibido` → `en_preparacion` → `servido`, con transiciones estrictamente lineales) y una cancelación posible solo en `recibido` que registra el momento de cancelación sin eliminar el pedido.

## Impact

- Backend: nuevos endpoints protegidos por la sesión de establecimiento para listar pedidos del día, el histórico del día, avanzar el estado de un pedido y cancelarlo; ampliación del modelo de pedido con los nuevos estados y con el campo de momento de cancelación; primer canal SSE de la aplicación (no existe ninguno todavía) para notificar pedidos nuevos y cambios de estado al panel.
- Frontend: nueva pantalla `panel-cocina`, pensada para tablet, reutilizando el patrón de sesión de establecimiento ya usado en `catalogo-admin`.
- No afecta a `carta-publica` ni a la forma en que el cliente confirma su pedido.
