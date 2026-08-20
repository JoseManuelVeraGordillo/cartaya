import { crearApp } from './app.js';

const PUERTO = process.env.PORT || 3000;

crearApp().listen(PUERTO, () => {
  console.log(`CartaYa escuchando en http://localhost:${PUERTO}`);
});
