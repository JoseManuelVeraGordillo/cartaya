const ETIQUETA_ESTADO = {
  recibido: 'Recibido',
  en_preparacion: 'En preparación',
  servido: 'Servido',
  cancelado: 'Cancelado',
};

function formatearHora(iso) {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

export function PanelHistorico({ pedidos }) {
  if (pedidos.length === 0) {
    return <p>Todavía no hay pedidos hoy.</p>;
  }

  return (
    <ul className="cocina__lista">
      {pedidos.map((pedido) => (
        <li key={pedido.id} className="cocina__pedido">
          <div className="cocina__pedido-cabecera">
            <strong>{pedido.mesa}</strong>
            <span className={`cocina__estado cocina__estado--${pedido.estado}`}>
              {ETIQUETA_ESTADO[pedido.estado]}
            </span>
          </div>

          <ul className="cocina__pedido-lineas">
            {pedido.lineas.map((linea, indice) => (
              <li key={indice}>
                <span className="cocina__pedido-cantidad">{linea.cantidad}×</span> {linea.nombre}
                {linea.nota && <p className="cocina__pedido-nota">Nota: {linea.nota}</p>}
              </li>
            ))}
          </ul>

          <p className="cocina__pedido-horas">
            Confirmado a las {formatearHora(pedido.creadoEn)}
            {pedido.canceladoEn && <> · Cancelado a las {formatearHora(pedido.canceladoEn)}</>}
          </p>
        </li>
      ))}
    </ul>
  );
}
