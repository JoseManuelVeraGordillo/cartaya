import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import sharp from 'sharp';
import { UPLOADS_DIR } from '../db/index.js';

// design.md - Decisión de fotos: 8 MB de entrada, redimensionado a 1200px de
// ancho máximo y recompresión a JPEG ~75 antes de guardar.
const LIMITE_BYTES_ENTRADA = 8 * 1024 * 1024;
const ANCHO_MAXIMO = 1200;
const CALIDAD_JPEG = 75;

export const subirFoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: LIMITE_BYTES_ENTRADA },
}).single('foto');

export async function procesarYGuardarFoto(buffer, platoId) {
  const nombreArchivo = `plato-${platoId}-${crypto.randomBytes(6).toString('hex')}.jpg`;
  const rutaDestino = path.join(UPLOADS_DIR, nombreArchivo);

  await sharp(buffer)
    .resize({ width: ANCHO_MAXIMO, withoutEnlargement: true })
    .jpeg({ quality: CALIDAD_JPEG })
    .toFile(rutaDestino);

  return `/uploads/${nombreArchivo}`;
}
