import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { AdminLogin } from '../Admin/AdminLogin.jsx';
import { PanelActivos } from './PanelActivos.jsx';
import { PanelHistorico } from './PanelHistorico.jsx';

const DURACION_AVISO_MS = 6000;

// panel-cocina: Aviso simple ante un pedido nuevo - un pitido corto (Web
// Audio, sin fichero de sonido) para que cocina lo note aunque no esté
// mirando la tablet, además del banner visual.
function reproducirAviso() {
  try {
    const Contexto = window.AudioContext || window.webkitAudioContext;
    const contexto = new Contexto();
    const oscilador = contexto.createOscillator();
    const ganancia = contexto.createGain();
    oscilador.type = 'sine';
    oscilador.frequency.value = 880;
    ganancia.gain.setValueAtTime(0.2, contexto.currentTime);
    ganancia.gain.exponentialRampToValueAtTime(0.001, contexto.currentTime + 0.5);
    oscilador.connect(ganancia);
    ganancia.connect(contexto.destination);
    oscilador.start();
    oscilador.stop(contexto.currentTime + 0.5);
  } catch {
    // Sin audio disponible: el aviso visual sigue mostrándose igualmente.
  }
}

function actualizarActivos(actuales, pedido) {
  const sinEsePedido = actuales.filter((p) => p.id !== pedido.id);
  if (pedido.estado === 'servido' || pedido.estado === 'cancelado') {
    return sinEsePedido;
  }
  return [...sinEsePedido, pedido].sort((a, b) => a.creadoEn.localeCompare(b.creadoEn));
}

export function CocinaApp() {
  const [sesion, setSesion] = useState('comprobando'); // comprobando | sin-sesion | activa
  const [vista, setVista] = useState('activos'); // activos | historico
  const [activos, setActivos] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [error, setError] = useState(null);
  const [aviso, setAviso] = useState(null);

  const cargarActivos = useCallback(() => {
    api
      .listarPedidosActivos()
      .then((r) => setActivos(r.pedidos))
      .catch((err) => setError(err.message));
  }, []);

  const cargarHistorico = useCallback(() => {
    api
      .listarPedidosHistorico()
      .then((r) => setHistorico(r.pedidos))
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    api
      .comprobarSesion()
      .then(() => setSesion('activa'))
      .catch(() => setSesion('sin-sesion'));
  }, []);

  useEffect(() => {
    if (sesion === 'activa') cargarActivos();
  }, [sesion, cargarActivos]);

  useEffect(() => {
    if (sesion === 'activa' && vista === 'historico') cargarHistorico();
  }, [sesion, vista, cargarHistorico]);

  // panel-cocina: Aparición en tiempo real de pedidos nuevos y cambios de
  // estado, vía SSE. Al (re)conectar, se recarga el listado completo de
  // activos para resincronizar tras cualquier evento perdido (design.md -
  // Riesgos: tablet que pierde la conexión wifi de cocina).
  useEffect(() => {
    if (sesion !== 'activa') return undefined;

    const eventos = new EventSource('/api/admin/pedidos/eventos');

    eventos.addEventListener('open', cargarActivos);
    eventos.addEventListener('pedido-nuevo', (evento) => {
      const pedido = JSON.parse(evento.data);
      setActivos((actuales) => actualizarActivos(actuales, pedido));
      setAviso(`Pedido nuevo · ${pedido.mesa}`);
      reproducirAviso();
    });
    eventos.addEventListener('pedido-actualizado', (evento) => {
      const pedido = JSON.parse(evento.data);
      setActivos((actuales) => actualizarActivos(actuales, pedido));
    });

    return () => eventos.close();
  }, [sesion, cargarActivos]);

  useEffect(() => {
    if (!aviso) return undefined;
    const temporizador = setTimeout(() => setAviso(null), DURACION_AVISO_MS);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  async function cerrarSesion() {
    await api.cerrarSesion();
    setSesion('sin-sesion');
  }

  async function avanzar(pedido) {
    try {
      await api.avanzarPedido(pedido.id);
    } catch (err) {
      alert(err.message);
    }
  }

  async function cancelar(pedido) {
    if (!confirm(`¿Cancelar el pedido de "${pedido.mesa}"?`)) return;
    try {
      await api.cancelarPedido(pedido.id);
    } catch (err) {
      alert(err.message);
    }
  }

  if (sesion === 'comprobando') {
    return (
      <main className="contenedor">
        <p>Comprobando sesión…</p>
      </main>
    );
  }

  if (sesion === 'sin-sesion') {
    return <AdminLogin onSesionIniciada={() => setSesion('activa')} />;
  }

  return (
    <main className="contenedor cocina">
      <header className="admin__cabecera">
        <h1>Cocina · La Estación</h1>
        <button type="button" className="secundario" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </header>

      {aviso && (
        <p className="cocina__aviso" role="status">
          🔔 {aviso}
        </p>
      )}

      <nav className="admin__pestanas">
        <button
          type="button"
          className={vista === 'activos' ? '' : 'secundario'}
          onClick={() => setVista('activos')}
        >
          Activos
        </button>
        <button
          type="button"
          className={vista === 'historico' ? '' : 'secundario'}
          onClick={() => setVista('historico')}
        >
          Histórico del día
        </button>
      </nav>

      {error && <p className="mensaje-error">{error}</p>}

      {vista === 'activos' && <PanelActivos pedidos={activos} onAvanzar={avanzar} onCancelar={cancelar} />}
      {vista === 'historico' && <PanelHistorico pedidos={historico} />}
    </main>
  );
}
