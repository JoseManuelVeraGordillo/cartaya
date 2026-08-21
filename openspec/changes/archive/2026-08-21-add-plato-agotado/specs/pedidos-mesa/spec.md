## MODIFIED Requirements

### Requirement: Añadir platos al pedido con cantidad
El cliente MUST poder añadir a su pedido cualquier plato activo y no agotado de la carta, indicando la cantidad deseada de cada plato. Un plato marcado como agotado MUST NOT poder añadirse al pedido.

#### Scenario: Añadir un plato con cantidad
- **WHEN** el cliente añade un plato activo y no agotado de la carta a su pedido e indica una cantidad
- **THEN** el plato queda en el pedido con esa cantidad, listo para revisarse antes de confirmar

#### Scenario: Intento de añadir un plato agotado
- **WHEN** el cliente ve en la carta un plato marcado como agotado
- **THEN** el sistema no permite añadirlo al pedido

### Requirement: Revalidación de disponibilidad al confirmar
Al confirmar el pedido, el sistema MUST comprobar que cada plato del pedido sigue activo y no agotado en la carta. Si un plato dejó de estar activo o pasó a estar agotado desde que el cliente lo añadió, el sistema MUST avisar al cliente y retirarlo del pedido antes de enviarlo, conservando el resto de platos del pedido.

#### Scenario: Un plato del pedido deja de estar activo antes de confirmar
- **WHEN** el cliente confirma un pedido que incluye un plato que el dueño ha archivado mientras el cliente decidía
- **THEN** el sistema avisa al cliente de que ese plato ya no está disponible, lo retira del pedido y envía el resto del pedido sin ese plato

#### Scenario: Un plato del pedido pasa a agotado antes de confirmar
- **WHEN** el cliente confirma un pedido que incluye un plato que el dueño ha marcado como agotado mientras el cliente decidía
- **THEN** el sistema avisa al cliente de que ese plato ya no está disponible, lo retira del pedido y envía el resto del pedido sin ese plato

#### Scenario: Todos los platos del pedido dejan de estar activos antes de confirmar
- **WHEN** el cliente confirma un pedido y todos sus platos han dejado de estar activos o han pasado a agotados
- **THEN** el sistema avisa al cliente de que ningún plato sigue disponible y no envía ningún pedido, permitiendo al cliente volver a la carta para elegir otros platos
