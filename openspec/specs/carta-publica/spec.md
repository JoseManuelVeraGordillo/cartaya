## Purpose

Permite a cualquier cliente de La Estación consultar la carta actualizada del establecimiento desde su móvil, sin identificarse ni instalar nada, tras escanear el QR de su mesa.

## Requirements

### Requirement: Acceso público sin identificación
La carta MUST poder consultarse sin que el cliente se identifique, se registre ni aporte ningún dato personal.

#### Scenario: Cliente accede a la carta escaneando el QR
- **WHEN** un cliente escanea el QR de su mesa y abre el enlace
- **THEN** el sistema muestra la carta sin pedir inicio de sesión, registro ni ningún dato personal

### Requirement: Organización en categorías y platos ordenados
La carta MUST mostrar las categorías en el orden definido por el dueño, y dentro de cada categoría, los platos en el orden manual definido por el dueño.

#### Scenario: Categorías en el orden definido por el dueño
- **WHEN** un cliente abre la carta
- **THEN** las categorías se muestran en el mismo orden en que el dueño las ha ordenado

#### Scenario: Platos en el orden definido por el dueño dentro de su categoría
- **WHEN** un cliente abre una categoría de la carta
- **THEN** los platos de esa categoría se muestran en el mismo orden manual en que el dueño los ha ordenado

### Requirement: Visibilidad exclusiva de platos activos
La carta MUST mostrar únicamente los platos activos (no eliminados) de cada categoría. Un plato archivado (eliminado por el dueño) MUST NOT aparecer nunca en la carta pública.

#### Scenario: Plato archivado no aparece en la carta
- **WHEN** el dueño ha archivado (eliminado del catálogo) un plato
- **THEN** ese plato no aparece en la carta pública en ninguna categoría

#### Scenario: Categoría archivada no aparece en la carta
- **WHEN** el dueño ha archivado una categoría, aunque contenga platos activos
- **THEN** ni la categoría ni sus platos aparecen en la carta pública

#### Scenario: Categoría sin platos activos no aparece en la carta
- **WHEN** una categoría no tiene ningún plato activo
- **THEN** esa categoría no se muestra en la carta pública

### Requirement: Aviso visible de plato agotado
Un plato activo marcado como agotado MUST seguir apareciendo en la carta pública (a diferencia de un plato archivado), pero MUST mostrarse con un aviso visible de que no está disponible hoy.

#### Scenario: Plato agotado visible con aviso
- **WHEN** un cliente ve en la carta un plato que el dueño ha marcado como agotado
- **THEN** el plato se muestra con su nombre, precio, descripción y alérgenos, junto con un aviso visible de que está agotado

#### Scenario: Plato repuesto deja de mostrar el aviso
- **WHEN** el dueño repone un plato que estaba marcado como agotado
- **THEN** la carta pública deja de mostrar el aviso de agotado para ese plato

### Requirement: Información obligatoria por plato
Cada plato mostrado en la carta MUST incluir nombre, precio en euros con IVA incluido, descripción corta y sus alérgenos; la foto es opcional.

#### Scenario: Plato con toda la información
- **WHEN** un cliente ve un plato en la carta
- **THEN** el sistema muestra su nombre, su precio en euros (IVA incluido) y su descripción corta

#### Scenario: Plato sin foto
- **WHEN** el dueño no ha subido foto para un plato
- **THEN** el plato se muestra igualmente en la carta, sin foto, sin que falte ningún otro dato obligatorio

### Requirement: Alérgenos siempre visibles
Cada plato MUST mostrar de forma siempre visible sus alérgenos, declarados entre los 14 de declaración obligatoria de la normativa europea (gluten, crustáceos, huevo, pescado, cacahuetes, soja, lácteos, frutos de cáscara, apio, mostaza, granos de sésamo, dióxido de azufre y sulfitos, altramuces, moluscos). Un plato sin alérgenos declarados MUST mostrar explícitamente "sin alérgenos"; la ausencia de información sobre alérgenos MUST NOT considerarse una opción válida.

#### Scenario: Plato con alérgenos declarados
- **WHEN** un plato tiene alérgenos declarados
- **THEN** la carta muestra esos alérgenos de forma visible junto al plato, sin necesidad de una acción adicional del cliente

#### Scenario: Plato sin alérgenos declarados
- **WHEN** un plato no tiene ningún alérgeno declarado
- **THEN** la carta muestra explícitamente "sin alérgenos" junto al plato

### Requirement: Rendimiento de carga en móvil
La carta pública MUST cargar en menos de 2 segundos en un móvil de gama media con conexión 4G.

#### Scenario: Carga rápida en móvil con 4G
- **WHEN** un cliente abre la carta desde un móvil de gama media con conexión 4G
- **THEN** la carta queda completamente cargada y legible en menos de 2 segundos

### Requirement: Legibilidad y accesibilidad visual
La carta MUST usar tipografía legible y contraste alto, de forma que sea utilizable por personas mayores en un móvil a contraluz.

#### Scenario: Texto legible a contraluz
- **WHEN** un cliente consulta la carta en un móvil bajo luz solar directa
- **THEN** el nombre, precio y alérgenos de cada plato siguen siendo legibles por su contraste y tamaño de letra
