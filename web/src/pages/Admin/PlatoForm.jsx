import { useState } from 'react';
import { CODIGOS_ALERGENOS, ETIQUETAS_ALERGENOS } from '../../lib/alergenos.js';

const ESTADO_INICIAL_ALERGENOS = null; // null = el dueño aún no ha declarado nada

export function PlatoForm({ plato, onGuardar, onCancelar, guardando }) {
  const [nombre, setNombre] = useState(plato?.nombre ?? '');
  const [precioEuros, setPrecioEuros] = useState(
    plato ? (plato.precioCentimos / 100).toFixed(2) : ''
  );
  const [descripcion, setDescripcion] = useState(plato?.descripcion ?? '');
  const [alergenos, setAlergenos] = useState(
    plato ? plato.alergenos : ESTADO_INICIAL_ALERGENOS
  );
  const [error, setError] = useState(null);

  const sinAlergenosMarcado = Array.isArray(alergenos) && alergenos.length === 0;

  function alternarAlergeno(codigo) {
    setAlergenos((actual) => {
      const base = Array.isArray(actual) ? actual : [];
      return base.includes(codigo) ? base.filter((c) => c !== codigo) : [...base, codigo];
    });
  }

  function marcarSinAlergenos() {
    setAlergenos((actual) => (sinAlergenosMarcado ? null : []));
  }

  function enviar(evento) {
    evento.preventDefault();
    setError(null);

    const precioCentimos = Math.round(Number(precioEuros.replace(',', '.')) * 100);
    if (!nombre.trim()) {
      setError('El nombre del plato es obligatorio.');
      return;
    }
    if (!Number.isInteger(precioCentimos) || precioCentimos <= 0) {
      setError('Introduce un precio válido en euros.');
      return;
    }
    if (!Array.isArray(alergenos)) {
      setError('Declara los alérgenos del plato, o marca "sin alérgenos".');
      return;
    }

    onGuardar({
      categoriaId: plato?.categoriaId,
      nombre: nombre.trim(),
      precioCentimos,
      descripcion: descripcion.trim(),
      alergenos,
    });
  }

  return (
    <form className="plato-form" onSubmit={enviar}>
      {error && <p className="mensaje-error">{error}</p>}

      <div className="campo">
        <label htmlFor={`nombre-${plato?.id ?? 'nuevo'}`}>Nombre del plato</label>
        <input
          id={`nombre-${plato?.id ?? 'nuevo'}`}
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
      </div>

      <div className="campo">
        <label htmlFor={`precio-${plato?.id ?? 'nuevo'}`}>Precio (€, IVA incluido)</label>
        <input
          id={`precio-${plato?.id ?? 'nuevo'}`}
          type="text"
          inputMode="decimal"
          placeholder="2,50"
          value={precioEuros}
          onChange={(e) => setPrecioEuros(e.target.value)}
          required
        />
      </div>

      <div className="campo">
        <label htmlFor={`descripcion-${plato?.id ?? 'nuevo'}`}>Descripción corta</label>
        <textarea
          id={`descripcion-${plato?.id ?? 'nuevo'}`}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </div>

      <fieldset className="campo plato-form__alergenos">
        <legend>Alérgenos (obligatorio)</legend>
        <label className="plato-form__alergeno">
          <input type="checkbox" checked={sinAlergenosMarcado} onChange={marcarSinAlergenos} />
          Sin alérgenos
        </label>
        {CODIGOS_ALERGENOS.map((codigo) => (
          <label key={codigo} className="plato-form__alergeno">
            <input
              type="checkbox"
              checked={Array.isArray(alergenos) && alergenos.includes(codigo)}
              onChange={() => alternarAlergeno(codigo)}
            />
            {ETIQUETAS_ALERGENOS[codigo]}
          </label>
        ))}
      </fieldset>

      <div className="plato-form__acciones">
        <button type="submit" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar plato'}
        </button>
        <button type="button" className="secundario" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
