import crypto from 'node:crypto';

const COOKIE_NAME = 'cartaya_sesion';
const DURACION_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

const isProd = process.env.NODE_ENV === 'production';
const ADMIN_PASSWORD = process.env.CARTAYA_ADMIN_PASSWORD || (isProd ? undefined : 'cartaya-dev');

if (!ADMIN_PASSWORD) {
  throw new Error(
    'Falta la variable de entorno CARTAYA_ADMIN_PASSWORD (contraseña de establecimiento).'
  );
}

// Sesiones en memoria: un único proceso Node, sin necesidad de almacén externo
// (coherente con "base de datos SQLite en un único fichero, suficiente para una cafetería").
const sesionesActivas = new Map(); // token -> expiresAt (epoch ms)

function limpiarSesionesCaducadas() {
  const ahora = Date.now();
  for (const [token, expiraEn] of sesionesActivas) {
    if (expiraEn <= ahora) sesionesActivas.delete(token);
  }
}

function analizarCookies(cabecera) {
  const cookies = {};
  if (!cabecera) return cookies;
  for (const par of cabecera.split(';')) {
    const idx = par.indexOf('=');
    if (idx === -1) continue;
    const clave = par.slice(0, idx).trim();
    const valor = par.slice(idx + 1).trim();
    if (clave) cookies[clave] = decodeURIComponent(valor);
  }
  return cookies;
}

function establecerCookieSesion(res, token) {
  const partes = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(DURACION_MS / 1000)}`,
  ];
  if (isProd) partes.push('Secure');
  res.setHeader('Set-Cookie', partes.join('; '));
}

function borrarCookieSesion(res) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
}

export function iniciarSesion(password) {
  if (password !== ADMIN_PASSWORD) return null;
  limpiarSesionesCaducadas();
  const token = crypto.randomBytes(32).toString('hex');
  sesionesActivas.set(token, Date.now() + DURACION_MS);
  return token;
}

export function cerrarSesion(token) {
  if (token) sesionesActivas.delete(token);
}

function tokenDesdePeticion(req) {
  const cookies = analizarCookies(req.headers.cookie);
  return cookies[COOKIE_NAME];
}

export function haySesionValida(req) {
  const token = tokenDesdePeticion(req);
  if (!token) return false;
  const expiraEn = sesionesActivas.get(token);
  if (!expiraEn || expiraEn <= Date.now()) return false;
  return true;
}

export function requireSesion(req, res, next) {
  if (!haySesionValida(req)) {
    return res.status(401).json({ error: 'Se requiere una sesión de establecimiento válida.' });
  }
  next();
}

export const cookies = { establecerCookieSesion, borrarCookieSesion, analizarCookies, tokenDesdePeticion };
