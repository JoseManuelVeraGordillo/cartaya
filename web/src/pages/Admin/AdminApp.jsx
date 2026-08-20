import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { AdminLogin } from './AdminLogin.jsx';
import { CatalogoPanel } from './CatalogoPanel.jsx';
import { ArchivadosPanel } from './ArchivadosPanel.jsx';

export function AdminApp() {
  const [sesion, setSesion] = useState('comprobando'); // comprobando | sin-sesion | activa
  const [pestana, setPestana] = useState('catalogo'); // catalogo | archivados
  const [datos, setDatos] = useState({ categorias: [], platos: [] });
  const [error, setError] = useState(null);

  const cargarDatos = useCallback(() => {
    Promise.all([api.listarCategorias(), api.listarPlatos()])
      .then(([categorias, platos]) => {
        setDatos({ categorias: categorias.categorias, platos: platos.platos });
        setError(null);
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    api
      .comprobarSesion()
      .then(() => setSesion('activa'))
      .catch(() => setSesion('sin-sesion'));
  }, []);

  useEffect(() => {
    if (sesion === 'activa') cargarDatos();
  }, [sesion, cargarDatos]);

  async function cerrarSesion() {
    await api.cerrarSesion();
    setSesion('sin-sesion');
  }

  if (sesion === 'comprobando') {
    return (
      <main className="contenedor">
        <p>Comprobando sesión…</p>
      </main>
    );
  }

  if (sesion === 'sin-sesion') {
    return <AdminLogin onSesionIniciada={() => setSesion('activa')} />;
  }

  return (
    <main className="contenedor admin">
      <header className="admin__cabecera">
        <h1>Catálogo · La Estación</h1>
        <button type="button" className="secundario" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </header>

      <nav className="admin__pestanas">
        <button
          type="button"
          className={pestana === 'catalogo' ? '' : 'secundario'}
          onClick={() => setPestana('catalogo')}
        >
          Catálogo
        </button>
        <button
          type="button"
          className={pestana === 'archivados' ? '' : 'secundario'}
          onClick={() => setPestana('archivados')}
        >
          Archivados
        </button>
      </nav>

      {error && <p className="mensaje-error">{error}</p>}

      {pestana === 'catalogo' ? (
        <CatalogoPanel categorias={datos.categorias} platos={datos.platos} onCambiado={cargarDatos} />
      ) : (
        <ArchivadosPanel categorias={datos.categorias} platos={datos.platos} onCambiado={cargarDatos} />
      )}
    </main>
  );
}
