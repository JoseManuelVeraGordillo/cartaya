## ADDED Requirements

### Requirement: Marcar y reponer un plato agotado
El dueño MUST poder marcar un plato activo como agotado y revertirlo a disponible, de forma independiente de archivarlo. Marcar o reponer un plato agotado MUST requerir una sesión de establecimiento válida, igual que el resto de operaciones sobre el catálogo. Un plato agotado MUST seguir estando activo (no archivado) y MUST conservar el resto de sus datos sin cambios.

#### Scenario: Marcar un plato como agotado
- **WHEN** el dueño marca como agotado un plato activo
- **THEN** el plato queda marcado como agotado, sigue activo y conserva su nombre, precio, descripción y alérgenos

#### Scenario: Reponer un plato marcado como agotado
- **WHEN** el dueño marca como disponible un plato que estaba agotado
- **THEN** el plato deja de estar marcado como agotado y vuelve a poder pedirse

#### Scenario: Intento de marcar o reponer un plato agotado sin sesión válida
- **WHEN** se intenta marcar o reponer un plato agotado sin una sesión de establecimiento válida
- **THEN** el sistema rechaza la operación y no modifica el plato
