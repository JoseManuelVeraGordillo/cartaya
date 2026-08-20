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
  // El canal SSE del panel de cocina queda fuera: comprimir bufferiza la
  // respuesta y rompe la entrega en tiempo real de una conexión que se
  // mantiene abierta.
  app.use(
    compression({
      filter: (req, res) => {
        // req.path ya no sirve aquí: para cuando compression evalúa el
        // filtro (en el primer res.write, con la conexión SSE ya abierta),
        // Express ha recortado req.path al descender por los routers
        // anidados de /api/admin/pedidos y todavía no lo ha restaurado.
        if (req.originalUrl === '/api/admin/pedidos/eventos') return false;
        return compression.filter(req, res);
      },
    })
  );
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
