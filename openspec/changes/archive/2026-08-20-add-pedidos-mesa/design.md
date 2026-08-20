## Context

`carta-publica` ya sirve la carta pública sin identificación del cliente. `catalogo-admin` mantiene categorías y platos, con su estado `activo`/archivado como fuente de verdad de qué se puede pedir. Este diseño añade mesas y pedidos por encima de esos datos existentes, en el mismo backend Express + better-sqlite3 y frontend React ya en uso. Ver proposal.md - Why.

## Goals / Non-Goals

**Goals:**
- Identificar una mesa de forma inequívoca y no adivinable a partir de su QR, sin ningún dato del cliente.
- Persistir pedidos y sus líneas de forma que un pedido histórico siga siendo consultable aunque el plato referenciado se archive después (mismo patrón que `catalogo-admin` ya usa para archivado).
- Revalidar la disponibilidad de los platos en el momento exacto de confirmar, no antes, para minimizar la ventana de carrera con `catalogo-admin`.

**Non-Goals:**
- No se implementa el panel de cocina (`panel-cocina`); este cambio solo deja el pedido confirmado en un estado consultable para que esa capacidad futura lo recoja.
- No hay actualización en vivo del estado del pedido en el móvil del cliente en este cambio (el cliente ve el estado en el momento de la confirmación; el refresco en vivo, si se necesita, es una extensión posterior con SSE, igual que ya se usa en otras partes del sistema).
- No se genera ninguna interfaz de cobro ni de gestión de propinas o división de cuenta (fuera de alcance, ver proposal.md).

## Decisions

### Identificación de mesa: token opaco en la URL, no un número correlativo
El QR de cada mesa codifica una URL con un token opaco (aleatorio, no adivinable) en vez de un identificador numérico correlativo (`/mesa/1`, `/mesa/2`...). Con un número correlativo, cualquier cliente podría cambiar el número en la URL y ver o, peor, pedir desde la mesa de al lado. El token se genera una vez al crear la mesa y no cambia salvo que Andrés lo regenere (por ejemplo, si se pierde o fotografía un QR indebidamente).

Alternativa descartada: número de mesa visible en la URL. Más simple de imprimir y leer, pero rompe el aislamiento entre mesas sin control adicional; no compensa la simplicidad ganada.

### Revalidación de disponibilidad dentro de la misma transacción de confirmación
El endpoint de confirmar pedido comprueba el estado `activo` de cada plato de la petición dentro de la misma transacción SQLite que crea el pedido, no antes. Esto asegura que la comprobación usa el estado más reciente posible y que la creación del pedido (sin los platos ya no disponibles) es atómica: no puede quedar un pedido a medio escribir si `catalogo-admin` archiva un plato justo en ese instante.

### Estado del pedido: un único estado inicial `recibido`
Este cambio introduce el campo `estado` en el pedido pero solo produce el valor `recibido` al confirmarse. Los estados intermedios y finales (en preparación, listo, entregado...) los definirá `panel-cocina` cuando se proponga esa capacidad. Adelantar aquí esos estados sería diseñar una funcionalidad que aún no existe.

### Nueva dependencia: librería `qrcode` para generar el QR imprimible de cada mesa
Andrés necesita un QR imprimible por mesa; generarlo a mano fuera del sistema no es viable para una persona sin perfil técnico. Se añade la dependencia `qrcode` (generación de QR como PNG/SVG en Node, sin servicios externos, coherente con "todo en un único proceso" que ya sigue el resto del stack) para producir esa imagen bajo demanda desde la administración. Alternativa descartada: servicio externo de generación de QR - introduce una dependencia de red para algo que se imprime una vez y no debe depender de un tercero disponible.

## Risks / Trade-offs

- [El token de mesa se filtra si alguien fotografía o comparte el QR de otra mesa] → El token identifica la mesa, nunca a una persona, y el impacto de un token filtrado es que alguien podría pedir "como si estuviera en esa mesa"; no expone ningún dato personal. Andrés puede regenerar el token de una mesa si sospecha que se ha filtrado.
- [Dos clientes en la misma mesa confirman pedidos casi a la vez] → Cada confirmación crea un pedido independiente (ver spec "Varios pedidos independientes por mesa"), por lo que no hay estado compartido que reconciliar entre ambos.
- [El plato se archiva justo entre la revalidación y el commit de la transacción] → No ocurre: la revalidación y la creación del pedido están dentro de la misma transacción SQLite, que es serializada por better-sqlite3.

## Migration Plan

Cambio aditivo: nuevas tablas (`mesas`, `pedidos`, `lineas_pedido`) y nuevos endpoints; no modifica tablas ni endpoints existentes de `catalogo-admin` ni `carta-publica`. Se despliega junto con la migración de esquema SQLite que crea las tablas nuevas. Sin datos que migrar (funcionalidad nueva). Rollback: revertir el despliegue y dejar las tablas nuevas sin usar no rompe `carta-publica` ni `catalogo-admin`, que no dependen de ellas.
