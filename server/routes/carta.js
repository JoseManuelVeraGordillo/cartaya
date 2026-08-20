import { Router } from 'express';
import { db } from '../db/index.js';

export const cartaRouter = Router();

const consultaCarta = db.prepare(`
  SELECT
    c.id AS categoria_id,
    c.nombre AS categoria_nombre,
    p.id AS plato_id,
    p.nombre AS plato_nombre,
    p.precio_centimos,
    p.descripcion,
    p.foto_url,
    p.alergenos
  FROM categorias c
  JOIN platos p ON p.categoria_id = c.id AND p.archivado_en IS NULL
  WHERE c.archivada_en IS NULL
  ORDER BY c.orden ASC, c.id ASC, p.orden ASC, p.id ASC
`);

// El JOIN interno excluye automáticamente las categorías sin ningún plato
// activo (carta-publica: Categoría sin platos activos no aparece en la carta).
function obtenerCarta() {
  const filas = consultaCarta.all();
  const categorias = [];
  const categoriasPorId = new Map();

  for (const fila of filas) {
    let categoria = categoriasPorId.get(fila.categoria_id);
    if (!categoria) {
      categoria = { id: fila.categoria_id, nombre: fila.categoria_nombre, platos: [] };
      categoriasPorId.set(fila.categoria_id, categoria);
      categorias.push(categoria);
    }
    categoria.platos.push({
      id: fila.plato_id,
      nombre: fila.plato_nombre,
      precioCentimos: fila.precio_centimos,
      descripcion: fila.descripcion,
      fotoUrl: fila.foto_url,
      alergenos: JSON.parse(fila.alergenos),
    });
  }

  return { categorias };
}

cartaRouter.get('/carta', (req, res) => {
  // Carta pública: cambia poco (solo al editar el catálogo), así que se
  // cachea brevemente para acelerar recargas en 4G sin servir datos obsoletos
  // por mucho tiempo (carta-publica: Rendimiento de carga en móvil).
  res.setHeader('Cache-Control', 'public, max-age=30');
  res.json(obtenerCarta());
});
