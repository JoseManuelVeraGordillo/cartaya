## Why

Las cartas plastificadas de La Estación quedan desactualizadas en cuanto cambia un precio o un plato, y reimprimirlas tiene coste y demora. Andrés necesita poder actualizar la carta él mismo en cualquier momento, y sus clientes necesitan verla siempre correcta al escanear el QR de su mesa, sin fricción (sin instalar nada, sin registrarse).

## What Changes

- Se añade una carta digital pública, accesible sin identificación, organizada en categorías con orden manual (definido por Andrés) y platos con orden manual dentro de cada categoría.
- Cada plato muestra nombre, precio en euros (IVA incluido), descripción corta, foto opcional y sus alérgenos (los 14 de declaración obligatoria de la UE); un plato sin alérgenos declara explícitamente "sin alérgenos".
- Solo se muestran los platos activos (no eliminados) de categorías con platos activos. Los platos eliminados se archivan (no se borran) porque los pedidos históricos los referencian; nunca vuelven a aparecer en la carta pública.
- La carta pública debe cargar en menos de 2 segundos en un móvil de gama media con 4G.
- Se añade una pantalla de administración del catálogo, protegida con la sesión de establecimiento, pensada para móvil, desde la que Andrés crea, edita, archiva y reactiva platos y categorías, reordena ambos manualmente, y sube fotos de plato con límite de tamaño.
- **Decisión (2026-08-20):** el pedido desde la mesa, el panel de cocina, los precios por franjas horarias, los idiomas múltiples y cualquier cuenta o registro del cliente final quedan fuera de alcance de este cambio (el pedido será un cambio posterior; lo demás por los principios 2 y 3 del proyecto).
- **Decisión (2026-08-20):** un plato tiene un único precio; no se modelan variantes (tapa/media/ración). Si Andrés necesita varios tamaños de un mismo plato, los da de alta como platos distintos (p. ej. "Croquetas (tapa)" y "Croquetas (ración)"). Decisión por simplicidad (principio 2).
- **Decisión (2026-08-20):** archivar un plato o una categoría es reversible: el dueño puede reactivarlo desde la administración, para poder deshacer un archivado accidental desde el móvil sin perder el plato. Al reactivar una categoría, sus platos vuelven a mostrarse tal como estaban, porque archivar una categoría oculta sus platos sin archivarlos individualmente.
- **Decisión (2026-08-20):** una categoría sin ningún plato activo no se muestra en la carta pública (se oculta, no se muestra vacía).
- **Decisión (2026-08-20):** un plato pertenece a una única categoría; no se repite en varias secciones de la carta.
- **Decisión (2026-08-20):** el QR de cada mesa apunta a una única carta pública, común a todo el establecimiento; este cambio no modela un identificador de mesa en la URL. La asociación entre pedido y mesa se resolverá en el cambio de pedidos, sin que esto deba obligar a reimprimir los QR.
- **Decisión (2026-08-20):** el límite de subida de foto se fija en 8 MB de entrada; el sistema la redimensiona a un máximo de 1200px de ancho y la recomprime antes de guardarla (detalle técnico en design.md).
- **Decisión (2026-08-20):** todo plato tiene siempre un precio fijo en euros con IVA incluido; no se admite "a consultar" ni precio variable. Un plato de precio cambiante (p. ej. plato del día) se mantiene actualizando su precio desde la administración.

## Capabilities

### New Capabilities
- `carta-publica`: consulta pública de la carta (categorías y platos activos, ordenados, con alérgenos siempre visibles) sin identificación y con carga rápida en móvil.
- `catalogo-admin`: gestión del catálogo (categorías y platos) por el dueño desde una pantalla de administración protegida por sesión de establecimiento, incluida la subida de fotos.

### Modified Capabilities
(ninguna: no existen specs previas en el proyecto)

## Impact

- **Backend:** nuevo esquema SQLite para categorías y platos (con orden manual, estado activo/archivado y alérgenos), endpoints públicos de solo lectura para la carta y endpoints protegidos por sesión de establecimiento para el CRUD del catálogo (incluida la reactivación de archivados), y almacenamiento de fotos de plato en disco con límite de tamaño.
- **Frontend:** nueva vista pública de la carta (React, servida como estáticos por Express) optimizada para carga rápida en móvil, y nueva pantalla de administración del catálogo pensada para móvil, con acción de reactivar platos y categorías archivados, reutilizando la sesión de establecimiento ya prevista para el proyecto.
- **Datos:** los platos eliminados pasan a estado archivado en vez de borrarse, para que los pedidos históricos (fuera de alcance de este cambio, pero ya previstos en el producto) puedan seguir referenciándolos.
- **Dependencias:** ninguna nueva prevista más allá del stack ya fijado (Express, better-sqlite3, React con Vite); cualquier librería adicional (p. ej. para procesado de imágenes) debe justificarse en design.md.
