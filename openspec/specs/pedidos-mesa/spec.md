## Purpose

Permite al cliente de La Estación construir, revisar y confirmar un pedido de platos de la carta desde su móvil, identificado únicamente por la mesa que ha escaneado, sin registro ni dato personal alguno.

## Requirements

### Requirement: Identificación de la mesa mediante QR
Cada mesa MUST tener un código QR único e impreso que, al escanearse, abre la carta con esa mesa ya identificada para poder pedir. El sistema MUST NOT pedir al cliente que se identifique a sí mismo en ningún momento del proceso de pedido.

#### Scenario: Cliente escanea el QR de su mesa
- **WHEN** un cliente escanea el QR impreso en su mesa
- **THEN** el sistema abre la carta con esa mesa identificada, sin pedir registro, email, teléfono ni ningún otro dato personal

### Requirement: Un pedido pertenece a una mesa, nunca a una persona
Todo pedido MUST asociarse exclusivamente a la mesa desde la que se realizó. El sistema MUST NOT almacenar ni solicitar ningún dato que identifique a la persona que pide.

#### Scenario: Pedido registrado sin dato personal
- **WHEN** un cliente confirma un pedido desde su mesa
- **THEN** el pedido queda registrado asociado a esa mesa, sin nombre, email, teléfono ni ningún otro dato personal del cliente

### Requirement: Añadir platos al pedido con cantidad
El cliente MUST poder añadir a su pedido cualquier plato activo de la carta, indicando la cantidad deseada de cada plato.

#### Scenario: Añadir un plato con cantidad
- **WHEN** el cliente añade un plato activo de la carta a su pedido e indica una cantidad
- **THEN** el plato queda en el pedido con esa cantidad, listo para revisarse antes de confirmar

### Requirement: Nota libre por plato con límite de caracteres
El cliente MUST poder añadir una nota de texto libre a cada plato de su pedido (por ejemplo, "sin cebolla" o "poco hecho"). La nota MUST NOT superar los 140 caracteres.

#### Scenario: Añadir una nota dentro del límite
- **WHEN** el cliente escribe una nota de 140 caracteres o menos para un plato de su pedido
- **THEN** el sistema guarda la nota junto a ese plato en el pedido

#### Scenario: Intento de nota que supera el límite
- **WHEN** el cliente intenta escribir una nota de más de 140 caracteres para un plato
- **THEN** el sistema no permite superar el límite e indica al cliente los caracteres restantes

### Requirement: Resumen y confirmación del pedido sin dato personal
Antes de enviarse, el pedido MUST mostrar al cliente un resumen con los platos, cantidades, notas y el total en euros. Confirmar el pedido MUST NOT requerir registro, email, teléfono ni ningún dato personal.

#### Scenario: Cliente revisa el resumen antes de confirmar
- **WHEN** el cliente ha añadido al menos un plato a su pedido y accede al resumen
- **THEN** el sistema muestra los platos, sus cantidades, sus notas y el total en euros (IVA incluido) del pedido

#### Scenario: Cliente confirma el pedido sin dato personal
- **WHEN** el cliente confirma el pedido desde el resumen
- **THEN** el sistema envía el pedido sin haber pedido en ningún momento registro, email, teléfono ni ningún otro dato personal

### Requirement: Confirmación visible con número de pedido y estado
Tras confirmarse, el cliente MUST ver en su móvil una confirmación del pedido con su número de pedido y su estado.

#### Scenario: Confirmación tras enviar el pedido
- **WHEN** el cliente confirma un pedido
- **THEN** el sistema le muestra en su móvil una confirmación con el número de pedido y su estado actual

### Requirement: Ciclo de vida del pedido tras confirmarse
Un pedido confirmado MUST pasar por los estados "recibido", "en_preparacion" y "servido" en ese orden exacto. El sistema MUST NOT permitir que un pedido salte directamente de "recibido" a "servido" ni que retroceda a un estado anterior.

#### Scenario: Transición de recibido a en_preparacion
- **WHEN** un pedido en estado "recibido" se marca como iniciado su preparación
- **THEN** el pedido pasa a estado "en_preparacion"

#### Scenario: Transición de en_preparacion a servido
- **WHEN** un pedido en estado "en_preparacion" se marca como servido
- **THEN** el pedido pasa a estado "servido"

#### Scenario: Intento de saltar de recibido a servido
- **WHEN** se intenta marcar como "servido" un pedido que todavía está en estado "recibido"
- **THEN** el sistema rechaza el cambio y el pedido permanece en "recibido"

#### Scenario: Intento de retroceder el estado de un pedido
- **WHEN** se intenta devolver a un estado anterior un pedido en "en_preparacion" o "servido"
- **THEN** el sistema rechaza el cambio y el pedido conserva su estado actual

### Requirement: Cancelación de un pedido solo en estado recibido
Un pedido MUST poder cancelarse únicamente mientras está en estado "recibido". El sistema MUST NOT permitir cancelar un pedido que ya esté en "en_preparacion" o "servido". Cancelar un pedido MUST registrar el momento en que se cancela y MUST NOT eliminar el pedido del sistema.

#### Scenario: Cancelar un pedido en estado recibido
- **WHEN** se cancela un pedido que está en estado "recibido"
- **THEN** el pedido queda marcado como cancelado, con el momento de la cancelación registrado, y sigue existiendo en el sistema

#### Scenario: Intento de cancelar un pedido ya en preparación
- **WHEN** se intenta cancelar un pedido que está en estado "en_preparacion" o "servido"
- **THEN** el sistema rechaza la cancelación y el pedido conserva su estado actual

### Requirement: Revalidación de disponibilidad al confirmar
Al confirmar el pedido, el sistema MUST comprobar que cada plato del pedido sigue activo en la carta. Si un plato dejó de estar activo desde que el cliente lo añadió, el sistema MUST avisar al cliente y retirarlo del pedido antes de enviarlo, conservando el resto de platos del pedido.

#### Scenario: Un plato del pedido deja de estar activo antes de confirmar
- **WHEN** el cliente confirma un pedido que incluye un plato que el dueño ha archivado mientras el cliente decidía
- **THEN** el sistema avisa al cliente de que ese plato ya no está disponible, lo retira del pedido y envía el resto del pedido sin ese plato

#### Scenario: Todos los platos del pedido dejan de estar activos antes de confirmar
- **WHEN** el cliente confirma un pedido y todos sus platos han dejado de estar activos
- **THEN** el sistema avisa al cliente de que ningún plato sigue disponible y no envía ningún pedido, permitiendo al cliente volver a la carta para elegir otros platos

### Requirement: Varios pedidos independientes por mesa
Una misma mesa MUST poder tener varios pedidos abiertos a lo largo del servicio. Cada confirmación MUST crear un pedido independiente, sin acumularse en un pedido anterior de la misma mesa.

#### Scenario: Segunda confirmación de pedido desde la misma mesa
- **WHEN** una mesa que ya tiene un pedido confirmado durante el servicio confirma un nuevo pedido (por ejemplo, para pedir el postre después)
- **THEN** el sistema crea un pedido nuevo e independiente para esa mesa, sin modificar el pedido anterior
