import { formatearPrecio } from '../../lib/api.js';

// pedidos-mesa: Resumen y confirmación del pedido sin dato personal.
export function ResumenPedido({ carrito, enviando, error, onCambiarCantidad, onQuitar, onConfirmar, onVolver }) {
  const total = carrito.reduce((suma, l) => suma + l.precioCentimos * l.cantidad, 0);

  return (
    <div className="resumen-pedido">
      <h2>Resumen del pedido</h2>

      {error && <p className="mensaje-error">{error}</p>}

      {carrito.length === 0 ? (
        <p>Todavía no has añadido ningún plato.</p>
      ) : (
        <ul className="resumen-pedido__lineas">
          {carrito.map((linea) => (
            <li key={linea.platoId} className="resumen-pedido__linea">
              <div className="resumen-pedido__linea-info">
                <strong>{linea.nombre}</strong>
                {linea.nota && <p className="resumen-pedido__nota">«{linea.nota}»</p>}
              </div>
              <div className="resumen-pedido__linea-acciones">
                <label htmlFor={`cantidad-${linea.platoId}`}>Cantidad</label>
                <input
                  id={`cantidad-${linea.platoId}`}
                  type="number"
                  min="1"
                  value={linea.cantidad}
                  onChange={(e) => onCambiarCantidad(linea.platoId, Math.max(1, Number(e.target.value) || 1))}
                />
                <span>{formatearPrecio(linea.precioCentimos * linea.cantidad)}</span>
                <button type="button" className="peligro" onClick={() => onQuitar(linea.platoId)}>
                  Quitar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="resumen-pedido__total">Total: {formatearPrecio(total)}</p>

      <div className="resumen-pedido__acciones">
        <button type="button" className="secundario" onClick={onVolver} disabled={enviando}>
          Volver a la carta
        </button>
        <button type="button" onClick={onConfirmar} disabled={enviando || carrito.length === 0}>
          {enviando ? 'Confirmando…' : 'Confirmar pedido'}
        </button>
      </div>
    </div>
  );
}
