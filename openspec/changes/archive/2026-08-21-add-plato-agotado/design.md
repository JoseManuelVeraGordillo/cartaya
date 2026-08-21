## Context

El código de esta funcionalidad ya existe en el árbol de trabajo (sin commitear): columna `agotado` en `platos`, endpoints `/api/admin/platos/:id/agotar` y `/:id/reponer`, marcado en la carta pública y bloqueo de añadir/confirmar en el pedido. Este design.md documenta la arquitectura ya construida y sirve de base para completar lo que falta: tests. Ver proposal.md para la motivación de negocio.

## Goals / Non-Goals

**Goals:**
- Documentar el modelo de datos y los endpoints ya implementados para "agotado".
- Dejar trazado qué test cubre cada escenario de las tres specs delta.

**Non-Goals:**
- No se rediseña el mecanismo: se regulariza el ya construido, salvo que un test revele un defecto.
- No se añade reposición automática (por hora, por día) ni configuración del aviso: fuera de alcance según las decisiones de negocio de proposal.md.

## Decisions

- **Columna `agotado` en `platos` (INTEGER 0/1) en vez de una tabla o estado separado.** Sigue el mismo patrón que `archivado_en`, es la opción más simple para SQLite y evita una migración de esquema mayor. Alternativa descartada: fusionar "agotado" dentro del propio campo de estado de archivado (perdería la distinción entre "archivado" y "agotado" que exige el negocio).
- **Migración `migrarAgotadoPlatos` con `ALTER TABLE ... ADD COLUMN`** (a diferencia de la reconstrucción completa usada para `pedidos.estado`), porque añadir una columna con `DEFAULT 0` sí lo permite `ALTER TABLE` en SQLite sin reconstruir la tabla.
- **El bloqueo de "agotado" se aplica en tres puntos independientes:** UI (deshabilita los controles de `AnadirAlPedido`), y servidor (revalidación transaccional al confirmar en `mesas.js`). La UI es solo cortesía; el servidor es la única fuente de verdad, igual que ya ocurre con `archivado_en`.

## Risks / Trade-offs

- [Sin tests hasta ahora] → Este cambio añade la cobertura que falta en `tests/catalogo-admin.test.js`, `tests/carta-publica.test.js` y `tests/pedidos-mesa.test.js` antes de darse por regularizado.
- [Confusión entre "agotado" y "archivado" para el dueño] → Mitigado porque la UI ya usa etiquetas distintas ("Agotado" en admin, "Agotado hoy" en carta pública) y el botón de admin alterna explícitamente entre "Marcar agotado" / "Marcar disponible".
