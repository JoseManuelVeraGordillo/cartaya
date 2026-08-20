import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

export const PASSWORD_PRUEBA = 'contrasena-de-prueba';

// Cada fichero de test lo ejecuta node:test en un proceso propio, así que
// fijar estas variables de entorno antes del import dinámico aísla la base
// de datos y desactiva el sembrado de datos de desarrollo (NODE_ENV=production
// evita interferencias con las aserciones sobre el estado exacto del catálogo).
export async function crearAppDePrueba() {
  const dir = mkdtempSync(path.join(tmpdir(), 'cartaya-test-'));
  process.env.CARTAYA_DATA_DIR = dir;
  process.env.CARTAYA_ADMIN_PASSWORD = PASSWORD_PRUEBA;
  process.env.NODE_ENV = 'production';

  const { crearApp } = await import('../server/app.js');
  const { db } = await import('../server/db/index.js');
  const app = crearApp();
  const servidor = app.listen(0);
  await new Promise((resolve) => servidor.once('listening', resolve));
  const base = `http://localhost:${servidor.address().port}`;

  return {
    base,
    async cerrar() {
      await new Promise((resolve) => servidor.close(resolve));
      db.close();
      // En Windows, better-sqlite3 puede tardar un instante en soltar el
      // fichero WAL tras close(); un par de reintentos evita un EPERM aquí.
      rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
    },
  };
}

export async function iniciarSesionDePrueba(base) {
  const respuesta = await fetch(`${base}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: PASSWORD_PRUEBA }),
  });
  if (!respuesta.ok) throw new Error('No se pudo iniciar sesión en el entorno de prueba.');
  return respuesta.headers.get('set-cookie').split(';')[0];
}
