/*
 * ============================================================
 * TIQUI EN LA APP — Tiqui.js
 * ============================================================
 * La mascota de la tienda: la etiqueta de precio del logo, con cara, en
 * estilo plano. Es la MISMA forma que la web (frontend/src/components/UI/
 * mascotaFormas.js), copiada punto por punto: Tiqui tiene que ser el mismo
 * personaje en el teléfono y en la computadora.
 *
 * Solo pinta. Recibe qué cara poner (`pose`) y qué lo acompaña (`extra`):
 *
 *   pose:  'normal' | 'saludo' | 'escucha' | 'piensa' | 'feliz' | 'apenado' | 'habla'
 *   extra: 'ondas' (lo que escucha) | 'estrellas' (ofertas) | 'bolsa' (el
 *          pedido) | 'pregunta' | null
 *
 * `animado` lo hace flotar y parpadear. Es un dibujo: se le quita al lector
 * de pantalla, y quien lo usa dice con texto lo que pasa.
 * ============================================================
 */

import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

const CUERPO =
  'M183,127 Q200,110 217,127 L261.6,171.6 Q280,190 280,216 C284,258 284,302 280,344 ' +
  'Q280,380 244,380 C215,383 185,383 156,380 Q120,380 120,344 C116,302 116,258 120,216 ' +
  'Q120,190 138.4,171.6 Z';
const AGUJERO = ' M212,160 A12,12 0 1 0 188,160 A12,12 0 1 0 212,160 Z';
const CORDON = 'M200,160 C200,126 216,118 223,96 C230,74 212,64 219,44';

const OJO_I = [174, 252];
const OJO_D = [226, 252];

// Hacia dónde mira cada pose (en unidades del dibujo).
const MIRADA = { piensa: [7, -8], escucha: [0, 3], apenado: [0, 5] };

const arco = ([x, y]) => `M${x - 12},${y + 5} Q${x},${y - 13} ${x + 12},${y + 5}`;

const Ojos = ({ pose, rasgo, parpadeo }) => {
  const [mx, my] = MIRADA[pose] || [0, 0];
  const abierto = ([x, y], k = 1) => (
    <Ellipse cx={x + mx} cy={y + my} rx={10 * k} ry={(parpadeo ? 2 : 14) * k} fill={rasgo} />
  );
  if (pose === 'feliz') {
    return <Path d={`${arco(OJO_I)} ${arco(OJO_D)}`} stroke={rasgo} strokeWidth={7} fill="none" strokeLinecap="round" />;
  }
  if (pose === 'saludo') {
    return (
      <>
        {abierto(OJO_I)}
        <Path d={arco(OJO_D)} stroke={rasgo} strokeWidth={7} fill="none" strokeLinecap="round" />
      </>
    );
  }
  const k = pose === 'escucha' ? 1.15 : 1;
  return <>{abierto(OJO_I, k)}{abierto(OJO_D, k)}</>;
};

const CEJAS = {
  escucha: 'M162,221 Q174,210 186,221 M214,221 Q226,210 238,221',
  piensa: 'M162,229 L186,229 M214,223 Q226,211 238,221',
  apenado: 'M162,231 L186,222 M214,222 L238,231',
};

const Boca = ({ pose, rasgo }) => {
  if (pose === 'feliz') return <Path d="M182,280 Q200,316 218,280 Z" fill={rasgo} stroke={rasgo} strokeWidth={4} strokeLinejoin="round" />;
  if (pose === 'escucha') return <Ellipse cx={200} cy={291} rx={8} ry={10} fill={rasgo} />;
  if (pose === 'habla') return <Ellipse cx={200} cy={290} rx={11} ry={12} fill={rasgo} />;
  const d = {
    piensa: 'M188,292 Q204,297 214,286',
    apenado: 'M186,296 Q200,286 214,296',
  }[pose] || 'M184,284 Q200,300 216,284';
  return <Path d={d} stroke={rasgo} strokeWidth={7.5} fill="none" strokeLinecap="round" />;
};

const Extra = ({ tipo, acento }) => {
  if (tipo === 'ondas') {
    return (
      <G stroke={acento} strokeWidth={5} fill="none" strokeLinecap="round">
        <Path d="M244,40 Q256,52 244,64" />
        <Path d="M256,28 Q276,52 256,76" opacity={0.7} />
        <Path d="M268,16 Q296,52 268,88" opacity={0.4} />
      </G>
    );
  }
  if (tipo === 'estrellas') {
    const estrella = (cx, cy, r, color) =>
      `M${cx},${cy - r} L${cx + r * 0.3},${cy - r * 0.3} L${cx + r},${cy} L${cx + r * 0.3},${cy + r * 0.3} L${cx},${cy + r} L${cx - r * 0.3},${cy + r * 0.3} L${cx - r},${cy} L${cx - r * 0.3},${cy - r * 0.3} Z`;
    return (
      <G>
        <Path d={estrella(96, 150, 18, '#FFC23D')} fill="#FFC23D" />
        <Path d={estrella(312, 110, 14, '#FFC23D')} fill="#FFC23D" />
        <Path d={estrella(318, 300, 10, '#FFFFFF')} fill="#FFFFFF" opacity={0.85} />
        <Path d={estrella(80, 300, 9, '#FFFFFF')} fill="#FFFFFF" opacity={0.7} />
      </G>
    );
  }
  if (tipo === 'bolsa') {
    return (
      <G>
        <Path d="M282,318 C282,296 318,296 318,318" stroke={acento} strokeWidth={6} fill="none" strokeLinecap="round" />
        <Path d="M258,318 L342,318 L350,404 Q350,414 340,414 L260,414 Q250,414 250,404 Z" fill={acento} />
        <Circle cx={336} cy={322} r={17} fill="#FFFFFF" />
        <Path d="M328,322 L334,328 L345,316" stroke="#003049" strokeWidth={4.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </G>
    );
  }
  if (tipo === 'pregunta') {
    return (
      <G>
        <Path d="M288,94 C288,78 314,78 314,94 C314,104 301,104 301,116" stroke={acento} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx={301} cy={131} r={5.5} fill={acento} />
      </G>
    );
  }
  return null;
};

const Tiqui = ({
  pose = 'normal',
  extra = null,
  alto = 180,
  cuerpo = '#FFFFFF',
  rasgo = '#003049',
  cordon = '#8ECBE8',
  acento = '#8ECBE8',
  animado = true,
}) => {
  const flota = useRef(new Animated.Value(0)).current;
  const [parpadeo, setParpadeo] = useState(false);

  // Quien pidió menos movimiento en su teléfono lo ve quieto.
  const [reducido, setReducido] = useState(false);
  useEffect(() => {
    let vivo = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then((si) => vivo && setReducido(!!si)).catch(() => {});
    return () => { vivo = false; };
  }, []);
  const mover = animado && !reducido;

  // Flota despacio, como colgado de su cordón.
  useEffect(() => {
    if (!mover) return undefined;
    const bucle = Animated.loop(
      Animated.sequence([
        Animated.timing(flota, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(flota, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    bucle.start();
    return () => bucle.stop();
  }, [mover, flota]);

  // Parpadea cada tanto: es lo que hace que se sienta vivo y no un dibujo.
  useEffect(() => {
    if (!mover) return undefined;
    let cerrar;
    const reloj = setInterval(() => {
      setParpadeo(true);
      cerrar = setTimeout(() => setParpadeo(false), 140);
    }, 3600);
    return () => {
      clearInterval(reloj);
      clearTimeout(cerrar);
    };
  }, [mover]);

  const ancho = alto * (280 / 390);
  const sube = flota.interpolate({ inputRange: [0, 1], outputRange: [0, -alto * 0.03] });

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: ancho, height: alto, transform: [{ translateY: sube }] }}
    >
      <Svg width={ancho} height={alto} viewBox="60 20 280 390">
        <Path d={CORDON} stroke={cordon} strokeWidth={7} fill="none" strokeLinecap="round" />
        <Path d={CUERPO + AGUJERO} fillRule="evenodd" fill={cuerpo} />
        {CEJAS[pose] && <Path d={CEJAS[pose]} stroke={rasgo} strokeWidth={6.5} fill="none" strokeLinecap="round" />}
        <Ojos pose={pose} rasgo={rasgo} parpadeo={parpadeo && pose !== 'feliz'} />
        <Boca pose={pose} rasgo={rasgo} />
        {pose === 'saludo' && (
          // Cachetes: en el saludo va contento de verdad.
          <G opacity={0.5}>
            <Ellipse cx={150} cy={284} rx={12} ry={7} fill="#F0707F" />
            <Ellipse cx={250} cy={284} rx={12} ry={7} fill="#F0707F" />
          </G>
        )}
        <Extra tipo={extra} acento={acento} />
        {/* Un piso chiquito para que no parezca flotando en la nada. */}
        <Rect x={150} y={398} width={100} height={6} rx={3} fill="#000000" opacity={0.12} />
      </Svg>
    </Animated.View>
  );
};

export default Tiqui;
