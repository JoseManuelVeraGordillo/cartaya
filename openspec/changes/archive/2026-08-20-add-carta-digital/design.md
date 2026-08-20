## Context

Proyecto en fase inicial: no existe todavía esquema de datos ni endpoints (ver proposal.md - Why). El stack está fijado (Express + better-sqlite3 + React/Vite servido como estáticos, sesión de establecimiento ya prevista). Este diseño cubre el modelo de datos y los endpoints necesarios para `carta-publica` y `catalogo-admin` (ver specs/carta-publica/spec.md y specs/catalogo-admin/spec.md para el contrato de comportamiento).

El requisito más exigente técnicamente es el de carga en menos de 2 segundos en 4G (carta-publica: Rendimiento de carga en móvil), porque las fotos que suba Andrés desde el móvil de la cafetería pueden pesar varios MB sin ningún tratamiento.

## Goals / Non-Goals

**Goals:**
- Definir el esquema SQLite para categorías y platos, incluida la conservación de archivados.
- Definir cómo se cumple el presupuesto de 2 segundos de carga pese a fotos subidas sin optimizar.
- Definir los endpoints públicos y de administración y cómo se protegen.

**Non-Goals:**
- Diseñar el flujo de pedido, el panel de cocina ni el uso de SSE (fuera de alcance de este cambio; SSE no se usa aquí porque la carta pública no necesita tiempo real).
- Rediseñar la sesión de establecimiento: se asume como mecanismo ya existente en el proyecto y este cambio solo protege sus endpoints de administración con ella.

## Decisions

### Modelo de datos: dos tablas con archivado por timestamp, no borrado físico
`categorias(id, nombre, orden, archivada_en NULL)` y `platos(id, categoria_id, nombre, precio_centimos, descripcion, foto_url NULL, alergenos TEXT, orden, archivado_en NULL)`.

- `archivada_en` / `archivado_en` es NULL mientras el elemento está activo; al archivar se guarda la fecha. No hay endpoint de borrado físico: cumple el requisito de conservación (catalogo-admin: Conservación de platos y categorías archivados) sin lógica adicional.
- La carta pública consulta con `WHERE archivada_en IS NULL` en categoría y `WHERE archivado_en IS NULL` en plato, vía JOIN. Una categoría archivada oculta sus platos automáticamente sin necesidad de archivarlos en cascada (decisión de simplicidad: no hay que sincronizar el estado de los platos al archivar su categoría).
- Precio en céntimos (entero) para evitar errores de redondeo en euros con IVA incluido; se formatea a euros en la capa de presentación.
- Alternativa descartada: tabla intermedia `plato_alergenos` normalizada. Con solo 14 alérgenos fijos y sin necesidad de filtrar la carta por alérgeno (fuera de alcance), una columna `alergenos` con array JSON de códigos es más simple y suficiente (principio 2: simplicidad ante todo). Se valida contra la lista fija de 14 códigos en el backend al guardar.
- Reactivar (catalogo-admin: Reactivar una categoría archivada, Reactivar un plato archivado) es la operación inversa a archivar: pone `archivada_en`/`archivado_en` a NULL. No necesita tabla ni columna adicional; la carta pública ya filtra por ese campo, así que un plato o categoría reactivados vuelven a aparecer sin más cambios.

### Fotos: redimensionado y compresión obligatorios en el servidor al subir
Se añade **sharp** (nueva dependencia) para redimensionar toda foto subida a un ancho máximo de 1200px y recomprimirla a JPEG de calidad ~75 antes de guardarla. Justificación: sin este paso, una foto de móvil sin optimizar (3-8 MB, resoluciones de 4000px+) hace inviable el presupuesto de 2 segundos en 4G del requisito "Rendimiento de carga en móvil"; ninguna configuración de caché o compresión de red compensa una imagen de ese tamaño en la primera visita. `sharp` es la opción estándar en Node para esto, con binarios precompilados (sin necesidad de Docker, coherente con el stack).
- Límite de subida: 8 MB de entrada (rechazo antes de procesar, con **multer**, nueva dependencia para manejar `multipart/form-data`; es la opción estándar en Express y no añade complejidad de infraestructura). Tras el redimensionado/compresión, el fichero guardado ronda normalmente 100-300 KB.
- Las fotos se guardan en disco (carpeta local servida como estáticos por Express) referenciadas por `foto_url`; no se introduce almacenamiento externo (coherente con "base de datos SQLite en un único fichero, suficiente para una cafetería").

### Orden manual: enteros reasignados por lista completa
Reordenar categorías o platos envía la lista completa de ids en el nuevo orden; el backend reasigna `orden` secuencialmente en una transacción. Alternativa descartada: orden fraccionario o "mover arriba/abajo" por pasos individuales - más complejo de implementar y de razonar para un catálogo pequeño (una cafetería de barrio), sin beneficio real (principio 2).

### Endpoints
- Públicos (sin sesión): `GET /api/carta` - devuelve categorías activas con sus platos activos, ya ordenados, en un único payload (evita cascada de peticiones desde el móvil del cliente).
- Administración (requieren sesión de establecimiento, vía el middleware de sesión ya existente en el proyecto): CRUD de categorías y platos, subida de foto, y reordenación, bajo un prefijo protegido (p. ej. `/api/admin/...`).

### Compresión de respuesta: middleware `compression`
Se añade **compression** (nueva dependencia) aplicada a toda la app, no solo a `GET /api/carta`. Justificación: una medición con Lighthouse en modo móvil (throttling por defecto, equivalente o más exigente que 4G en gama media) mostró que sin comprimir el bundle de React/Vite (~207 KB) el LCP superaba los 2 segundos del presupuesto (carta-publica: Rendimiento de carga en móvil); con compresión gzip de HTML/CSS/JS/JSON el bundle baja a ~64 KB y el LCP queda por debajo de 2 s. Es middleware estándar de Express, de un único propósito, sin infraestructura adicional.

### Tests trazables por escenario
Se usa el test runner integrado `node:test` (Node 22, sin dependencia nueva) con un fichero de test por capability (`carta-publica`, `catalogo-admin`) y un test por escenario, nombrado igual que el escenario de la spec, para mantener la trazabilidad exigida por el proyecto.

## Risks / Trade-offs

- [Fotos subidas desde el móvil de la cafetería pueden ser muy pesadas] → Mitigación: redimensionado y recompresión obligatorios en servidor con sharp antes de guardar (ver Decisión de fotos); el límite de 8 MB de entrada solo evita abusos, no define el peso final servido.
- [Columna `alergenos` en JSON no es consultable por SQL de forma nativa] → Mitigación aceptada: no hay requisito de filtrar la carta por alérgeno; si se necesitara en el futuro, es una migración acotada a una tabla normalizada.
- [Archivar una categoría oculta sus platos sin archivarlos individualmente; al reactivarla, todos sus platos que siguen activos reaparecen de golpe, tal como estaban] → Aceptado como comportamiento simple y predecible (catalogo-admin: Reactivar una categoría archivada); es justamente lo que permite deshacer un archivado accidental sin pasos adicionales.
- [SQLite con escrituras desde administración y lecturas públicas simultáneas] → Mitigación: better-sqlite3 en modo WAL permite lectores concurrentes con un escritor; volumen de una cafetería de barrio está muy por debajo de cualquier límite práctico.

## Migration Plan

Proyecto sin datos previos: el esquema de `categorias` y `platos` se crea en el arranque del servidor (script idempotente de creación de tablas si no existen), sin necesidad de migrar datos existentes ni de estrategia de rollback más allá de revertir el despliegue.
