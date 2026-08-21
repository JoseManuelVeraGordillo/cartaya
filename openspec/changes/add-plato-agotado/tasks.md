## 1. Verificar el código ya construido frente a las specs delta

- [x] 1.1 Revisar `server/db/schema.js` / `server/db/index.js` (`migrarAgotadoPlatos`) frente a la decisión de diseño de columna `agotado` con `ALTER TABLE`; confirmar que es idempotente y compatible con bases de datos existentes.
- [x] 1.2 Revisar `server/routes/admin/platos.js` (`/:id/agotar`, `/:id/reponer`) frente al requisito "Marcar y reponer un plato agotado" de `catalogo-admin`: sesión requerida, plato inexistente devuelve 404, no afecta a `archivado_en`.
- [x] 1.3 Revisar `server/routes/carta.js` y `web/src/pages/CartaPublica.jsx` frente al requisito "Aviso visible de plato agotado" de `carta-publica`: el plato agotado sigue apareciendo, con aviso, y desaparece el aviso al reponerlo.
- [x] 1.4 Revisar `web/src/pages/Pedido/AnadirAlPedido.jsx` frente al escenario "Intento de añadir un plato agotado" de `pedidos-mesa`.
- [x] 1.5 Revisar `server/routes/mesas.js` (revalidación transaccional al confirmar) frente al escenario "Un plato del pedido pasa a agotado antes de confirmar" de `pedidos-mesa`.

## 2. Tests de catalogo-admin

- [x] 2.1 Test: marcar un plato activo como agotado lo deja agotado, activo y con sus datos intactos.
- [x] 2.2 Test: reponer un plato agotado lo deja disponible de nuevo.
- [x] 2.3 Test: marcar o reponer un plato agotado sin sesión de establecimiento válida se rechaza y no modifica el plato.

## 3. Tests de carta-publica

- [x] 3.1 Test: un plato agotado aparece en la carta pública con nombre, precio, descripción, alérgenos y el aviso de agotado.
- [x] 3.2 Test: un plato repuesto deja de mostrar el aviso de agotado en la carta pública.

## 4. Tests de pedidos-mesa

- [x] 4.1 Test: un plato agotado no puede añadirse al pedido desde la carta.
- [x] 4.2 Test: confirmar un pedido con un plato que pasó a agotado desde que se añadió avisa al cliente, lo retira y envía el resto del pedido.
- [x] 4.3 Test: confirmar un pedido en el que todos los platos han pasado a agotados o archivados no envía ningún pedido y avisa al cliente.
- [x] 4.4 Test: un plato activo y no agotado sigue pudiendo añadirse al pedido con cantidad (no regresión del escenario existente).

## 5. Cierre

- [x] 5.1 Ejecutar la suite completa de tests (`npm test` o equivalente) y confirmar que pasa.
- [ ] 5.2 Hacer commit de los cambios de código de "agotado" ya presentes en el árbol de trabajo junto con los tests nuevos.
