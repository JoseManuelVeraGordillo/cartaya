// Script idempotente: crea las tablas si no existen. Sin datos previos que
// migrar (proyecto en fase inicial, ver design.md - Migration Plan).
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
      estado TEXT NOT NULL,
      total_centimos INTEGER NOT NULL,
      creado_en TEXT NOT NULL
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
