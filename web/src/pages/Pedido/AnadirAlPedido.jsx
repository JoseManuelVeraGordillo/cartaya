import { useState } from 'react';

const LIMITE_NOTA = 140;

export function AnadirAlPedido({ plato, onAnadir, agotado }) {
  const [cantidad, setCantidad] = useState(1);
  const [nota, setNota] = useState('');
  const [anadido, setAnadido] = useState(false);

  function anadir() {
    onAnadir({
      platoId: plato.id,
      nombre: plato.nombre,
      precioCentimos: plato.precioCentimos,
      cantidad,
      nota: nota.trim(),
    });
    setAnadido(true);
    setTimeout(() => setAnadido(false), 1500);
  }

  return (
    <div className="anadir-al-pedido">
      <div className="anadir-al-pedido__cantidad">
        <button
          type="button"
          className="secundario"
          onClick={() => setCantidad((c) => Math.max(1, c - 1))}
          aria-label={`Quitar unidad de ${plato.nombre}`}
          disabled={agotado}
        >
          −
        </button>
        <span aria-live="polite">{cantidad}</span>
        <button
          type="button"
          className="secundario"
          onClick={() => setCantidad((c) => c + 1)}
          aria-label={`Añadir unidad de ${plato.nombre}`}
          disabled={agotado}
        >
          +
        </button>
      </div>

      <div className="campo anadir-al-pedido__nota">
        <label htmlFor={`nota-${plato.id}`}>Nota (opcional)</label>
        <textarea
          id={`nota-${plato.id}`}
          value={nota}
          maxLength={LIMITE_NOTA}
          onChange={(e) => setNota(e.target.value)}
          placeholder="p. ej. sin cebolla"
          disabled={agotado}
        />
        <small>{LIMITE_NOTA - nota.length} caracteres restantes</small>
      </div>

      <button type="button" onClick={anadir} disabled={agotado}>
        {anadido ? 'Añadido ✓' : 'Añadir al pedido'}
      </button>
    </div>
  );
}
