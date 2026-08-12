/*
 * ============================================================
 * TEMAS DE BANNER — temasPromo.js
 * ============================================================
 * Puerto de `frontend/src/utils/temasPromo.js`. Las mismas paletas de las
 * promociones. La única diferencia: el fondo de la web es un string de
 * `linear-gradient(...)`; aquí se guarda como un par de colores `grad: [a, b]`
 * para pasárselo a <LinearGradient> (expo-linear-gradient), y el degradado se
 * ve igual (135°, de a a b).
 * ============================================================
 */

export const TEMAS = [
  { id: 'cafe',        nombre: 'Café',        grad: ['#8A5222', '#B46C30'], texto: '#FFFFFF', acento: '#F3E7D8', muestra: '#B46C30' },
  { id: 'fresco',      nombre: 'Fresco',      grad: ['#1F6F4A', '#35A06B'], texto: '#FFFFFF', acento: '#DFF3E7', muestra: '#2E8B5A' },
  { id: 'atardecer',   nombre: 'Atardecer',   grad: ['#C2410C', '#F08400'], texto: '#FFFFFF', acento: '#FFE9CC', muestra: '#E86A0C' },
  { id: 'noche',       nombre: 'Noche',       grad: ['#1C1614', '#3D322B'], texto: '#FFFFFF', acento: '#D8A860', muestra: '#2A211C' },
  { id: 'cielo',       nombre: 'Cielo',       grad: ['#1E4E8C', '#3B82C4'], texto: '#FFFFFF', acento: '#DCEBFA', muestra: '#2C68A8' },
  { id: 'crema',       nombre: 'Crema',       grad: ['#FBF6F0', '#EDE0CE'], texto: '#3D2B1A', acento: '#B46C30', muestra: '#EDE0CE' },
  // ── Fechas especiales ──
  { id: 'navidad',       nombre: 'Navidad',        festivo: true, grad: ['#A4161A', '#D62828'], texto: '#FFFFFF', acento: '#F6E7C1', muestra: '#C1121F' },
  { id: 'anonuevo',      nombre: 'Año Nuevo',      festivo: true, grad: ['#14142B', '#35355C'], texto: '#FFFFFF', acento: '#E8C547', muestra: '#E8C547' },
  { id: 'sanvalentin',   nombre: 'San Valentín',   festivo: true, grad: ['#C9184A', '#FF758F'], texto: '#FFFFFF', acento: '#FFE0E6', muestra: '#E5486A' },
  { id: 'diamadre',      nombre: 'Día de la Madre', festivo: true, grad: ['#7B4B94', '#C78BD9'], texto: '#FFFFFF', acento: '#F3E3FA', muestra: '#A06BB8' },
  { id: 'independencia', nombre: 'Independencia',  festivo: true, grad: ['#0F47AF', '#3B82C4'], texto: '#FFFFFF', acento: '#E8F1FF', muestra: '#0F47AF' },
  { id: 'halloween',     nombre: 'Halloween',      festivo: true, grad: ['#2B1A3D', '#EE7B0A'], texto: '#FFFFFF', acento: '#FFD9A0', muestra: '#EE7B0A' },
  { id: 'blackfriday',   nombre: 'Black Friday',   festivo: true, grad: ['#0B0B0B', '#2A2A2A'], texto: '#FFFFFF', acento: '#FFD400', muestra: '#FFD400' },
];

const POR_DEFECTO = TEMAS[0];

/*
 * Los colores que hay que pintar. Si la promo eligió "personalizado" usa los
 * suyos; si no, los del tema. Siempre devuelve algo pintable.
 */
export const coloresDePromo = (promo) => {
  if (!promo) return { ...POR_DEFECTO, flecha: POR_DEFECTO.acento };

  if (promo.tema === 'personalizado' && promo.colorFondo) {
    const grad = promo.colorFondo2 ? [promo.colorFondo, promo.colorFondo2] : [promo.colorFondo, promo.colorFondo];
    return {
      id: 'personalizado', nombre: 'Personalizado', grad,
      texto: promo.colorTexto || '#FFFFFF',
      acento: promo.colorAcento || '#FFFFFF',
      flecha: promo.colorFlecha || promo.colorAcento || '#FFFFFF',
      muestra: promo.colorFondo,
    };
  }

  const tema = TEMAS.find((t) => t.id === promo.tema) || POR_DEFECTO;
  return { ...tema, flecha: promo.colorFlecha || tema.acento };
};
