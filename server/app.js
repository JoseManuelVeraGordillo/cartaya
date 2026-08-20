import path from 'node:path';
import express from 'express';
import compression from 'compression';
import { UPLOADS_DIR } from './db/index.js';
import { cartaRouter } from './routes/carta.js';
import { mesasRouter } from './routes/mesas.js';
import { adminRouter } from './routes/admin/index.js';

export function crearApp() {
  const app = express();

  // Comprime HTML/CSS/JS/JSON de todas las respuestas (carta-publica:
  // Rendimiento de carga en móvil); las fotos ya van comprimidas por sharp.
  app.use(compression());
  app.use(express.json());

  app.use('/api', cartaRouter);
  app.use('/api', mesasRouter);
  app.use('/api/admin', adminRouter);

  // Fotos de plato, ya redimensionadas/recomprimidas al subirlas.
  app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '30d', immutable: true }));

  // Frontend (React/Vite) servido como estáticos por el propio Express.
  const distDir = path.resolve(import.meta.dirname, '..', 'web', 'dist');
  app.use(express.static(distDir));
  app.get(/^(?!\/api|\/uploads).*/, (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });

  return app;
}
