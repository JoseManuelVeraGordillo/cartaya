import { db } from '../db/index.js';

export const listarLineasDePedido = db.prepare(
  'SELECT plato_id, nombre_plato, precio_centimos, cantidad, nota FROM lineas_pedido WHERE pedido_id = ? ORDER BY id ASC'
);

export function filaALinea(fila) {
  return {
    platoId: fila.plato_id,
    nombre: fila.nombre_plato,
    precioCentimos: fila.precio_centimos,
    cantidad: fila.cantidad,
    nota: fila.nota,
  };
}
