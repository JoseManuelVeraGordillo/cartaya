import { PedidoCard } from './PedidoCard.jsx';

export function PanelActivos({ pedidos, onAvanzar, onCancelar }) {
  if (pedidos.length === 0) {
    return <p>No hay pedidos activos en este momento.</p>;
  }

  return (
    <ul className="cocina__lista">
      {pedidos.map((pedido) => (
        <PedidoCard key={pedido.id} pedido={pedido} onAvanzar={onAvanzar} onCancelar={onCancelar} />
      ))}
    </ul>
  );
}
