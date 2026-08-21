## ADDED Requirements

### Requirement: Aviso visible de plato agotado
Un plato activo marcado como agotado MUST seguir apareciendo en la carta pública (a diferencia de un plato archivado), pero MUST mostrarse con un aviso visible de que no está disponible hoy.

#### Scenario: Plato agotado visible con aviso
- **WHEN** un cliente ve en la carta un plato que el dueño ha marcado como agotado
- **THEN** el plato se muestra con su nombre, precio, descripción y alérgenos, junto con un aviso visible de que está agotado

#### Scenario: Plato repuesto deja de mostrar el aviso
- **WHEN** el dueño repone un plato que estaba marcado como agotado
- **THEN** la carta pública deja de mostrar el aviso de agotado para ese plato
