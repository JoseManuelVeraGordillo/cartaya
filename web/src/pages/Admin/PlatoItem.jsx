import { useEffect, useRef, useState } from 'react';
import { api, formatearPrecio } from '../../lib/api.js';
import { textoAlergenos } from '../../lib/alergenos.js';
import { PlatoForm } from './PlatoForm.jsx';

export function PlatoItem({ plato, esPrimero, esUltimo, onCambiado, onMover, archivado }) {
  const [editando, setEditando] = useState(false);
  const [enBusy, setEnBusy] = useState(false);
  const [errorFoto, setErrorFoto] = useState(null);
  const [previsualizacion, setPrevisualizacion] = useState(null);
  const inputFotoRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previsualizacion) URL.revokeObjectURL(previsualizacion);
    };
  }, [previsualizacion]);

  async function guardarEdicion(datos) {
    setEnBusy(true);
    try {
      await api.editarPlato(plato.id, datos);
      setEditando(false);
      onCambiado();
    } catch (err) {
      alert(err.message);
    } finally {
      setEnBusy(false);
    }
  }

  async function archivarOReactivar() {
    setEnBusy(true);
    try {
      if (archivado) {
        await api.reactivarPlato(plato.id);
      } else {
        await api.archivarPlato(plato.id);
      }
      onCambiado();
    } catch (err) {
      alert(err.message);
    } finally {
      setEnBusy(false);
    }
  }

  async function agotarOReponer() {
    setEnBusy(true);
    try {
      if (plato.agotado) {
        await api.reponerPlato(plato.id);
      } else {
        await api.agotarPlato(plato.id);
      }
      onCambiado();
    } catch (err) {
      alert(err.message);
    } finally {
      setEnBusy(false);
    }
  }

  async function subirFoto(evento) {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;
    setErrorFoto(null);
    setPrevisualizacion(URL.createObjectURL(archivo));
    setEnBusy(true);
    try {
      await api.subirFotoPlato(plato.id, archivo);
      onCambiado();
    } catch (err) {
      setErrorFoto(err.message);
    } finally {
      setEnBusy(false);
      setPrevisualizacion(null);
      if (inputFotoRef.current) inputFotoRef.current.value = '';
    }
  }

  if (editando) {
    return (
      <li className="plato-item plato-item--editando">
        <PlatoForm
          plato={plato}
          guardando={enBusy}
          onGuardar={guardarEdicion}
          onCancelar={() => setEditando(false)}
        />
      </li>
    );
  }

  return (
    <li className="plato-item">
      {(previsualizacion || plato.fotoUrl) && (
        <img className="plato-item__foto" src={previsualizacion ?? plato.fotoUrl} alt="" />
      )}
      <div className="plato-item__info">
        <div className="plato-item__cabecera">
          <strong>{plato.nombre}</strong>
          <span>{formatearPrecio(plato.precioCentimos)}</span>
          {plato.agotado && <span className="etiqueta-agotado">Agotado</span>}
        </div>
        {plato.descripcion && <p>{plato.descripcion}</p>}
        <p className="plato-item__alergenos">{textoAlergenos(plato.alergenos)}</p>
        {errorFoto && <p className="mensaje-error">{errorFoto}</p>}
      </div>
      <div className="plato-item__acciones">
        {!archivado && (
          <>
            <button type="button" className="secundario" onClick={() => onMover(-1)} disabled={enBusy || esPrimero} aria-label="Mover arriba">
              ↑
            </button>
            <button type="button" className="secundario" onClick={() => onMover(1)} disabled={enBusy || esUltimo} aria-label="Mover abajo">
              ↓
            </button>
            <button type="button" className="secundario" onClick={() => setEditando(true)} disabled={enBusy}>
              Editar
            </button>
            <label className="boton-archivo">
              Foto
              <input ref={inputFotoRef} type="file" accept="image/*" onChange={subirFoto} disabled={enBusy} hidden />
            </label>
            <button type="button" className={plato.agotado ? '' : 'secundario'} onClick={agotarOReponer} disabled={enBusy}>
              {plato.agotado ? 'Marcar disponible' : 'Marcar agotado'}
            </button>
          </>
        )}
        <button type="button" className={archivado ? '' : 'peligro'} onClick={archivarOReactivar} disabled={enBusy}>
          {archivado ? 'Reactivar' : 'Archivar'}
        </button>
      </div>
    </li>
  );
}
