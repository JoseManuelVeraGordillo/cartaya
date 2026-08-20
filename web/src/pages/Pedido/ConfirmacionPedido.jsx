import { formatearPrecio } from '../../lib/api.js';

// pedidos-mesa: Confirmación visible con número de pedido y estado.
export function ConfirmacionPedido({ pedido, avisos, onNuevoPedido }) {
  return (
    <div className="confirmacion-pedido">
      <h2>Pedido confirmado</h2>
      <p className="confirmacion-pedido__numero">Pedido nº {pedido.id}</p>
      <p>Estado: {pedido.estado}</p>

      {avisos && avisos.length > 0 && (
        <p className="mensaje-error">
          Estos platos ya no estaban disponibles y no se han incluido en el pedido:{' '}
          {avisos.map((a) => a.nombre ?? 'un plato').join(', ')}.
        </p>
      )}

      <ul className="confirmacion-pedido__lineas">
        {pedido.lineas.map((linea) => (
          <li key={linea.platoId}>
            {linea.cantidad} × {linea.nombre}
            {linea.nota && <> — «{linea.nota}»</>}
          </li>
        ))}
      </ul>

      <p className="confirmacion-pedido__total">Total: {formatearPrecio(pedido.totalCentimos)}</p>

      <button type="button" onClick={onNuevoPedido}>
        Volver a la carta
      </button>
    </div>
  );
}
