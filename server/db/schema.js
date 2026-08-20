// Script idempotente: crea las tablas si no existen.
export function crearEsquema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      orden INTEGER NOT NULL,
      archivada_en TEXT
    );

    CREATE TABLE IF NOT EXISTS platos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      categoria_id INTEGER NOT NULL REFERENCES categorias(id),
      nombre TEXT NOT NULL,
      precio_centimos INTEGER NOT NULL,
      descripcion TEXT NOT NULL DEFAULT '',
      foto_url TEXT,
      alergenos TEXT NOT NULL,
      orden INTEGER NOT NULL,
      archivado_en TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_platos_categoria ON platos(categoria_id);

    CREATE TABLE IF NOT EXISTS mesas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mesa_id INTEGER NOT NULL REFERENCES mesas(id),
      estado TEXT NOT NULL CHECK (estado IN ('recibido', 'en_preparacion', 'servido', 'cancelado')),
      total_centimos INTEGER NOT NULL,
      creado_en TEXT NOT NULL,
      cancelado_en TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_pedidos_mesa ON pedidos(mesa_id);

    CREATE TABLE IF NOT EXISTS lineas_pedido (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER NOT NULL REFERENCES pedidos(id),
      plato_id INTEGER NOT NULL REFERENCES platos(id),
      nombre_plato TEXT NOT NULL,
      precio_centimos INTEGER NOT NULL,
      cantidad INTEGER NOT NULL,
      nota TEXT NOT NULL DEFAULT ''
    );

    CREATE INDEX IF NOT EXISTS idx_lineas_pedido_pedido ON lineas_pedido(pedido_id);
  `);
}

// add-panel-cocina: `pedidos.estado` no tenía restricción `CHECK` y no
// existía `cancelado_en`. SQLite no permite añadir un CHECK a una tabla ya
// creada con ALTER TABLE, así que sobre una base de datos previa a este
// cambio hay que reconstruir la tabla conservando los pedidos existentes
// (todos en estado 'recibido', compatible con la nueva restricción).
//
// Se construye la tabla nueva bajo un nombre provisional y se renombra a
// `pedidos` al final (en vez de renombrar la tabla vieja para quitarla de en
// medio) porque `ALTER TABLE ... RENAME` reescribe automáticamente las
// cláusulas REFERENCES de otras tablas que apunten a la renombrada: si se
// renombrara `pedidos`, `lineas_pedido.pedido_id` pasaría a apuntar al
// nombre provisional y se quedaría con una referencia colgante en cuanto esa
// tabla provisional se borrase.
export function migrarEstadoPedidos(db) {
  const columnas = db.prepare('PRAGMA table_info(pedidos)').all();
  const yaMigrada = columnas.some((columna) => columna.name === 'cancelado_en');
  if (yaMigrada) return;

  // DROP TABLE pedidos con `foreign_keys = ON` haría un borrado implícito de
  // sus filas, que la propia base de datos rechazaría por dejar huérfanas
  // las líneas de `lineas_pedido` que las referencian (con pedidos reales ya
  // confirmados, no solo en la tabla vacía). Se desactiva la comprobación
  // solo durante la reconstrucción, siguiendo el patrón documentado por
  // SQLite para cambios de esquema que la sintaxis de ALTER TABLE no cubre;
  // `lineas_pedido.pedido_id` sigue apuntando a los mismos ids, que se
  // conservan al copiar los pedidos existentes.
  db.pragma('foreign_keys = OFF');
  try {
    const reconstruirPedidos = db.transaction(() => {
      db.exec(`
        CREATE TABLE pedidos_con_estados (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          mesa_id INTEGER NOT NULL REFERENCES mesas(id),
          estado TEXT NOT NULL CHECK (estado IN ('recibido', 'en_preparacion', 'servido', 'cancelado')),
          total_centimos INTEGER NOT NULL,
          creado_en TEXT NOT NULL,
          cancelado_en TEXT
        );

        INSERT INTO pedidos_con_estados (id, mesa_id, estado, total_centimos, creado_en)
        SELECT id, mesa_id, estado, total_centimos, creado_en FROM pedidos;

        DROP TABLE pedidos;

        ALTER TABLE pedidos_con_estados RENAME TO pedidos;

        CREATE INDEX IF NOT EXISTS idx_pedidos_mesa ON pedidos(mesa_id);
      `);
    });
    reconstruirPedidos();
  } finally {
    db.pragma('foreign_keys = ON');
  }
}
