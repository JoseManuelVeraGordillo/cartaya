## Purpose

Permite al dueño de La Estación mantener al día, desde su móvil, el catálogo de categorías y platos que alimenta la carta pública, sin necesidad de perfil técnico.

## ADDED Requirements

### Requirement: Acceso protegido por sesión de establecimiento
La administración del catálogo MUST requerir una sesión de establecimiento válida. Ninguna operación de creación, edición, archivado o reordenación del catálogo MUST ejecutarse sin esa sesión.

#### Scenario: Acceso a la administración con sesión válida
- **WHEN** el dueño ha iniciado sesión de establecimiento
- **THEN** el sistema le permite acceder a la pantalla de administración del catálogo

#### Scenario: Intento de administración sin sesión válida
- **WHEN** se intenta crear, editar, archivar o reordenar una categoría o un plato sin una sesión de establecimiento válida
- **THEN** el sistema rechaza la operación y no modifica el catálogo

### Requirement: Gestión de categorías
El dueño MUST poder crear, editar, archivar, reactivar y reordenar manualmente las categorías de la carta.

#### Scenario: Crear una categoría
- **WHEN** el dueño crea una categoría nueva con un nombre
- **THEN** la categoría queda disponible para asignarle platos y para aparecer en la carta pública en el orden que le corresponda

#### Scenario: Reordenar categorías
- **WHEN** el dueño cambia el orden de las categorías desde la administración
- **THEN** la carta pública refleja ese nuevo orden

#### Scenario: Archivar una categoría
- **WHEN** el dueño archiva una categoría
- **THEN** la categoría y los platos que contiene dejan de aparecer en la carta pública, y la categoría se conserva archivada en el sistema

#### Scenario: Reactivar una categoría archivada
- **WHEN** el dueño reactiva una categoría previamente archivada
- **THEN** la categoría vuelve a aparecer en la carta pública en su posición de orden, junto con los platos que siguen activos dentro de ella

### Requirement: Gestión de platos
El dueño MUST poder crear, editar, archivar, reactivar y reordenar manualmente los platos dentro de cada categoría, incluyendo nombre, precio en euros con IVA incluido, descripción corta y alérgenos.

#### Scenario: Crear un plato
- **WHEN** el dueño crea un plato dentro de una categoría con nombre, precio, descripción y alérgenos
- **THEN** el plato queda activo y disponible para aparecer en la carta pública en el orden que le corresponda

#### Scenario: Editar un plato existente
- **WHEN** el dueño modifica el nombre, precio, descripción, foto o alérgenos de un plato activo
- **THEN** la carta pública refleja los datos actualizados del plato

#### Scenario: Reordenar platos dentro de una categoría
- **WHEN** el dueño cambia el orden de los platos dentro de una categoría
- **THEN** la carta pública refleja ese nuevo orden

#### Scenario: Archivar un plato
- **WHEN** el dueño archiva (elimina del catálogo) un plato
- **THEN** el plato deja de aparecer en la carta pública inmediatamente

#### Scenario: Reactivar un plato archivado
- **WHEN** el dueño reactiva un plato previamente archivado
- **THEN** el plato vuelve a aparecer en la carta pública, siempre que su categoría no esté archivada

### Requirement: Declaración obligatoria de alérgenos al guardar un plato
El sistema MUST exigir que todo plato, al crearse o editarse, tenga sus alérgenos declarados explícitamente entre los 14 de declaración obligatoria de la normativa europea, incluyendo la opción explícita "sin alérgenos". El sistema MUST NOT permitir guardar un plato sin esa declaración.

#### Scenario: Intento de guardar un plato sin declarar alérgenos
- **WHEN** el dueño intenta guardar un plato sin marcar ningún alérgeno ni la opción "sin alérgenos"
- **THEN** el sistema rechaza el guardado y pide completar la declaración de alérgenos

#### Scenario: Guardar un plato declarando explícitamente "sin alérgenos"
- **WHEN** el dueño marca la opción "sin alérgenos" al crear o editar un plato
- **THEN** el sistema guarda el plato y la carta pública lo muestra como "sin alérgenos"

### Requirement: Conservación de platos y categorías archivados
Un plato o categoría archivados MUST conservarse en el sistema en vez de eliminarse, de forma que los pedidos históricos que lo referencian sigan siendo válidos.

#### Scenario: Referencia histórica a un plato archivado
- **WHEN** un plato referenciado por un pedido histórico es archivado
- **THEN** el pedido histórico sigue referenciando ese plato con sus datos originales, aunque el plato ya no aparezca en la carta pública

### Requirement: Fotos de plato con límite de tamaño
El dueño MUST poder subir una foto opcional por plato. El sistema MUST rechazar cualquier subida que supere el límite de tamaño configurado, informando del motivo.

#### Scenario: Subida de foto dentro del límite permitido
- **WHEN** el dueño sube una foto de un plato dentro del límite de tamaño configurado
- **THEN** la foto se guarda y aparece junto al plato en la carta pública

#### Scenario: Subida de foto que supera el límite permitido
- **WHEN** el dueño intenta subir una foto que supera el límite de tamaño configurado
- **THEN** el sistema rechaza la subida, no la guarda y explica el motivo del rechazo

### Requirement: Administración usable desde el móvil
La pantalla de administración del catálogo MUST ser utilizable desde un móvil, sin depender de un ordenador de escritorio.

#### Scenario: Gestión completa de un plato desde un móvil
- **WHEN** el dueño crea o edita un plato desde el navegador de su móvil
- **THEN** puede completar toda la operación (incluida la subida de foto) sin necesitar desplazamiento horizontal ni un ordenador
