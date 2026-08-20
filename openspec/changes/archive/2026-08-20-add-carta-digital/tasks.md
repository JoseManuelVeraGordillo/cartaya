## 1. Base del proyecto

- [x] 1.1 Inicializar `package.json`, dependencias fijadas (express, better-sqlite3) y estructura de carpetas backend/frontend (proyecto sin código previo).
- [x] 1.2 Configurar la app Vite + React 19 en el frontend, servida como estáticos por Express.
- [x] 1.3 Configurar el fichero SQLite único y la conexión con better-sqlite3 en modo WAL.
- [x] 1.4 Verificar que existe (o crear si falta) el middleware de sesión de establecimiento del proyecto, y confirmar cómo lo consumen las rutas protegidas.

## 2. Modelo de datos

- [x] 2.1 Crear el script idempotente de esquema: tablas `categorias` y `platos` según design.md (Decisión: Modelo de datos), incluidas columnas de orden y archivado por timestamp.
- [x] 2.2 Implementar la validación de `alergenos` contra la lista fija de 14 códigos de declaración obligatoria (incluye el valor "sin alérgenos").
- [x] 2.3 Sembrar datos de ejemplo mínimos para desarrollo local (una categoría y un plato) sin afectar al esquema de producción.

## 3. API pública de la carta

- [x] 3.1 Implementar `GET /api/carta`: categorías activas ordenadas con sus platos activos ordenados anidados, excluyendo categorías sin platos activos (carta-publica: Visibilidad exclusiva de platos activos, Organización en categorías y platos ordenados).
- [x] 3.2 Incluir en la respuesta nombre, precio en euros (IVA incluido), descripción corta, alérgenos (o "sin alérgenos") y `foto_url` opcional por plato (carta-publica: Información obligatoria por plato, Alérgenos siempre visibles).
- [x] 3.3 Añadir cabeceras de caché HTTP y compresión de respuesta para el endpoint público (design.md: Decisión de rendimiento/carga).

## 4. API de administración: categorías

- [x] 4.1 Proteger todas las rutas de administración con el middleware de sesión de establecimiento (catalogo-admin: Acceso protegido por sesión de establecimiento).
- [x] 4.2 Implementar crear y editar categoría.
- [x] 4.3 Implementar archivar categoría (set `archivada_en`, sin borrado físico).
- [x] 4.4 Implementar reactivar categoría (limpiar `archivada_en`).
- [x] 4.5 Implementar reordenar categorías (reasignación transaccional de `orden` a partir de la lista completa recibida).

## 5. API de administración: platos

- [x] 5.1 Implementar crear y editar plato (nombre, precio, descripción, alérgenos), rechazando el guardado si no se declara `alergenos` (catalogo-admin: Declaración obligatoria de alérgenos al guardar un plato).
- [x] 5.2 Implementar archivar plato (set `archivado_en`, sin borrado físico; catalogo-admin: Conservación de platos y categorías archivados).
- [x] 5.3 Implementar reactivar plato (limpiar `archivado_en`).
- [x] 5.4 Implementar reordenar platos dentro de una categoría.

## 6. Fotos de plato

- [x] 6.1 Añadir `multer` y configurar el límite de subida de 8 MB de entrada (design.md: Decisión de fotos).
- [x] 6.2 Añadir `sharp` y procesar toda foto subida: redimensionar a 1200px de ancho máximo y recomprimir a JPEG calidad ~75 antes de guardar en disco.
- [x] 6.3 Servir las fotos guardadas como estáticos desde Express y devolver el rechazo con motivo cuando se supera el límite (catalogo-admin: Fotos de plato con límite de tamaño).

## 7. Frontend: carta pública

- [x] 7.1 Construir la vista de carta pública (categorías y platos ordenados) consumiendo `GET /api/carta`, sin ninguna pantalla de identificación.
- [x] 7.2 Mostrar alérgenos de forma siempre visible junto a cada plato, incluido el estado explícito "sin alérgenos".
- [x] 7.3 Aplicar tipografía legible y contraste alto en toda la vista (carta-publica: Legibilidad y accesibilidad visual).
- [x] 7.4 Medir el tiempo de carga en condiciones de móvil de gama media / 4G simulado y ajustar hasta cumplir el presupuesto de 2 segundos (carta-publica: Rendimiento de carga en móvil).

## 8. Frontend: administración del catálogo

- [x] 8.1 Construir la pantalla de administración protegida por sesión, con layout pensado para móvil (catalogo-admin: Administración usable desde el móvil).
- [x] 8.2 Formularios de categoría (crear, editar, archivar) con reordenación manual (arrastrar o mover).
- [x] 8.3 Formularios de plato (crear, editar, archivar) con selección obligatoria de alérgenos, incluida la opción explícita "sin alérgenos", y reordenación manual dentro de su categoría.
- [x] 8.4 Subida de foto opcional con previsualización y mensaje de error claro cuando se supera el límite de tamaño.
- [x] 8.5 Vista de categorías y platos archivados con acción de reactivar (catalogo-admin: Reactivar una categoría archivada, Reactivar un plato archivado).

## 9. Tests trazables por escenario

- [x] 9.1 Tests de `carta-publica` con `node:test`, un test por escenario de `specs/carta-publica/spec.md`, nombrado igual que el escenario.
- [x] 9.2 Tests de `catalogo-admin` con `node:test`, un test por escenario de `specs/catalogo-admin/spec.md`, nombrado igual que el escenario (incluidos los dos nuevos escenarios de reactivar).
- [x] 9.3 Test de rechazo de acceso a rutas de administración sin sesión válida.
