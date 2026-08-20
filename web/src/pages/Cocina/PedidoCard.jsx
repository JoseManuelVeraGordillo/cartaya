import { useEffect, useState } from 'react';

// panel-cocina: Avance del estado de un pedido - el panel solo ofrece la
// acción hacia el siguiente estado válido, nunca una que salte o retroceda.
const ETIQUETA_SIGUIENTE = {
  recibido: 'Marcar en preparación',
  en_preparacion: 'Marcar servido',
};

function formatearTranscurrido(creadoEn, ahora) {
  const minutos = Math.max(0, Math.floor((ahora - new Date(creadoEn).getTime()) / 60000));
  if (minutos < 1) return 'hace un momento';
  if (minutos === 1) return 'hace 1 minuto';
  return `hace ${minutos} minutos`;
}

export function PedidoCard({ pedido, onAvanzar, onCancelar }) {
  const [ahora, setAhora] = useState(() => Date.now());

  // Tiempo transcurrido actualizado en cliente sin recargar la página.
  useEffect(() => {
    const intervalo = setInterval(() => setAhora(Date.now()), 30000);
    return () => clearInterval(intervalo);
  }, []);

  const etiquetaSiguiente = ETIQUETA_SIGUIENTE[pedido.estado];

  return (
    <li className="cocina__pedido">
      <div className="cocina__pedido-cabecera">
        <strong>{pedido.mesa}</strong>
        <span className="cocina__pedido-tiempo">{formatearTranscurrido(pedido.creadoEn, ahora)}</span>
      </div>

      <ul className="cocina__pedido-lineas">
        {pedido.lineas.map((linea, indice) => (
          <li key={indice}>
            <span className="cocina__pedido-cantidad">{linea.cantidad}×</span> {linea.nombre}
            {linea.nota && <p className="cocina__pedido-nota">Nota: {linea.nota}</p>}
          </li>
        ))}
      </ul>

      <div className="cocina__pedido-acciones">
        {etiquetaSiguiente && (
          <button type="button" onClick={() => onAvanzar(pedido)}>
            {etiquetaSiguiente}
          </button>
        )}
        {pedido.estado === 'recibido' && (
          <button type="button" className="peligro" onClick={() => onCancelar(pedido)}>
            Cancelar
          </button>
        )}
      </div>
    </li>
  );
}
