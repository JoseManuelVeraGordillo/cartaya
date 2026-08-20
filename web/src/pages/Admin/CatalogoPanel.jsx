import { useState } from 'react';
import { api } from '../../lib/api.js';
import { CategoriaItem } from './CategoriaItem.jsx';

export function CatalogoPanel({ categorias, platos, onCambiado }) {
  const [nombreNueva, setNombreNueva] = useState('');
  const [creando, setCreando] = useState(false);

  const categoriasActivas = categorias.filter((c) => !c.archivadaEn);
  const platosPorCategoria = new Map();
  for (const plato of platos) {
    if (plato.archivadoEn) continue;
    if (!platosPorCategoria.has(plato.categoriaId)) platosPorCategoria.set(plato.categoriaId, []);
    platosPorCategoria.get(plato.categoriaId).push(plato);
  }

  async function crearCategoria(evento) {
    evento.preventDefault();
    if (!nombreNueva.trim()) return;
    setCreando(true);
    try {
      await api.crearCategoria(nombreNueva.trim());
      setNombreNueva('');
      onCambiado();
    } catch (err) {
      alert(err.message);
    } finally {
      setCreando(false);
    }
  }

  async function moverCategoria(categoria, direccion) {
    const indice = categoriasActivas.findIndex((c) => c.id === categoria.id);
    const destino = indice + direccion;
    if (destino < 0 || destino >= categoriasActivas.length) return;
    const ids = categoriasActivas.map((c) => c.id);
    [ids[indice], ids[destino]] = [ids[destino], ids[indice]];
    try {
      await api.reordenarCategorias(ids);
      onCambiado();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      {categoriasActivas.length === 0 && <p>Todavía no hay categorías. Crea la primera abajo.</p>}

      {categoriasActivas.map((categoria, indice) => (
        <CategoriaItem
          key={categoria.id}
          categoria={categoria}
          platos={platosPorCategoria.get(categoria.id) ?? []}
          esPrimero={indice === 0}
          esUltimo={indice === categoriasActivas.length - 1}
          onMover={(direccion) => moverCategoria(categoria, direccion)}
          onCambiado={onCambiado}
        />
      ))}

      <form onSubmit={crearCategoria} className="nueva-categoria">
        <div className="campo">
          <label htmlFor="nueva-categoria">Nueva categoría</label>
          <input
            id="nueva-categoria"
            type="text"
            value={nombreNueva}
            onChange={(e) => setNombreNueva(e.target.value)}
            placeholder="p. ej. Postres"
          />
        </div>
        <button type="submit" disabled={creando}>
          + Crear categoría
        </button>
      </form>
    </div>
  );
}
