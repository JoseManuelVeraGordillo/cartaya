## Why

La carta digital (`carta-publica`) permite hoy consultar los platos, pero el cliente sigue teniendo que llamar al camarero para pedir. Este cambio cierra ese hueco: el cliente pide directamente desde la carta que ya tiene abierta en su móvil, sin registrarse ni dejar ningún dato personal, y el pedido llega asociado únicamente a su mesa.

## What Changes

- Cada mesa de La Estación tiene un código QR único e impreso que abre la carta con la mesa ya identificada para el cliente que la escanea.
- El cliente añade platos activos de la carta a un pedido, con cantidad y una nota libre opcional por plato (máximo 140 caracteres).
- Antes de confirmar, el cliente ve un resumen del pedido con el total en euros (IVA incluido); confirmar no pide ni registro ni ningún dato personal.
- Si al confirmar algún plato del pedido ya no está activo (el dueño lo archivó mientras el cliente decidía), el sistema avisa y lo retira del pedido antes de enviarlo, sin bloquear el resto.
- Un pedido confirmado queda registrado como perteneciente a su mesa (nunca a una persona) y disponible para que cocina lo recoja (la recogida y gestión en cocina es una capacidad futura, `panel-cocina`, fuera de este cambio).
- El cliente ve en su móvil la confirmación de su pedido con número de pedido y estado.
- Una misma mesa puede tener varios pedidos abiertos a lo largo del servicio; cada confirmación crea un pedido independiente, no se acumula en uno solo.
- Fuera de alcance (2026-08-20): pago online, propinas, dividir la cuenta, llamar al camarero y pedidos para llevar. Se sigue pagando en caja como hasta ahora.

## Capabilities

### New Capabilities
- `pedidos-mesa`: permite al cliente identificado solo por su mesa (vía QR) construir, revisar y confirmar un pedido de platos de la carta, sin dato personal alguno, con revalidación de disponibilidad al confirmar.

### Modified Capabilities

(ninguna; `carta-publica` y `catalogo-admin` no cambian su comportamiento observable)

## Impact

- Nuevo modelo de datos: mesas (con su QR), pedidos y líneas de pedido, ligados a los platos existentes del catálogo (`catalogo-admin`).
- Nuevos endpoints en el backend Express para crear/consultar mesas por QR, y crear/consultar pedidos.
- Nueva pantalla en el frontend (React) de pedido: carrito, notas por plato, resumen y confirmación, accesible desde la carta pública ya existente.
- `catalogo-admin` no cambia, pero sus datos de plato (precio, estado activo) pasan a ser leídos también por `pedidos-mesa` para calcular el total y revalidar disponibilidad.
