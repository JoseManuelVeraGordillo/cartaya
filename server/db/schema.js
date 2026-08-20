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
  `);
}
