import { useState } from 'react';
import { api, formatearPrecio } from '../../lib/api.js';
import { textoAlergenos } from '../../lib/alergenos.js';

export function ArchivadosPanel({ categorias, platos, onCambiado }) {
  const [enBusy, setEnBusy] = useState(null);

  const categoriasArchivadas = categorias.filter((c) => c.archivadaEn);
  const platosArchivados = platos.filter((p) => p.archivadoEn);
  const nombreCategoria = (id) => categorias.find((c) => c.id === id)?.nombre ?? '—';

  async function reactivarCategoria(id) {
    setEnBusy(`c${id}`);
    try {
      await api.reactivarCategoria(id);
      onCambiado();
    } catch (err) {
      alert(err.message);
    } finally {
      setEnBusy(null);
    }
  }

  async function reactivarPlato(id) {
    setEnBusy(`p${id}`);
    try {
      await api.reactivarPlato(id);
      onCambiado();
    } catch (err) {
      alert(err.message);
    } finally {
      setEnBusy(null);
    }
  }

  return (
    <div className="archivados">
      <section>
        <h2>Categorías archivadas</h2>
        {categoriasArchivadas.length === 0 && <p>No hay categorías archivadas.</p>}
        <ul className="archivados__lista">
          {categoriasArchivadas.map((categoria) => (
            <li key={categoria.id} className="archivados__item">
              <span>{categoria.nombre}</span>
              <button type="button" onClick={() => reactivarCategoria(categoria.id)} disabled={enBusy === `c${categoria.id}`}>
                Reactivar
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Platos archivados</h2>
        {platosArchivados.length === 0 && <p>No hay platos archivados.</p>}
        <ul className="archivados__lista">
          {platosArchivados.map((plato) => (
            <li key={plato.id} className="archivados__item">
              <div>
                <strong>{plato.nombre}</strong> — {formatearPrecio(plato.precioCentimos)}
                <br />
                <small>
                  {nombreCategoria(plato.categoriaId)} · {textoAlergenos(plato.alergenos)}
                </small>
              </div>
              <button type="button" onClick={() => reactivarPlato(plato.id)} disabled={enBusy === `p${plato.id}`}>
                Reactivar
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
