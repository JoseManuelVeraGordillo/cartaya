import './App.css';
import { CartaPublica } from './pages/CartaPublica.jsx';
import { AdminApp } from './pages/Admin/AdminApp.jsx';

function App() {
  const { pathname } = window.location;
  if (pathname.startsWith('/admin')) return <AdminApp />;

  // pedidos-mesa: Identificación de la mesa mediante QR — el QR de cada mesa
  // codifica /mesa/<token>, que abre la carta con esa mesa ya identificada.
  const mesaEnRuta = pathname.match(/^\/mesa\/([^/]+)/);
  return <CartaPublica tokenMesa={mesaEnRuta ? decodeURIComponent(mesaEnRuta[1]) : null} />;
}

export default App;
