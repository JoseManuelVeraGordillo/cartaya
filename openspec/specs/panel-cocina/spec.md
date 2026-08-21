# panel-cocina Specification

## Purpose

Permite a cocina y barra ver y gestionar, desde una tablet apoyada en la barra, los pedidos confirmados que van llegando durante el servicio, sin tener que recargar la pantalla ni avisar a viva voz.

## Requirements

### Requirement: Acceso protegido por sesión de establecimiento
El panel de cocina MUST requerir una sesión de establecimiento válida. Ninguna consulta ni acción sobre los pedidos MUST ejecutarse sin esa sesión.

#### Scenario: Acceso al panel con sesión válida
- **WHEN** hay una sesión de establecimiento válida
- **THEN** el sistema permite acceder al panel de cocina y ver los pedidos del día

#### Scenario: Intento de acceso o acción sin sesión válida
- **WHEN** se intenta consultar el panel o avanzar, cancelar o consultar el histórico de un pedido sin una sesión de establecimiento válida
- **THEN** el sistema rechaza la operación y no muestra ni modifica ningún pedido

### Requirement: Listado de pedidos activos del día por antigüedad
El panel MUST mostrar los pedidos del día que no estén en estado "servido" ni cancelados, ordenados del más antiguo al más reciente, mostrando de cada uno la mesa, los platos con sus cantidades, las notas del cliente por plato y el tiempo transcurrido desde que se confirmó.

#### Scenario: Pedidos ordenados por antigüedad
- **WHEN** hay varios pedidos activos del día
- **THEN** el panel los muestra ordenados del más antiguo al más reciente

#### Scenario: Datos completos de cada pedido
- **WHEN** el panel muestra un pedido
- **THEN** incluye la mesa, cada plato con su cantidad, la nota del cliente para ese plato (si la hay) y el tiempo transcurrido desde la confirmación

### Requirement: Aparición en tiempo real de pedidos nuevos
El panel MUST reflejar los pedidos nuevos y los cambios de estado en cuanto ocurren, sin que quien lo mira tenga que recargar la página, mediante una conexión de eventos en tiempo real.

#### Scenario: Un pedido nuevo aparece solo en el panel
- **WHEN** se confirma un pedido nuevo mientras el panel está abierto
- **THEN** el pedido aparece en el panel sin que nadie recargue la página

#### Scenario: Un cambio de estado se refleja sin recargar
- **WHEN** un pedido cambia de estado (por ejemplo, pasa a "en_preparacion") desde cualquier tablet con el panel abierto
- **THEN** todas las tablets con el panel abierto reflejan ese cambio sin recargar la página

### Requirement: Aviso simple ante un pedido nuevo
El panel MUST mostrar un aviso simple y no configurable cuando llegue un pedido nuevo, para que cocina lo note aunque no esté mirando la pantalla en ese momento.

#### Scenario: Aviso al llegar un pedido nuevo
- **WHEN** llega un pedido nuevo al panel
- **THEN** el sistema muestra un aviso simple de que ha llegado un pedido nuevo

### Requirement: Avance del estado de un pedido desde el panel
El panel MUST permitir marcar un pedido "recibido" como "en_preparacion", y un pedido "en_preparacion" como "servido". El panel MUST NOT ofrecer ninguna acción que salte directamente de "recibido" a "servido" ni que retroceda un pedido a un estado anterior.

#### Scenario: Marcar un pedido como en preparación
- **WHEN** cocina marca como "en preparación" un pedido en estado "recibido"
- **THEN** el pedido pasa a "en_preparacion" y se refleja así en el panel

#### Scenario: Marcar un pedido como servido
- **WHEN** cocina marca como "servido" un pedido en estado "en_preparacion"
- **THEN** el pedido pasa a "servido"

#### Scenario: El panel no ofrece saltar ni retroceder estados
- **WHEN** cocina ve un pedido en el panel
- **THEN** el panel solo ofrece la acción hacia el siguiente estado válido de ese pedido, nunca una que salte un estado intermedio o retroceda a uno anterior

### Requirement: Cancelación de un pedido desde el panel
El panel MUST permitir cancelar un pedido únicamente mientras está en estado "recibido". El panel MUST NOT ofrecer la cancelación de un pedido que ya esté "en_preparacion" o "servido".

#### Scenario: Cancelar un pedido recién recibido
- **WHEN** cocina cancela un pedido que está en estado "recibido"
- **THEN** el pedido queda cancelado y deja de aparecer entre los pedidos activos

#### Scenario: No se puede cancelar un pedido ya en preparación
- **WHEN** cocina ve un pedido en estado "en_preparacion" o "servido"
- **THEN** el panel no ofrece ninguna acción para cancelarlo

### Requirement: Archivado a histórico al servirse
En cuanto un pedido pasa a "servido", el sistema MUST retirarlo de la vista de pedidos activos del panel y dejarlo disponible en el histórico del día.

#### Scenario: Un pedido servido desaparece de la vista activa
- **WHEN** un pedido pasa a "servido"
- **THEN** deja de mostrarse entre los pedidos activos del panel

### Requirement: Histórico de pedidos del día
El panel MUST ofrecer una vista de histórico donde consultar todos los pedidos del día, incluidos los servidos y los cancelados, con su estado y sus horas relevantes.

#### Scenario: Consultar el histórico del día
- **WHEN** cocina abre el histórico del día desde el panel
- **THEN** el sistema muestra todos los pedidos del día, incluidos los servidos y los cancelados, con su estado
