## Why

El dueño necesita poder marcar un plato como agotado durante el servicio (por ejemplo, se acabó el pescado del día) sin archivarlo del catálogo, para que deje de poder pedirse hoy pero vuelva a estar disponible mañana sin tener que volver a crearlo. Esta funcionalidad ya se ha construido en el código (columna `agotado` en `platos`, endpoints de agotar/reponer, aviso en carta pública y bloqueo en el pedido) pero nunca pasó por una propuesta de OpenSpec: no hay spec que la describa, no tiene tests, y contradice el principio de que la spec es la fuente de verdad. Este cambio regulariza esa funcionalidad: la documenta como comportamiento deseado y añade la cobertura de tests que le falta.

## What Changes

- El dueño puede marcar un plato activo como "agotado" y revertirlo a "disponible" desde la administración, sin archivarlo.
- Un plato agotado sigue apareciendo en la carta pública (a diferencia de uno archivado), pero visiblemente marcado como no disponible hoy y sin poder añadirse al pedido.
- La revalidación de disponibilidad al confirmar un pedido trata un plato que pasó a agotado igual que uno archivado: se avisa al cliente, se retira del pedido y se envía el resto.
- Marcar o reponer un plato como agotado requiere sesión de establecimiento válida, igual que el resto de operaciones de catálogo.
- **Decisión de negocio (2026-08-21):** "agotado" es un estado manual e independiente de "archivado"; no se resetea automáticamente al cambiar de día ni al reabrir el servicio. El dueño lo repone a mano cuando vuelve a estar disponible.
- **Decisión de negocio (2026-08-21):** un plato agotado no es lo mismo que uno archivado a efectos de visibilidad: se mantiene visible en la carta (con aviso) precisamente para que el cliente sepa que existe pero no hoy, mientras que uno archivado desaparece por completo.

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

- `catalogo-admin`: el dueño puede marcar y desmarcar un plato activo como agotado, de forma independiente del archivado.
- `carta-publica`: un plato agotado se muestra en la carta pública marcado como no disponible, en vez de ocultarse.
- `pedidos-mesa`: la revalidación de disponibilidad al confirmar un pedido también considera agotado un plato como no disponible, con el mismo tratamiento que uno archivado.

## Impact

- Backend: `server/db/schema.js`, `server/db/index.js` (migración `migrarAgotadoPlatos`), `server/routes/admin/platos.js` (endpoints `/:id/agotar` y `/:id/reponer`), `server/routes/carta.js`, `server/routes/mesas.js`.
- Frontend: `web/src/lib/api.js`, `web/src/pages/Admin/PlatoItem.jsx`, `web/src/pages/CartaPublica.jsx`, `web/src/pages/Pedido/AnadirAlPedido.jsx`.
- Tests: no existen hoy para esta funcionalidad; hay que añadirlos para `catalogo-admin`, `carta-publica` y `pedidos-mesa`.
