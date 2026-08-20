import './App.css';
import { CartaPublica } from './pages/CartaPublica.jsx';
import { AdminApp } from './pages/Admin/AdminApp.jsx';

function App() {
  const esAdmin = window.location.pathname.startsWith('/admin');
  return esAdmin ? <AdminApp /> : <CartaPublica />;
}

export default App;
