// Los 14 alérgenos de declaración obligatoria (normativa UE 1169/2011).
// Duplicado deliberadamente de server/lib/alergenos.js: es una lista fija de
// 14 elementos y el frontend es un paquete npm independiente del backend
// (principio 2: simplicidad ante todo, sin infraestructura de monorepo).
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

export function textoAlergenos(codigos) {
  if (!codigos || codigos.length === 0) return 'Sin alérgenos';
  return codigos.map((c) => ETIQUETAS_ALERGENOS[c] ?? c).join(', ');
}
