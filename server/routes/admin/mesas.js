import crypto from 'node:crypto';
import { Router } from 'express';
import QRCode from 'qrcode';
import { db } from '../../db/index.js';

export const mesasRouter = Router();

function generarToken() {
  return crypto.randomBytes(20).toString('hex');
}

const listarTodas = db.prepare('SELECT id, nombre, token FROM mesas ORDER BY id ASC');
const obtenerPorId = db.prepare('SELECT id, nombre, token FROM mesas WHERE id = ?');
const insertar = db.prepare('INSERT INTO mesas (nombre, token) VALUES (?, ?)');
const actualizarToken = db.prepare('UPDATE mesas SET token = ? WHERE id = ?');

mesasRouter.get('/', (req, res) => {
  res.json({ mesas: listarTodas.all() });
});

mesasRouter.post('/', (req, res) => {
  const nombre = typeof req.body?.nombre === 'string' ? req.body.nombre.trim() : '';
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre de la mesa es obligatorio.' });
  }
  const token = generarToken();
  const { lastInsertRowid } = insertar.run(nombre, token);
  res.status(201).json({ id: lastInsertRowid, nombre, token });
});

// pedidos-mesa: Riesgos - token de mesa filtrado. Regenerar invalida el QR
// impreso anterior sin tener que volver a crear la mesa ni perder su
// histórico de pedidos.
mesasRouter.post('/:id/regenerar-token', (req, res) => {
  const id = Number(req.params.id);
  const mesa = obtenerPorId.get(id);
  if (!mesa) {
    return res.status(404).json({ error: 'Mesa no encontrada.' });
  }
  const token = generarToken();
  actualizarToken.run(token, id);
  res.json({ id, nombre: mesa.nombre, token });
});

mesasRouter.get('/:id/qr', async (req, res) => {
  const id = Number(req.params.id);
  const mesa = obtenerPorId.get(id);
  if (!mesa) {
    return res.status(404).json({ error: 'Mesa no encontrada.' });
  }
  const url = `${req.protocol}://${req.get('host')}/mesa/${mesa.token}`;
  try {
    const png = await QRCode.toBuffer(url, { type: 'png', width: 400, margin: 2 });
    res.setHeader('Content-Type', 'image/png');
    res.send(png);
  } catch {
    res.status(500).json({ error: 'No se pudo generar el código QR.' });
  }
});
