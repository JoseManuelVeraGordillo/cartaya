import { useEffect, useState } from 'react';
import { api, formatearPrecio } from '../lib/api.js';
import { textoAlergenos } from '../lib/alergenos.js';
import { AnadirAlPedido } from './Pedido/AnadirAlPedido.jsx';
import { ResumenPedido } from './Pedido/ResumenPedido.jsx';
import { ConfirmacionPedido } from './Pedido/ConfirmacionPedido.jsx';

function clavePedidoMesa(token) {
  return `cartaya_pedido_mesa_${token}`;
}

export function CartaPublica({ tokenMesa = null }) {
  const [estado, setEstado] = useState({ cargando: true, error: null, categorias: [] });
  const [mesa, setMesa] = useState(tokenMesa ? { cargando: true, error: null, datos: null } : null);
  const [carrito, setCarrito] = useState([]);
  const [pantalla, setPantalla] = useState('carta'); // carta | resumen | confirmacion
  const [pedidoConfirmado, setPedidoConfirmado] = useState(null); // { pedido, descartados }
  const [enviando, setEnviando] = useState(false);
  const [errorConfirmacion, setErrorConfirmacion] = useState(null);

  useEffect(() => {
    let cancelado = false;
    api
      .obtenerCarta()
      .then((datos) => {
        if (!cancelado) setEstado({ cargando: false, error: null, categorias: datos.categorias });
      })
      .catch((error) => {
        if (!cancelado) setEstado({ cargando: false, error: error.message, categorias: [] });
      });
    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    if (!tokenMesa) return;
    let cancelado = false;

    api
      .obtenerMesa(tokenMesa)
      .then(async (datos) => {
        if (cancelado) return;
        setMesa({ cargando: false, error: null, datos });

        // pedidos-mesa: la confirmación sigue siendo accesible tras recargar
        // la página en esa mesa; se recupera del pedido guardado localmente.
        const idGuardado = Number(localStorage.getItem(clavePedidoMesa(tokenMesa)));
        if (!idGuardado) return;
        try {
          const { pedidos } = await api.listarPedidosMesa(tokenMesa);
          const pedidoPrevio = pedidos.find((p) => p.id === idGuardado);
          if (pedidoPrevio && !cancelado) {
            setPedidoConfirmado({ pedido: pedidoPrevio, descartados: [] });
            setPantalla('confirmacion');
          }
        } catch {
          // Si no se puede recuperar, el cliente simplemente empieza de cero.
        }
      })
      .catch((error) => {
        if (!cancelado) setMesa({ cargando: false, error: error.message, datos: null });
      });

    return () => {
      cancelado = true;
    };
  }, [tokenMesa]);

  function anadirAlCarrito(linea) {
    setCarrito((actual) => [...actual.filter((l) => l.platoId !== linea.platoId), linea]);
  }

  function cambiarCantidad(platoId, cantidad) {
    setCarrito((actual) => actual.map((l) => (l.platoId === platoId ? { ...l, cantidad } : l)));
  }

  function quitarDelCarrito(platoId) {
    setCarrito((actual) => actual.filter((l) => l.platoId !== platoId));
  }

  async function confirmarPedido() {
    setEnviando(true);
    setErrorConfirmacion(null);
    try {
      const resultado = await api.confirmarPedido(
        tokenMesa,
        carrito.map(({ platoId, cantidad, nota }) => ({ platoId, cantidad, nota }))
      );
      if (!resultado.pedido) {
        // pedidos-mesa: Todos los platos del pedido dejan de estar activos
        // antes de confirmar — no se envía nada, el cliente ajusta y reintenta.
        const idsDescartados = new Set(resultado.descartados.map((d) => d.platoId));
        setCarrito((actual) => actual.filter((l) => !idsDescartados.has(l.platoId)));
        setErrorConfirmacion(
          `Ninguno de esos platos sigue disponible: ${resultado.descartados
            .map((d) => d.nombre ?? 'un plato')
            .join(', ')}. Vuelve a la carta para elegir otros.`
        );
        return;
      }
      localStorage.setItem(clavePedidoMesa(tokenMesa), String(resultado.pedido.id));
      setPedidoConfirmado(resultado);
      setCarrito([]);
      setPantalla('confirmacion');
    } catch (error) {
      setErrorConfirmacion(error.message);
    } finally {
      setEnviando(false);
    }
  }

  function nuevoPedido() {
    // pedidos-mesa: Varios pedidos independientes por mesa — se puede volver
    // a la carta y empezar otro pedido sin mezclarlo con el anterior.
    localStorage.removeItem(clavePedidoMesa(tokenMesa));
    setPedidoConfirmado(null);
    setErrorConfirmacion(null);
    setPantalla('carta');
  }

  if (estado.cargando || (mesa && mesa.cargando)) {
    return (
      <main className="contenedor carta-publica">
        <p>Cargando la carta…</p>
      </main>
    );
  }

  if (estado.error) {
    return (
      <main className="contenedor carta-publica">
        <p className="mensaje-error">No se ha podido cargar la carta: {estado.error}</p>
      </main>
    );
  }

  if (mesa && mesa.error) {
    return (
      <main className="contenedor carta-publica">
        <p className="mensaje-error">Esta mesa no es válida. Pide ayuda a un camarero.</p>
      </main>
    );
  }

  if (mesa && pantalla === 'confirmacion' && pedidoConfirmado) {
    return (
      <main className="contenedor carta-publica">
        <ConfirmacionPedido
          pedido={pedidoConfirmado.pedido}
          avisos={pedidoConfirmado.descartados}
          onNuevoPedido={nuevoPedido}
        />
      </main>
    );
  }

  if (mesa && pantalla === 'resumen') {
    return (
      <main className="contenedor carta-publica">
        <ResumenPedido
          carrito={carrito}
          enviando={enviando}
          error={errorConfirmacion}
          onCambiarCantidad={cambiarCantidad}
          onQuitar={quitarDelCarrito}
          onConfirmar={confirmarPedido}
          onVolver={() => setPantalla('carta')}
        />
      </main>
    );
  }

  return (
    <main className="contenedor carta-publica">
      <header className="carta-publica__cabecera">
        <h1>La Estación</h1>
        <p>{mesa ? `Carta · ${mesa.datos.nombre}` : 'Carta'}</p>
      </header>

      {mesa && carrito.length > 0 && (
        <button type="button" className="carta-publica__ver-pedido" onClick={() => setPantalla('resumen')}>
          Ver pedido ({carrito.reduce((n, l) => n + l.cantidad, 0)})
        </button>
      )}

      {estado.categorias.length === 0 && <p>La carta todavía no tiene platos publicados.</p>}

      {estado.categorias.map((categoria) => (
        <section key={categoria.id} className="carta-publica__categoria">
          <h2>{categoria.nombre}</h2>
          <ul className="carta-publica__lista-platos">
            {categoria.platos.map((plato) => (
              <li key={plato.id} className="carta-publica__plato">
                {plato.fotoUrl && (
                  <img
                    className="carta-publica__foto"
                    src={plato.fotoUrl}
                    alt=""
                    loading="lazy"
                    width="120"
                    height="120"
                  />
                )}
                <div className="carta-publica__info">
                  <div className="carta-publica__nombre-precio">
                    <h3>{plato.nombre}</h3>
                    <span className="carta-publica__precio">{formatearPrecio(plato.precioCentimos)}</span>
                  </div>
                  {plato.descripcion && <p className="carta-publica__descripcion">{plato.descripcion}</p>}
                  <p className="carta-publica__alergenos">
                    <span className="carta-publica__alergenos-etiqueta">Alérgenos: </span>
                    {textoAlergenos(plato.alergenos)}
                  </p>
                  {mesa && <AnadirAlPedido plato={plato} onAnadir={anadirAlCarrito} />}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
