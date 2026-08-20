import { Router } from 'express';
import { db } from '../../db/index.js';

export const categoriasRouter = Router();

const listarTodas = db.prepare(
  'SELECT id, nombre, orden, archivada_en AS archivadaEn FROM categorias ORDER BY orden ASC, id ASC'
);
const obtenerPorId = db.prepare('SELECT id FROM categorias WHERE id = ?');
const siguienteOrden = db.prepare(
  "SELECT COALESCE(MAX(orden), 0) + 1 AS siguiente FROM categorias"
);
const insertar = db.prepare('INSERT INTO categorias (nombre, orden) VALUES (?, ?)');
const actualizarNombre = db.prepare('UPDATE categorias SET nombre = ? WHERE id = ?');
const archivar = db.prepare('UPDATE categorias SET archivada_en = ? WHERE id = ?');
const reactivar = db.prepare('UPDATE categorias SET archivada_en = NULL WHERE id = ?');
const reordenarUna = db.prepare('UPDATE categorias SET orden = ? WHERE id = ?');

categoriasRouter.get('/', (req, res) => {
  res.json({ categorias: listarTodas.all() });
});

categoriasRouter.post('/', (req, res) => {
  const nombre = typeof req.body?.nombre === 'string' ? req.body.nombre.trim() : '';
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre de la categoría es obligatorio.' });
  }
  const { siguiente } = siguienteOrden.get();
  const { lastInsertRowid } = insertar.run(nombre, siguiente);
  res.status(201).json({ id: lastInsertRowid, nombre, orden: siguiente, archivadaEn: null });
});

categoriasRouter.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const nombre = typeof req.body?.nombre === 'string' ? req.body.nombre.trim() : '';
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre de la categoría es obligatorio.' });
  }
  if (!obtenerPorId.get(id)) {
    return res.status(404).json({ error: 'Categoría no encontrada.' });
  }
  actualizarNombre.run(nombre, id);
  res.json({ ok: true });
});

categoriasRouter.post('/:id/archivar', (req, res) => {
  const id = Number(req.params.id);
  if (!obtenerPorId.get(id)) {
    return res.status(404).json({ error: 'Categoría no encontrada.' });
  }
  archivar.run(new Date().toISOString(), id);
  res.json({ ok: true });
});

categoriasRouter.post('/:id/reactivar', (req, res) => {
  const id = Number(req.params.id);
  if (!obtenerPorId.get(id)) {
    return res.status(404).json({ error: 'Categoría no encontrada.' });
  }
  reactivar.run(id);
  res.json({ ok: true });
});

categoriasRouter.post('/reordenar', (req, res) => {
  const ids = req.body?.ids;
  if (!Array.isArray(ids) || ids.some((id) => !Number.isInteger(id))) {
    return res.status(400).json({ error: 'Se requiere la lista completa de ids en el nuevo orden.' });
  }
  const transaccion = db.transaction((listaIds) => {
    listaIds.forEach((id, indice) => reordenarUna.run(indice + 1, id));
  });
  transaccion(ids);
  res.json({ ok: true });
});
