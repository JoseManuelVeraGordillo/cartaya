import { Router } from 'express';
import { db } from '../../db/index.js';
import { validarAlergenos } from '../../lib/alergenos.js';
import { subirFoto, procesarYGuardarFoto } from '../../lib/imagenes.js';

export const platosRouter = Router();

function filaAPlato(fila) {
  return {
    id: fila.id,
    categoriaId: fila.categoria_id,
    nombre: fila.nombre,
    precioCentimos: fila.precio_centimos,
    descripcion: fila.descripcion,
    fotoUrl: fila.foto_url,
    alergenos: JSON.parse(fila.alergenos),
    orden: fila.orden,
    archivadoEn: fila.archivado_en,
  };
}

const listarTodos = db.prepare('SELECT * FROM platos ORDER BY categoria_id ASC, orden ASC, id ASC');
const listarPorCategoria = db.prepare(
  'SELECT * FROM platos WHERE categoria_id = ? ORDER BY orden ASC, id ASC'
);
const obtenerPorId = db.prepare('SELECT * FROM platos WHERE id = ?');
const obtenerCategoriaPorId = db.prepare('SELECT id FROM categorias WHERE id = ?');
const siguienteOrden = db.prepare(
  'SELECT COALESCE(MAX(orden), 0) + 1 AS siguiente FROM platos WHERE categoria_id = ?'
);
const insertar = db.prepare(`
  INSERT INTO platos (categoria_id, nombre, precio_centimos, descripcion, alergenos, orden)
  VALUES (?, ?, ?, ?, ?, ?)
`);
const actualizar = db.prepare(`
  UPDATE platos SET categoria_id = ?, nombre = ?, precio_centimos = ?, descripcion = ?, alergenos = ?
  WHERE id = ?
`);
const actualizarFoto = db.prepare('UPDATE platos SET foto_url = ? WHERE id = ?');
const archivar = db.prepare('UPDATE platos SET archivado_en = ? WHERE id = ?');
const reactivar = db.prepare('UPDATE platos SET archivado_en = NULL WHERE id = ?');
const reordenarUno = db.prepare('UPDATE platos SET orden = ? WHERE id = ? AND categoria_id = ?');

function validarDatosPlato(body) {
  const categoriaId = Number(body?.categoriaId);
  const nombre = typeof body?.nombre === 'string' ? body.nombre.trim() : '';
  const precioCentimos = Number(body?.precioCentimos);
  const descripcion = typeof body?.descripcion === 'string' ? body.descripcion.trim() : '';

  if (!Number.isInteger(categoriaId) || !obtenerCategoriaPorId.get(categoriaId)) {
    return { error: 'La categoría del plato no es válida.' };
  }
  if (!nombre) {
    return { error: 'El nombre del plato es obligatorio.' };
  }
  if (!Number.isInteger(precioCentimos) || precioCentimos <= 0) {
    return { error: 'El precio del plato debe ser un importe fijo en céntimos mayor que cero.' };
  }
  const alergenos = validarAlergenos(body?.alergenos);
  if (!alergenos.valido) {
    return { error: alergenos.motivo };
  }

  return { datos: { categoriaId, nombre, precioCentimos, descripcion, alergenos: body.alergenos } };
}

platosRouter.get('/', (req, res) => {
  const { categoriaId } = req.query;
  const filas = categoriaId
    ? listarPorCategoria.all(Number(categoriaId))
    : listarTodos.all();
  res.json({ platos: filas.map(filaAPlato) });
});

platosRouter.post('/', (req, res) => {
  const { error, datos } = validarDatosPlato(req.body);
  if (error) return res.status(400).json({ error });

  const { siguiente } = siguienteOrden.get(datos.categoriaId);
  const { lastInsertRowid } = insertar.run(
    datos.categoriaId,
    datos.nombre,
    datos.precioCentimos,
    datos.descripcion,
    JSON.stringify(datos.alergenos),
    siguiente
  );
  res.status(201).json(filaAPlato(obtenerPorId.get(lastInsertRowid)));
});

platosRouter.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!obtenerPorId.get(id)) {
    return res.status(404).json({ error: 'Plato no encontrado.' });
  }
  const { error, datos } = validarDatosPlato(req.body);
  if (error) return res.status(400).json({ error });

  actualizar.run(
    datos.categoriaId,
    datos.nombre,
    datos.precioCentimos,
    datos.descripcion,
    JSON.stringify(datos.alergenos),
    id
  );
  res.json(filaAPlato(obtenerPorId.get(id)));
});

platosRouter.post('/:id/archivar', (req, res) => {
  const id = Number(req.params.id);
  if (!obtenerPorId.get(id)) {
    return res.status(404).json({ error: 'Plato no encontrado.' });
  }
  archivar.run(new Date().toISOString(), id);
  res.json({ ok: true });
});

platosRouter.post('/:id/reactivar', (req, res) => {
  const id = Number(req.params.id);
  if (!obtenerPorId.get(id)) {
    return res.status(404).json({ error: 'Plato no encontrado.' });
  }
  reactivar.run(id);
  res.json({ ok: true });
});

platosRouter.post('/reordenar', (req, res) => {
  const categoriaId = Number(req.body?.categoriaId);
  const ids = req.body?.ids;
  if (!Number.isInteger(categoriaId)) {
    return res.status(400).json({ error: 'Falta la categoría a reordenar.' });
  }
  if (!Array.isArray(ids) || ids.some((id) => !Number.isInteger(id))) {
    return res.status(400).json({ error: 'Se requiere la lista completa de ids en el nuevo orden.' });
  }
  const transaccion = db.transaction((listaIds) => {
    listaIds.forEach((id, indice) => reordenarUno.run(indice + 1, id, categoriaId));
  });
  transaccion(ids);
  res.json({ ok: true });
});

platosRouter.post('/:id/foto', (req, res) => {
  const id = Number(req.params.id);
  if (!obtenerPorId.get(id)) {
    return res.status(404).json({ error: 'Plato no encontrado.' });
  }
  subirFoto(req, res, async (error) => {
    if (error) {
      const motivo =
        error.code === 'LIMIT_FILE_SIZE'
          ? 'La foto supera el límite de 8 MB permitido.'
          : error.message;
      return res.status(400).json({ error: motivo });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha recibido ninguna foto.' });
    }
    try {
      const fotoUrl = await procesarYGuardarFoto(req.file.buffer, id);
      actualizarFoto.run(fotoUrl, id);
      res.json({ fotoUrl });
    } catch {
      res.status(500).json({ error: 'No se pudo procesar la foto.' });
    }
  });
});
