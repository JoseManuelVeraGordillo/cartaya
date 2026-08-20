import { Router } from 'express';
import { iniciarSesion, cerrarSesion, requireSesion, cookies } from '../../middleware/session.js';
import { categoriasRouter } from './categorias.js';
import { platosRouter } from './platos.js';

export const adminRouter = Router();

adminRouter.post('/login', (req, res) => {
  const { password } = req.body ?? {};
  const token = iniciarSesion(typeof password === 'string' ? password : '');
  if (!token) {
    return res.status(401).json({ error: 'Contraseña de establecimiento incorrecta.' });
  }
  cookies.establecerCookieSesion(res, token);
  res.json({ ok: true });
});

adminRouter.post('/logout', (req, res) => {
  cerrarSesion(cookies.tokenDesdePeticion(req));
  cookies.borrarCookieSesion(res);
  res.json({ ok: true });
});

// catalogo-admin: Acceso protegido por sesión de establecimiento.
// Todo lo registrado después de esta línea exige sesión válida.
adminRouter.use(requireSesion);

adminRouter.get('/sesion', (req, res) => {
  res.json({ ok: true });
});

adminRouter.use('/categorias', categoriasRouter);
adminRouter.use('/platos', platosRouter);
