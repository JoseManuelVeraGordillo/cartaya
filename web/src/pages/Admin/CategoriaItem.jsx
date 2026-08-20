import { useState } from 'react';
import { api } from '../../lib/api.js';
import { PlatoItem } from './PlatoItem.jsx';
import { PlatoForm } from './PlatoForm.jsx';

export function CategoriaItem({ categoria, platos, esPrimero, esUltimo, onMover, onCambiado }) {
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nombre, setNombre] = useState(categoria.nombre);
  const [creandoPlato, setCreandoPlato] = useState(false);
  const [enBusy, setEnBusy] = useState(false);

  async function guardarNombre(evento) {
    evento.preventDefault();
    if (!nombre.trim()) return;
    setEnBusy(true);
    try {
      await api.editarCategoria(categoria.id, nombre.trim());
      setEditandoNombre(false);
      onCambiado();
    } catch (err) {
      alert(err.message);
    } finally {
      setEnBusy(false);
    }
  }

  async function archivar() {
    if (!confirm(`¿Archivar la categoría "${categoria.nombre}"? Sus platos dejarán de verse en la carta.`)) return;
    setEnBusy(true);
    try {
      await api.archivarCategoria(categoria.id);
      onCambiado();
    } catch (err) {
      alert(err.message);
    } finally {
      setEnBusy(false);
    }
  }

  async function crearPlato(datos) {
    setEnBusy(true);
    try {
      await api.crearPlato({ ...datos, categoriaId: categoria.id });
      setCreandoPlato(false);
      onCambiado();
    } catch (err) {
      alert(err.message);
    } finally {
      setEnBusy(false);
    }
  }

  async function moverPlato(plato, direccion) {
    const indice = platos.findIndex((p) => p.id === plato.id);
    const destino = indice + direccion;
    if (destino < 0 || destino >= platos.length) return;
    const ids = platos.map((p) => p.id);
    [ids[indice], ids[destino]] = [ids[destino], ids[indice]];
    try {
      await api.reordenarPlatos(categoria.id, ids);
      onCambiado();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <section className="categoria-item">
      <header className="categoria-item__cabecera">
        {editandoNombre ? (
          <form onSubmit={guardarNombre} className="categoria-item__form-nombre">
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            <button type="submit" disabled={enBusy}>Guardar</button>
            <button type="button" className="secundario" onClick={() => setEditandoNombre(false)} disabled={enBusy}>
              Cancelar
            </button>
          </form>
        ) : (
          <>
            <h2>{categoria.nombre}</h2>
            <div className="categoria-item__acciones">
              <button type="button" className="secundario" onClick={() => onMover(-1)} disabled={esPrimero} aria-label="Mover categoría arriba">
                ↑
              </button>
              <button type="button" className="secundario" onClick={() => onMover(1)} disabled={esUltimo} aria-label="Mover categoría abajo">
                ↓
              </button>
              <button type="button" className="secundario" onClick={() => setEditandoNombre(true)}>
                Renombrar
              </button>
              <button type="button" className="peligro" onClick={archivar} disabled={enBusy}>
                Archivar categoría
              </button>
            </div>
          </>
        )}
      </header>

      <ul className="categoria-item__platos">
        {platos.map((plato, indice) => (
          <PlatoItem
            key={plato.id}
            plato={plato}
            esPrimero={indice === 0}
            esUltimo={indice === platos.length - 1}
            onMover={(direccion) => moverPlato(plato, direccion)}
            onCambiado={onCambiado}
            archivado={false}
          />
        ))}
      </ul>

      {creandoPlato ? (
        <PlatoForm guardando={enBusy} onGuardar={crearPlato} onCancelar={() => setCreandoPlato(false)} />
      ) : (
        <button type="button" className="secundario" onClick={() => setCreandoPlato(true)}>
          + Añadir plato
        </button>
      )}
    </section>
  );
}
