import { useEffect, useState } from 'react';
import { api, formatearPrecio } from '../lib/api.js';
import { textoAlergenos } from '../lib/alergenos.js';

export function CartaPublica() {
  const [estado, setEstado] = useState({ cargando: true, error: null, categorias: [] });

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

  if (estado.cargando) {
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

  return (
    <main className="contenedor carta-publica">
      <header className="carta-publica__cabecera">
        <h1>La Estación</h1>
        <p>Carta</p>
      </header>

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
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
