/*
 * ============================================================
 * PIEZAS DE TIQUI — lo que comparten todas sus versiones en la app
 * ============================================================
 * La forma (copiada punto por punto de frontend/src/components/UI/
 * mascotaFormas.js, lienzo de 400 × 470), los disfraces de temporada (de
 * DisfrazTiqui.jsx), sus colores en claro y en oscuro, y los ganchos que la
 * hacen sentirse viva: el parpadeo y el respeto por "menos movimiento".
 *
 * La usan Mascota (las poses de la tienda), TiquiColgada (la del asistente y
 * la de jalar para recargar) y Tiqui (el tutorial).
 * ============================================================
 */

import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { useColores } from '../../context/ModoContext';
import { useTema } from '../../context/TemaContext';
import { disfrazDeTema } from '../../utils/disfracesTiqui';

export const CUERPO =
  'M183,127 Q200,110 217,127 L261.6,171.6 Q280,190 280,216 C284,258 284,302 280,344 ' +
  'Q280,380 244,380 C215,383 185,383 156,380 Q120,380 120,344 C116,302 116,258 120,216 ' +
  'Q120,190 138.4,171.6 Z';
export const AGUJERO = ' M212,160 A12,12 0 1 0 188,160 A12,12 0 1 0 212,160 Z';
export const CORDON = 'M200,160 C200,126 216,118 223,96 C230,74 212,64 219,44';

export const RUBOR = '#F0707F';
export const AMARILLO = '#FFC23D';
export const HOJA = '#4CC27A';

// Los trazos redondeados de siempre.
export const TRAZO = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };

/*
 * Sus colores. En claro, la etiqueta navy con la cara blanca; en oscuro se
 * voltea (blanca con la cara navy), como el logo. No usa el color de la
 * temporada: la temporada le cambia la ropa, no la piel.
 *
 * `sobre`: 'color' (dentro de un botón de la marca) u 'oscuro' (sobre un velo)
 * la ponen blanca para que se vea.
 */
export const useColoresTiqui = (sobre) => {
  const COLORES = useColores();
  const { colores } = useTema();
  return useMemo(() => {
    const base = COLORES.oscuro
      ? { cuerpo: '#FFFFFF', rasgo: '#003049' }
      : { cuerpo: '#003049', rasgo: '#FFFFFF' };
    const encima =
      sobre === 'color' ? { cuerpo: '#FFFFFF', rasgo: colores.marca }
      : sobre === 'oscuro' ? { cuerpo: '#FFFFFF', rasgo: '#003049' }
      : {};
    return {
      ...base,
      ...encima,
      cordon: '#009AEB',
      fondo: COLORES.fondo,
      linea: COLORES.linea,
      suave: COLORES.textoSuave,
    };
  }, [COLORES, colores.marca, sobre]);
};

// Lo que lleva puesto según la temporada de la tienda (o nada).
export const useDisfrazTiqui = () => {
  const { tema, decoracion } = useTema();
  return useMemo(() => (tema && decoracion ? disfrazDeTema(tema) : null), [tema, decoracion]);
};

// Quien pidió menos movimiento en su teléfono la ve quieta.
export const useMovimientoReducido = () => {
  const [reducido, setReducido] = useState(false);
  useEffect(() => {
    let vivo = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then((si) => vivo && setReducido(!!si)).catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (si) => setReducido(!!si));
    return () => {
      vivo = false;
      sub?.remove?.();
    };
  }, []);
  return reducido;
};

// Parpadea cada tanto: es lo que hace que se sienta viva y no un dibujo.
export const useParpadeo = (activo = true) => {
  const [cerrado, setCerrado] = useState(false);
  useEffect(() => {
    if (!activo) return undefined;
    let cerrar;
    const reloj = setInterval(() => {
      setCerrado(true);
      cerrar = setTimeout(() => setCerrado(false), 140);
    }, 3800);
    return () => {
      clearInterval(reloj);
      clearTimeout(cerrar);
    };
  }, [activo]);
  return cerrado;
};

const ESTRELLA_GORRO =
  'M170,29 L174.1,40.3 L186.2,40.8 L176.7,48.2 L180,59.8 L170,53 L160,59.8 L163.3,48.2 L153.8,40.8 L165.9,40.3 Z';

/*
 * Los disfraces (DisfrazTiqui.jsx). Cada pieza lleva un borde del color de
 * los rasgos, así se despega del cuerpo en claro y en oscuro.
 */
const PIEZAS = {
  'gorro-navidad': ({ principal }) => (
    <>
      <Path d="M132,188 C134,146 162,110 206,98 C242,88 280,102 294,138 C300,158 300,194 296,222 L280,224 C279,208 274,196 270,188 Z" fill={principal} />
      <Path d="M252,112 C272,128 280,160 282,190" stroke="#000000" strokeOpacity={0.22} strokeWidth={5} strokeLinecap="round" fill="none" />
      <Rect x={114} y={172} width={172} height={28} rx={14} fill="#FFFFFF" />
      <Circle cx={288} cy={228} r={15} fill="#FFFFFF" />
    </>
  ),
  'sombrero-bruja': ({ principal, acento }) => (
    <>
      <Path d="M124,190 L166,86 C170,74 162,62 146,58 L130,56 C148,50 170,52 184,66 C192,74 196,86 198,96 L280,190 Z" fill={principal} />
      <Path d="M128,180 L136.1,160 L253.8,160 L271.3,180 Z" fill={acento} />
      <Path d="M183,158 L207,158 L207,182 L183,182 Z M190,165 L200,165 L200,175 L190,175 Z" fillRule="evenodd" fill={AMARILLO} />
      <Ellipse cx={200} cy={190} rx={114} ry={17} fill={principal} />
    </>
  ),
  corbatin: ({ principal, acento }) => (
    <>
      <Path d="M200,338 L162,318 Q154,338 162,358 Z" fill={principal} />
      <Path d="M200,338 L238,318 Q246,338 238,358 Z" fill={principal} />
      <Rect x={189} y={327} width={22} height={22} rx={6} fill={acento || '#FFFFFF'} />
    </>
  ),
  mono: ({ principal, acento }) => (
    <G transform="rotate(-38 160 150)">
      <Path d="M160,150 C144,128 118,134 122,152 C124,168 146,166 160,150 Z" fill={principal} />
      <Path d="M160,150 C176,128 202,134 198,152 C196,168 174,166 160,150 Z" fill={principal} />
      <Circle cx={160} cy={150} r={9} fill={acento} />
    </G>
  ),
  'gorro-fiesta': ({ principal, acento }) => (
    <>
      <Path d="M122,196 L170,44 L278,196 Z" fill={principal} />
      <Path d="M140.9,136 L146,120 L224,120 L235.4,136 Z" fill={acento} />
      <Rect x={116} y={182} width={168} height={20} rx={10} fill={acento} />
      <Circle cx={170} cy={42} r={14} fill={acento} />
    </>
  ),
  'gorro-estrella': ({ principal, acento }) => (
    <>
      <Path d="M122,196 L170,52 L278,196 Z" fill={principal} />
      <Path d="M140.9,136 L146,120 L224,120 L235.4,136 Z" fill={acento} />
      <Rect x={116} y={182} width={168} height={20} rx={10} fill={acento} />
      <Path d={ESTRELLA_GORRO} fill={acento} />
    </>
  ),
  bufanda: ({ principal, acento }) => (
    <>
      <Path d="M226,338 L256,334 L266,414 L236,418 Z" fill={principal} />
      <Path d="M231,366 L261,362 L263,376 L233,380 Z M234,392 L264,388 L265,398 L235,402 Z" fill={acento} stroke="none" />
      <Path d="M112,316 Q200,346 288,316 L288,346 Q200,376 112,346 Z" fill={principal} />
      <Path d="M146,328 L146,358 M254,328 L254,358" stroke={acento} strokeWidth={10} fill="none" />
      <Path d="M214,334 Q232,328 244,340 Q246,358 228,362 Q212,358 214,334 Z" fill={principal} />
    </>
  ),
};

// Lo que Tiqui lleva puesto. Va encima del cuerpo y del cordón.
export const Disfraz = ({ disfraz, contorno }) => {
  const dibujar = disfraz && PIEZAS[disfraz.tipo];
  if (!dibujar) return null;
  return (
    <G>
      {disfraz.rubor && (
        <G opacity={0.55}>
          <Ellipse cx={150} cy={284} rx={13} ry={8} fill={RUBOR} />
          <Ellipse cx={250} cy={284} rx={13} ry={8} fill={RUBOR} />
        </G>
      )}
      <G stroke={contorno} strokeWidth={4} strokeLinejoin="round">
        {dibujar(disfraz)}
      </G>
    </G>
  );
};

// El cuerpo con su agujero, del color que toque.
export const Cuerpo = ({ color }) => <Path d={CUERPO + AGUJERO} fillRule="evenodd" fill={color} />;
