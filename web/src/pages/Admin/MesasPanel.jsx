import { useState } from 'react';
import { api } from '../../lib/api.js';

export function MesasPanel({ mesas, onCambiado }) {
  const [nombreNueva, setNombreNueva] = useState('');
  const [creando, setCreando] = useState(false);
  const [enBusy, setEnBusy] = useState(null);

  async function crearMesa(evento) {
    evento.preventDefault();
    if (!nombreNueva.trim()) return;
    setCreando(true);
    try {
      await api.crearMesa(nombreNueva.trim());
      setNombreNueva('');
      onCambiado();
    } catch (err) {
      alert(err.message);
    } finally {
      setCreando(false);
    }
  }

  async function regenerarToken(mesa) {
    if (
      !confirm(
        `¿Regenerar el código QR de "${mesa.nombre}"? El QR impreso actual dejará de funcionar y habrá que volver a imprimirlo.`
      )
    ) {
      return;
    }
    setEnBusy(mesa.id);
    try {
      await api.regenerarTokenMesa(mesa.id);
      onCambiado();
    } catch (err) {
      alert(err.message);
    } finally {
      setEnBusy(null);
    }
  }

  return (
    <div className="mesas-panel">
      {mesas.length === 0 && <p>Todavía no hay mesas. Crea la primera abajo.</p>}

      <ul className="archivados__lista">
        {mesas.map((mesa) => (
          <li key={mesa.id} className="archivados__item mesas-panel__item">
            <img
              className="mesas-panel__qr"
              src={`/api/admin/mesas/${mesa.id}/qr`}
              alt={`Código QR de la mesa ${mesa.nombre}`}
              width="96"
              height="96"
            />
            <div className="mesas-panel__info">
              <strong>{mesa.nombre}</strong>
            </div>
            <div className="mesas-panel__acciones">
              <a
                className="boton-archivo"
                href={`/api/admin/mesas/${mesa.id}/qr`}
                download={`qr-${mesa.nombre}.png`}
              >
                Descargar QR
              </a>
              <button type="button" className="secundario" onClick={() => regenerarToken(mesa)} disabled={enBusy === mesa.id}>
                Regenerar QR
              </button>
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={crearMesa} className="nueva-categoria">
        <div className="campo">
          <label htmlFor="nueva-mesa">Nueva mesa</label>
          <input
            id="nueva-mesa"
            type="text"
            value={nombreNueva}
            onChange={(e) => setNombreNueva(e.target.value)}
            placeholder="p. ej. Mesa 5"
          />
        </div>
        <button type="submit" disabled={creando}>
          + Crear mesa
        </button>
      </form>
    </div>
  );
}
