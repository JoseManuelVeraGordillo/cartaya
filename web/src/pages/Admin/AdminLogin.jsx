import { useState } from 'react';
import { api } from '../../lib/api.js';

export function AdminLogin({ onSesionIniciada }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await api.iniciarSesion(password);
      onSesionIniciada();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="contenedor">
      <h1>Administración de La Estación</h1>
      <form onSubmit={enviar}>
        {error && <p className="mensaje-error">{error}</p>}
        <div className="campo">
          <label htmlFor="password">Contraseña de establecimiento</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <button type="submit" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
