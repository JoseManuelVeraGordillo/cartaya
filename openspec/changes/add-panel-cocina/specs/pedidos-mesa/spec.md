## ADDED Requirements

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
