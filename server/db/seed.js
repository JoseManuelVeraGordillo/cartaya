// Datos mínimos para desarrollo local. Nunca se ejecuta en producción y solo
// siembra si el catálogo está vacío, para no interferir con datos reales.
export function sembrarDatosDesarrollo(db) {
  if (process.env.NODE_ENV === 'production') return;

  const { total } = db.prepare('SELECT COUNT(*) AS total FROM categorias').get();
  if (total > 0) return;

  const insertarCategoria = db.prepare(
    'INSERT INTO categorias (nombre, orden) VALUES (?, ?)'
  );
  const insertarPlato = db.prepare(`
    INSERT INTO platos (categoria_id, nombre, precio_centimos, descripcion, alergenos, orden)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertarTodo = db.transaction(() => {
    const { lastInsertRowid: categoriaId } = insertarCategoria.run('Bebidas', 1);
    insertarPlato.run(
      categoriaId,
      'Café con leche',
      120,
      'Café solo con leche del día, taza grande.',
      JSON.stringify(['lacteos']),
      1
    );
  });

  insertarTodo();
}
