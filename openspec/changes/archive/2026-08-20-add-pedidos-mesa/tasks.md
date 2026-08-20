## 1. Modelo de datos

- [x] 1.1 Crear el script idempotente de esquema: tabla `mesas` (id, nombre/número visible para Andrés, `token` opaco único indexado) según design.md (Decisión: Identificación de mesa mediante token opaco).
- [x] 1.2 Crear las tablas `pedidos` (id, `mesa_id`, `estado`, total en céntimos, creado_en) y `lineas_pedido` (id, `pedido_id`, `plato_id`, nombre y precio del plato copiados en el momento del pedido, cantidad, nota) según design.md (Decisión: Migration Plan).
- [x] 1.3 Sembrar una mesa de ejemplo con token fijo para desarrollo local, sin afectar al esquema de producción.

## 2. API de mesas

- [x] 2.1 Implementar `GET /api/mesas/:token`: resuelve el token del QR a los datos mínimos de la mesa (pedidos-mesa: Identificación de la mesa mediante QR); token inválido o desconocido responde con error claro sin filtrar información de otras mesas.
- [x] 2.2 Añadir a la administración protegida por sesión la creación de mesas y la generación de su QR imprimible con la dependencia `qrcode` (design.md: Decisión de dependencia `qrcode`).
- [x] 2.3 Añadir a la administración la opción de regenerar el token de una mesa existente (design.md: Riesgos - token de mesa filtrado).

## 3. API de pedidos

- [x] 3.1 Implementar `POST /api/mesas/:token/pedidos`: recibe líneas (plato, cantidad, nota) y, dentro de una única transacción, revalida que cada plato siga activo, descarta los que no lo estén, calcula el total en euros con los precios actuales del catálogo y crea el pedido con estado `recibido` (pedidos-mesa: Revalidación de disponibilidad al confirmar; design.md: Decisión de revalidación transaccional).
- [x] 3.2 Si tras descartar platos no disponibles no queda ninguna línea, no crear el pedido y devolver la lista de platos descartados para que el cliente pueda ajustar su pedido (pedidos-mesa: Todos los platos del pedido dejan de estar activos antes de confirmar).
- [x] 3.3 Si se descarta parte de las líneas pero queda al menos una, crear el pedido con las líneas restantes y devolver también la lista de platos descartados (pedidos-mesa: Un plato del pedido deja de estar activo antes de confirmar).
- [x] 3.4 Validar en el servidor el límite de 140 caracteres por nota de línea, independientemente de la validación en el cliente (pedidos-mesa: Nota libre por plato con límite de caracteres).
- [x] 3.5 Implementar `GET /api/mesas/:token/pedidos` para que el cliente pueda recuperar sus pedidos confirmados de esa mesa (número y estado) tras la confirmación (pedidos-mesa: Confirmación visible con número de pedido y estado).
- [x] 3.6 Confirmar que cada pedido queda enlazado a los datos del plato en el momento del pedido, de forma que un archivado posterior del plato en `catalogo-admin` no altere pedidos ya creados (mismo patrón que catalogo-admin: Conservación de platos y categorías archivados).

## 4. Frontend: carrito y pedido desde la carta

- [x] 4.1 Extender la vista de carta pública (servida ya vía QR de mesa) para añadir cada plato activo al carrito con selector de cantidad (pedidos-mesa: Añadir platos al pedido con cantidad).
- [x] 4.2 Añadir campo de nota libre por plato en el carrito con contador de caracteres y bloqueo a 140 (pedidos-mesa: Nota libre por plato con límite de caracteres).
- [x] 4.3 Construir la pantalla de resumen del pedido con líneas, cantidades, notas y total en euros, y el botón de confirmar (pedidos-mesa: Resumen y confirmación del pedido sin dato personal).
- [x] 4.4 Al confirmar, mostrar los avisos de platos retirados por no disponibles devueltos por el backend antes o junto con la confirmación final (pedidos-mesa: Revalidación de disponibilidad al confirmar).
- [x] 4.5 Construir la pantalla de confirmación con número de pedido y estado, accesible de nuevo tras recargar la página en esa mesa (pedidos-mesa: Confirmación visible con número de pedido y estado).
- [x] 4.6 Permitir volver a la carta y empezar un nuevo pedido desde la misma mesa tras confirmar uno, sin mezclarlo con el anterior (pedidos-mesa: Varios pedidos independientes por mesa).
- [x] 4.7 Aplicar tipografía legible, contraste alto y botones grandes en todo el flujo de pedido, coherente con carta-publica: Legibilidad y accesibilidad visual.

## 5. Tests trazables por escenario

- [x] 5.1 Tests de `pedidos-mesa` con `node:test`, un test por escenario de `specs/pedidos-mesa/spec.md`, nombrado igual que el escenario.
- [x] 5.2 Test de la transacción de confirmación bajo condición de carrera: plato archivado justo antes de confirmar, verificando que el pedido resultante nunca incluye ese plato.
- [x] 5.3 Test de que un token de mesa desconocido o inválido no expone datos de ninguna mesa real.
