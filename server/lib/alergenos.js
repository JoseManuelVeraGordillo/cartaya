// Los 14 alérgenos de declaración obligatoria (normativa UE 1169/2011).
export const CODIGOS_ALERGENOS = [
  'gluten',
  'crustaceos',
  'huevos',
  'pescado',
  'cacahuetes',
  'soja',
  'lacteos',
  'frutos_cascara',
  'apio',
  'mostaza',
  'sesamo',
  'sulfitos',
  'altramuces',
  'moluscos',
];

export const ETIQUETAS_ALERGENOS = {
  gluten: 'Gluten',
  crustaceos: 'Crustáceos',
  huevos: 'Huevo',
  pescado: 'Pescado',
  cacahuetes: 'Cacahuetes',
  soja: 'Soja',
  lacteos: 'Lácteos',
  frutos_cascara: 'Frutos de cáscara',
  apio: 'Apio',
  mostaza: 'Mostaza',
  sesamo: 'Granos de sésamo',
  sulfitos: 'Dióxido de azufre y sulfitos',
  altramuces: 'Altramuces',
  moluscos: 'Moluscos',
};

/**
 * Valida la declaración de alérgenos de un plato. Debe ser un array (puede
 * estar vacío para declarar explícitamente "sin alérgenos"); su ausencia
 * (null/undefined/no-array) significa que no se ha declarado y se rechaza.
 */
export function validarAlergenos(valor) {
  if (!Array.isArray(valor)) {
    return {
      valido: false,
      motivo: 'Debes declarar los alérgenos del plato, o marcar "sin alérgenos".',
    };
  }
  const invalidos = valor.filter((codigo) => !CODIGOS_ALERGENOS.includes(codigo));
  if (invalidos.length > 0) {
    return { valido: false, motivo: `Alérgenos no reconocidos: ${invalidos.join(', ')}` };
  }
  return { valido: true };
}
