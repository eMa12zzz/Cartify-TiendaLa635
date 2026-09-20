import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { Bike, Heart, Mic, Plus, Search, ShieldCheck, ShoppingBag, Star, Store } from 'lucide-react-native';
import { useTema } from '../../context/TemaContext';
import { FOTOS } from './fotos';

/*
 * ============================================================
 * ESCENAS DE LA BIENVENIDA — lo que se ve en el centro de cada diapositiva
 * ============================================================
 * Cada diapositiva de Onboarding.js muestra una MAQUETA de lo que explica,
 * armada con las fotos reales del catálogo (ver fotos.js) y con las mismas
 * piezas que ya tiene la app: la tarjeta de producto, el carrito, el mapa de
 * seguimiento, el código de entrega, los puntos, el corazón de favoritos.
 * Es el mismo recurso de la landing de la web (mini tienda, orbe de voz,
 * mapa con la ruta, aro de puntos): que la persona VEA el producto en vez de
 * leer una descripción.
 *
 * Todas trabajan sobre una caja de tamaño fijo (`MEDIDAS`) que Onboarding.js
 * escala para que quepa en cualquier pantalla — así los números de aquí no
 * dependen del teléfono.
 *
 * `activa` es si esa diapositiva es la que se está viendo: solo entonces
 * corren las entradas y los bucles (fotos que flotan, anillos que laten,
 * el repartidor que avanza). Cuatro diapositivas animando a la vez, tres de
 * ellas fuera de pantalla, era gastar batería por nada.
 *
 * Son dibujos, no pantallas reales: los precios y los nombres son de ejemplo
 * (los mismos productos que muestra la landing), y no llevan ningún toque.
 * ============================================================
 */

export const MEDIDAS = {
  tienda: { w: 340, h: 392 },
  voz: { w: 340, h: 384 },
  mapa: { w: 340, h: 336 },
  puntos: { w: 340, h: 328 },
};

const TINTA = '#1C1614';
const GRIS = '#8A8480';

// Mezcla un color hexadecimal con blanco: para el acento sobre fondos que ya
// son del color de la marca, donde el acento puro se perdía.
export const aclarar = (hex, t = 0.45) => {
  const limpio = String(hex || '').replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(limpio)) return '#FFFFFF';
  const canal = (i) => Math.round(parseInt(limpio.slice(i, i + 2), 16) * (1 - t) + 255 * t);
  return `rgb(${canal(0)}, ${canal(2)}, ${canal(4)})`;
};

const Foto = ({ fuente, style }) => <Image source={fuente} contentFit="contain" style={style} />;

/*
 * Entrada con resorte y en cascada: cada elemento sube un poquito, crece
 * pasándose un pelo de su tamaño y se asienta — el "pop" de la landing. Al
 * dejar de estar activa vuelve a cero, para que al regresar se repita.
 */
const usarPops = (cuantos, activa, { retraso = 420, paso = 110 } = {}) => {
  const valores = useRef(Array.from({ length: cuantos }, () => new Animated.Value(0))).current;
  useEffect(() => {
    if (!activa) {
      // Al dejar de ser la activa NO se borra de inmediato: la diapositiva
      // todavía se está deslizando hacia afuera, y una escena que se
      // esfuma mientras sale se ve como un parpadeo. Se borra cuando ya
      // se fue de la pantalla (y se cancela si vuelve antes).
      const espera = setTimeout(() => valores.forEach((v) => v.setValue(0)), 800);
      return () => clearTimeout(espera);
    }
    valores.forEach((v) => v.setValue(0));
    const animacion = Animated.stagger(
      paso,
      valores.map((v) => Animated.spring(v, { toValue: 1, friction: 6, tension: 85, useNativeDriver: true }))
    );
    const espera = setTimeout(() => animacion.start(), retraso);
    return () => {
      clearTimeout(espera);
      animacion.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activa]);
  return valores;
};

const estiloPop = (v, dy = 18, desde = 0.7) => ({
  opacity: v.interpolate({ inputRange: [0, 0.55], outputRange: [0, 1], extrapolate: 'clamp' }),
  transform: [
    { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [dy, 0] }) },
    { scale: v.interpolate({ inputRange: [0, 1], outputRange: [desde, 1] }) },
  ],
});

// Bucles que solo corren mientras la diapositiva está a la vista.
const usarBucles = (activa, crear) => {
  useEffect(() => {
    if (!activa) return undefined;
    const animaciones = crear();
    animaciones.forEach((a) => a.start());
    return () => animaciones.forEach((a) => a.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activa]);
};

const vaiven = (valor, ms) =>
  Animated.loop(
    Animated.sequence([
      Animated.timing(valor, { toValue: 1, duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(valor, { toValue: 0, duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])
  );

// Un anillo que se expande y se desvanece, escalonado con `desfase`.
const anillo = (valor, ms, desfase = 0) =>
  Animated.sequence([
    Animated.delay(desfase),
    Animated.loop(
      Animated.timing(valor, { toValue: 1, duration: ms, easing: Easing.out(Easing.quad), useNativeDriver: true })
    ),
  ]);

const estiloAnillo = (valor, hasta, opacidad = 0.55) => ({
  opacity: valor.interpolate({ inputRange: [0, 1], outputRange: [opacidad, 0] }),
  transform: [{ scale: valor.interpolate({ inputRange: [0, 1], outputRange: [1, hasta] }) }],
});

/* ─────────────────────────── 01 · LA TIENDA ─────────────────────────── */

const PRODUCTOS_TIENDA = [
  { clave: 'manzana', nombre: 'Manzana', precio: '5.20' },
  { clave: 'pera', nombre: 'Pera', precio: '1.60' },
  { clave: 'uvas', nombre: 'Uvas verdes', precio: '5.20' },
];

export const EscenaTienda = ({ activa }) => {
  // Maqueta dibujada: igual en los dos modos (ver coloresClaros en TemaContext).
  const { coloresClaros: colores } = useTema();
  // 0 marco · 1-3 tarjetas · 4-6 fotos que flotan · 7 contador del carrito
  const pops = usarPops(8, activa);
  const flota = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
  const latido = useRef(new Animated.Value(0)).current;

  usarBucles(activa, () => [
    vaiven(flota[0], 2200),
    vaiven(flota[1], 2700),
    vaiven(flota[2], 2400),
    // El "+" de la segunda tarjeta se toca solo de vez en cuando: enseña QUÉ
    // hacer sin poner una manita.
    Animated.loop(
      Animated.sequence([
        Animated.delay(1800),
        Animated.timing(latido, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(latido, { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.delay(1200),
      ])
    ),
  ]);

  const flotante = (i, base) => ({
    transform: [
      { translateY: flota[i].interpolate({ inputRange: [0, 1], outputRange: [-6, 6] }) },
      { rotate: flota[i].interpolate({ inputRange: [0, 1], outputRange: [`${base - 3}deg`, `${base + 3}deg`] }) },
    ],
  });

  return (
    <View style={{ width: MEDIDAS.tienda.w, height: MEDIDAS.tienda.h }}>
      <Animated.View style={[estilos.marcoTienda, estiloPop(pops[0], 34, 0.92)]}>
        <View style={estilos.cabTienda}>
          <Text style={estilos.nombreTienda}>Tienda la 635</Text>
          <View style={estilos.botonCarrito}>
            <ShoppingBag size={15} color={TINTA} strokeWidth={2.2} />
            <Animated.View style={[estilos.contador, { backgroundColor: colores.marca }, estiloPop(pops[7], 0, 0.3)]}>
              <Text style={estilos.contadorTexto}>1</Text>
            </Animated.View>
          </View>
        </View>

        <View style={estilos.buscador}>
          <Search size={13} color="#9CA3AF" strokeWidth={2.4} />
          <Text style={estilos.buscadorTexto}>Buscar productos…</Text>
        </View>

        <View style={estilos.pastillas}>
          {['Todos', 'Frutas', 'Snacks', 'Bebidas'].map((p, i) => (
            <View key={p} style={[estilos.pastilla, i === 0 && { backgroundColor: colores.marca, borderColor: colores.marca }]}>
              <Text style={[estilos.pastillaTexto, i === 0 && { color: '#FFFFFF' }]}>{p}</Text>
            </View>
          ))}
        </View>

        <View style={estilos.filaTarjetas}>
          {PRODUCTOS_TIENDA.map((p, i) => (
            <Animated.View key={p.clave} style={[estilos.tarjetaMini, estiloPop(pops[1 + i], 24, 0.85)]}>
              <View style={estilos.fotoCaja}>
                <Foto fuente={FOTOS[p.clave]} style={estilos.fotoMini} />
              </View>
              <Text style={estilos.nombreMini} numberOfLines={1}>{p.nombre}</Text>
              <View style={estilos.filaPrecioMini}>
                <Text style={estilos.precioMini}>${p.precio}</Text>
                <Animated.View
                  style={[
                    estilos.botonMas,
                    i === 1 && { transform: [{ scale: latido.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) }] },
                  ]}
                >
                  <Plus size={13} color="#FFFFFF" strokeWidth={3} />
                </Animated.View>
              </View>
            </Animated.View>
          ))}
        </View>
      </Animated.View>

      {/* Las tres fotos que flotan van en los bordes del marco, donde no
          tapan nada: la sandía en el hueco del encabezado (entre el nombre y
          el carrito) y las otras dos asomando por abajo, como en la landing. */}
      <Animated.View style={[estilos.flotante, { left: 122, top: 0, width: 108, height: 98 }, estiloPop(pops[4], 0, 0.3), flotante(0, 12)]}>
        <Foto fuente={FOTOS.sandia} style={estilos.rellena} />
      </Animated.View>
      <Animated.View style={[estilos.flotante, { left: -14, top: 300, width: 96, height: 96 }, estiloPop(pops[5], 0, 0.3), flotante(1, -12)]}>
        <Foto fuente={FOTOS.cheetos} style={estilos.rellena} />
      </Animated.View>
      <Animated.View style={[estilos.flotante, { left: 244, top: 292, width: 104, height: 104 }, estiloPop(pops[6], 0, 0.3), flotante(2, 8)]}>
        <Foto fuente={FOTOS.cocacola} style={estilos.rellena} />
      </Animated.View>
    </View>
  );
};

/* ───────────────────────── 02 · ASISTENTE DE VOZ ───────────────────────── */

const BARRAS = [0.4, 0.75, 0.55, 1, 0.65, 0.9, 0.5, 0.8, 0.45, 0.7, 0.35];

export const EscenaVoz = ({ activa }) => {
  // Maqueta dibujada: igual en los dos modos (ver coloresClaros en TemaContext).
  const { coloresClaros: colores } = useTema();
  // 0 orbe · 1 ondas · 2 frase · 3 carrito · 4-6 renglones
  const pops = usarPops(7, activa, { paso: 140 });
  const anillos = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
  const barras = useRef(BARRAS.map(() => new Animated.Value(0))).current;

  usarBucles(activa, () => [
    anillo(anillos[0], 2400, 0),
    anillo(anillos[1], 2400, 800),
    anillo(anillos[2], 2400, 1600),
    ...barras.map((b, i) => vaiven(b, 380 + (i % 4) * 110)),
  ]);

  return (
    <View style={{ width: MEDIDAS.voz.w, height: MEDIDAS.voz.h }}>
      <View style={estilos.grupoOrbe}>
        {anillos.map((a, i) => (
          <Animated.View key={i} style={[estilos.anilloOrbe, estiloAnillo(a, 2.05)]} />
        ))}
        <Animated.View style={[estilos.orbe, estiloPop(pops[0], 0, 0.5)]}>
          <LinearGradient
            colors={[aclarar(colores.acento, 0.2), colores.marca]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <Mic size={34} color="#FFFFFF" strokeWidth={1.9} />
        </Animated.View>
      </View>

      <Animated.View style={[estilos.ondas, estiloPop(pops[1], 8, 0.9)]}>
        {barras.map((b, i) => (
          <Animated.View
            key={i}
            style={[
              estilos.barra,
              {
                transform: [
                  { scaleY: b.interpolate({ inputRange: [0, 1], outputRange: [0.25, BARRAS[i]] }) },
                ],
              },
            ]}
          />
        ))}
      </Animated.View>

      <Animated.View style={[estilos.frase, estiloPop(pops[2], 14, 0.9)]}>
        <Text style={estilos.fraseTexto} numberOfLines={1}>“una manzana, dos coca colas y unos takis”</Text>
      </Animated.View>

      <Animated.View style={[estilos.carrito, estiloPop(pops[3], 22, 0.94)]}>
        <View style={estilos.cabCarrito}>
          <View style={estilos.filaIcono}>
            <ShoppingBag size={14} color={TINTA} strokeWidth={2.3} />
            <Text style={estilos.tituloCarrito}>Su carrito</Text>
          </View>
          <Text style={[estilos.totalCarrito, { color: colores.marca }]}>$8.70</Text>
        </View>
        <Animated.View style={[estilos.renglon, estiloPop(pops[4], 12, 0.9)]}>
          <View style={estilos.miniatura}><Foto fuente={FOTOS.manzana} style={estilos.fotoRenglon} /></View>
          <Text style={estilos.textoRenglon}>1× Manzana</Text>
          <Text style={estilos.precioRenglon}>$5.20</Text>
        </Animated.View>
        <Animated.View style={[estilos.renglon, estiloPop(pops[5], 12, 0.9)]}>
          <View style={estilos.miniatura}><Foto fuente={FOTOS.cocacola} style={estilos.fotoRenglon} /></View>
          <Text style={estilos.textoRenglon}>2× Coca-Cola</Text>
          <Text style={estilos.precioRenglon}>$2.50</Text>
        </Animated.View>
        <Animated.View style={[estilos.renglon, estiloPop(pops[6], 12, 0.9)]}>
          <View style={estilos.miniatura}><Foto fuente={FOTOS.takis} style={estilos.fotoRenglon} /></View>
          <Text style={estilos.textoRenglon}>1× Takis Originales</Text>
          <Text style={estilos.precioRenglon}>$1.00</Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

/* ─────────────────────────── 03 · SEGUIMIENTO ─────────────────────────── */

// La ruta, en las coordenadas del mapa (340×224): sale de la tienda, sube,
// dobla a la derecha, vuelve a subir y llega a la casa.
const RUTA = [
  { x: 46, y: 182 },
  { x: 46, y: 116 },
  { x: 190, y: 116 },
  { x: 190, y: 60 },
  { x: 288, y: 60 },
];
const D_RUTA = RUTA.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ');
// En qué fracción del recorrido está cada esquina, por longitud de tramo.
const LARGOS = RUTA.slice(1).map((p, i) => Math.abs(p.x - RUTA[i].x) + Math.abs(p.y - RUTA[i].y));
const TOTAL_RUTA = LARGOS.reduce((a, b) => a + b, 0);
const FRACCIONES = LARGOS.reduce((acc, l) => [...acc, acc[acc.length - 1] + l / TOTAL_RUTA], [0]);

const CODIGO = ['9', '2', '9', '4'];

export const EscenaMapa = ({ activa }) => {
  // Maqueta dibujada: igual en los dos modos (ver coloresClaros en TemaContext).
  const { coloresClaros: colores } = useTema();
  // 0 mapa · 1 aviso · 2 tienda · 3 casa · 4 tarjeta · 5-8 dígitos
  const pops = usarPops(9, activa, { paso: 120 });
  const avance = useRef(new Animated.Value(0)).current;
  const latidoCasa = useRef(new Animated.Value(0)).current;
  const latidoMoto = useRef(new Animated.Value(0)).current;

  usarBucles(activa, () => [
    Animated.loop(
      Animated.sequence([
        Animated.delay(1400),
        Animated.timing(avance, { toValue: 1, duration: 5200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.delay(900),
        Animated.timing(avance, { toValue: 0, duration: 1, useNativeDriver: true }),
      ])
    ),
    anillo(latidoCasa, 2000, 0),
    anillo(latidoMoto, 1600, 400),
  ]);

  const rutaColor = aclarar(colores.acento, 0.3);
  const x = avance.interpolate({ inputRange: FRACCIONES, outputRange: RUTA.map((p) => p.x - 9) });
  const y = avance.interpolate({ inputRange: FRACCIONES, outputRange: RUTA.map((p) => p.y - 9) });

  return (
    <View style={{ width: MEDIDAS.mapa.w, height: MEDIDAS.mapa.h }}>
      <Animated.View style={[estilos.mapa, estiloPop(pops[0], 30, 0.94)]}>
        <Svg width={340} height={224} style={StyleSheet.absoluteFill}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <Line key={`v${i}`} x1={i * 34} y1={0} x2={i * 34} y2={224} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
          ))}
          {[1, 2, 3, 4, 5, 6, 7].map((j) => (
            <Line key={`h${j}`} x1={0} y1={j * 30} x2={340} y2={j * 30} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
          ))}
          <Rect x={62} y={14} width={62} height={52} rx={8} fill="rgba(255,255,255,0.05)" />
          <Rect x={232} y={128} width={72} height={64} rx={8} fill="rgba(255,255,255,0.05)" />
          <Rect x={96} y={136} width={64} height={56} rx={10} fill="rgba(52,168,83,0.32)" />
          <Rect x={236} y={14} width={62} height={22} rx={6} fill="rgba(255,255,255,0.05)" />
          <Path d={D_RUTA} stroke={rutaColor} strokeOpacity={0.25} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <Path d={D_RUTA} stroke={rutaColor} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>

        <Animated.View style={[estilos.avisoMapa, estiloPop(pops[1], 10, 0.9)]}>
          <View style={estilos.puntoVerde} />
          <Bike size={13} color={TINTA} strokeWidth={2.4} />
          <Text style={estilos.avisoTexto}>En camino · 8 min</Text>
        </Animated.View>

        <Animated.View style={[estilos.marcaTienda, { left: RUTA[0].x - 16, top: RUTA[0].y - 16 }, estiloPop(pops[2], 0, 0.3)]}>
          <Store size={16} color={colores.marca} strokeWidth={2.2} />
        </Animated.View>

        <Animated.View style={[estilos.casa, { left: RUTA[4].x - 12, top: RUTA[4].y - 12 }, estiloPop(pops[3], 0, 0.3)]}>
          <Animated.View
            style={[estilos.anilloMapa, { backgroundColor: rutaColor, width: 24, height: 24, borderRadius: 12 }, estiloAnillo(latidoCasa, 2.6, 0.5)]}
          />
          <View style={estilos.casaCentro}><View style={estilos.casaPunto} /></View>
        </Animated.View>

        <Animated.View style={[estilos.moto, { transform: [{ translateX: x }, { translateY: y }] }]}>
          <Animated.View
            style={[estilos.anilloMapa, { backgroundColor: colores.acento, width: 18, height: 18, borderRadius: 9 }, estiloAnillo(latidoMoto, 2.4, 0.55)]}
          />
          <View style={[estilos.motoPunto, { backgroundColor: colores.acento }]} />
        </Animated.View>
      </Animated.View>

      <Animated.View style={[estilos.tarjetaPedido, estiloPop(pops[4], 22, 0.94)]}>
        <View>
          <Text style={estilos.etiquetaGris}>Su pedido · 3 productos</Text>
          <View style={estilos.miniaturas}>
            {['manzana', 'leche', 'pringles'].map((c, i) => (
              <View key={c} style={[estilos.circulo, i > 0 && { marginLeft: -12 }]}>
                <Foto fuente={FOTOS[c]} style={estilos.fotoCirculo} />
              </View>
            ))}
          </View>
        </View>
        <View>
          <View style={estilos.filaIcono}>
            <ShieldCheck size={13} color={colores.marca} strokeWidth={2.4} />
            <Text style={estilos.etiquetaGris}>Código de entrega</Text>
          </View>
          <View style={estilos.digitos}>
            {CODIGO.map((d, i) => (
              <Animated.View key={i} style={[estilos.digito, estiloPop(pops[5 + i], 8, 0.6)]}>
                <Text style={[estilos.digitoTexto, { color: colores.marcaOscuro }]}>{d}</Text>
              </Animated.View>
            ))}
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

/* ───────────────────── 04 · PUNTOS Y FAVORITOS ───────────────────── */

const RADIO = 52;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;
const META_PUNTOS = 1250;
const LLENADO = 0.74;

const conComas = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const FAVORITOS = [
  { clave: 'uvas', nombre: 'Uvas verdes', precio: '$5.20' },
  { clave: 'leche', nombre: 'Leche entera', precio: '$8.30' },
];

export const EscenaPuntos = ({ activa }) => {
  // Maqueta dibujada: igual en los dos modos (ver coloresClaros en TemaContext).
  const { coloresClaros: colores } = useTema();
  // 0 aro · 1-2 favoritos · 3-4 corazones · 5 compra de hoy
  const pops = usarPops(6, activa, { paso: 130 });
  const progreso = useRef(new Animated.Value(0)).current;
  const brillo = useRef(new Animated.Value(0)).current;
  const [puntos, setPuntos] = useState(0);

  useEffect(() => {
    progreso.setValue(0);
    setPuntos(0);
    if (!activa) return undefined;
    const oyente = progreso.addListener(({ value }) => setPuntos(Math.round(value * META_PUNTOS)));
    // Sin driver nativo: el número y el aro salen de este mismo valor, que
    // se lee en JS para redibujarlos (el aro es una propiedad de SVG, no una
    // transformación de vista, y animar eso directo no es de fiar).
    const conteo = Animated.timing(progreso, {
      toValue: 1,
      duration: 1500,
      delay: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    conteo.start();
    return () => {
      conteo.stop();
      progreso.removeListener(oyente);
    };
  }, [activa, progreso]);

  usarBucles(activa, () => [vaiven(brillo, 1100)]);

  const desplazamiento = CIRCUNFERENCIA * (1 - LLENADO * (puntos / META_PUNTOS));

  return (
    <View style={{ width: MEDIDAS.puntos.w, height: MEDIDAS.puntos.h }}>
      <Animated.View style={[estilos.tarjetaAro, estiloPop(pops[0], 26, 0.9)]}>
        <Text style={estilos.tituloAro}>Puntos de fidelidad</Text>
        <View style={estilos.aroCaja}>
          <Svg width={128} height={128}>
            <Circle cx={64} cy={64} r={RADIO} stroke="#E3EEF5" strokeWidth={11} fill="none" />
            <Circle
              cx={64}
              cy={64}
              r={RADIO}
              stroke={colores.acento}
              strokeWidth={11}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${CIRCUNFERENCIA} ${CIRCUNFERENCIA}`}
              strokeDashoffset={desplazamiento}
              rotation={-90}
              origin="64, 64"
            />
          </Svg>
          <View style={estilos.centroAro}>
            <Text style={estilos.cifraAro}>{conComas(puntos)}</Text>
            <Text style={estilos.unidadAro}>puntos</Text>
          </View>
        </View>
        <Text style={estilos.pieAro}>Se convierten en descuento</Text>
      </Animated.View>

      <View style={estilos.columnaFavoritos}>
        {FAVORITOS.map((f, i) => (
          <Animated.View key={f.clave} style={[estilos.tarjetaFavorito, estiloPop(pops[1 + i], 24, 0.85)]}>
            <View style={estilos.fotoFavorito}>
              <Foto fuente={FOTOS[f.clave]} style={estilos.fotoFavoritoImg} />
            </View>
            <View style={estilos.textoFavorito}>
              <Text style={estilos.nombreFavorito} numberOfLines={2}>{f.nombre}</Text>
              <Text style={estilos.precioFavorito}>{f.precio}</Text>
            </View>
            <Animated.View style={[estilos.corazon, estiloPop(pops[3 + i], 0, 0.2)]}>
              <Heart size={13} color="#FF4D6D" fill="#FF4D6D" strokeWidth={2} />
            </Animated.View>
          </Animated.View>
        ))}
      </View>

      <Animated.View style={[estilos.compraHoy, estiloPop(pops[5], 22, 0.94)]}>
        <View style={estilos.miniaturasFila}>
          {['manzana', 'uvas', 'pera'].map((c, i) => (
            <View key={c} style={[estilos.circulo, i > 0 && { marginLeft: -12 }]}>
              <Foto fuente={FOTOS[c]} style={estilos.fotoCirculo} />
            </View>
          ))}
        </View>
        <View style={estilos.textoCompra}>
          <Text style={estilos.tituloCompra}>Compra de hoy</Text>
          <Text style={estilos.subCompra}>3 productos</Text>
        </View>
        <Animated.View
          style={[
            estilos.ganaste,
            { transform: [{ scale: brillo.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] }) }] },
          ]}
        >
          <Star size={12} color="#FFFFFF" fill="#FFFFFF" strokeWidth={2} />
          <Text style={estilos.ganasteTexto}>+35 puntos</Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

export const ESCENAS = {
  bienvenida: { Escena: EscenaTienda, medidas: MEDIDAS.tienda },
  voz: { Escena: EscenaVoz, medidas: MEDIDAS.voz },
  mapa: { Escena: EscenaMapa, medidas: MEDIDAS.mapa },
  puntos: { Escena: EscenaPuntos, medidas: MEDIDAS.puntos },
};

const sombra = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.24,
  shadowRadius: 16,
  elevation: 6,
};

const estilos = StyleSheet.create({
  rellena: { width: '100%', height: '100%' },
  filaIcono: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  etiquetaGris: { fontSize: 10.5, fontWeight: '600', color: GRIS },

  /* Tienda */
  marcoTienda: {
    position: 'absolute',
    top: 40,
    left: 0,
    width: 340,
    height: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 12,
    ...sombra,
  },
  cabTienda: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 34 },
  nombreTienda: { fontSize: 13, fontWeight: '900', color: TINTA, letterSpacing: -0.3 },
  botonCarrito: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECE7E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contador: {
    position: 'absolute',
    top: -5,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  contadorTexto: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 30,
    marginTop: 6,
    paddingHorizontal: 11,
    borderRadius: 15,
    backgroundColor: '#F4F4F5',
  },
  buscadorTexto: { fontSize: 11, color: '#9CA3AF' },
  pastillas: { flexDirection: 'row', gap: 6, marginTop: 8 },
  pastilla: {
    paddingHorizontal: 11,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7E2DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastillaTexto: { fontSize: 10.5, fontWeight: '700', color: '#5C5650' },
  filaTarjetas: { flexDirection: 'row', gap: 8, marginTop: 10 },
  tarjetaMini: {
    width: 100,
    padding: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  fotoCaja: {
    height: 78,
    borderRadius: 10,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fotoMini: { width: 66, height: 66 },
  nombreMini: { marginTop: 6, fontSize: 11.5, fontWeight: '700', color: '#111111' },
  filaPrecioMini: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  precioMini: { fontSize: 12.5, fontWeight: '800', color: '#111111' },
  botonMas: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: TINTA,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flotante: { position: 'absolute' },

  /* Voz */
  grupoOrbe: { position: 'absolute', top: 0, left: 95, width: 150, height: 150 },
  anilloOrbe: {
    position: 'absolute',
    top: 33,
    left: 33,
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  orbe: {
    position: 'absolute',
    top: 33,
    left: 33,
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  ondas: {
    position: 'absolute',
    top: 148,
    left: 113,
    width: 114,
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  barra: { width: 4, height: 24, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.9)' },
  frase: {
    position: 'absolute',
    top: 180,
    left: 14,
    width: 312,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    ...sombra,
  },
  fraseTexto: { fontSize: 12.5, fontWeight: '600', color: TINTA },
  carrito: {
    position: 'absolute',
    top: 228,
    left: 14,
    width: 312,
    height: 154,
    borderRadius: 18,
    padding: 12,
    backgroundColor: '#FFFFFF',
    ...sombra,
  },
  cabCarrito: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 22 },
  tituloCarrito: { fontSize: 12.5, fontWeight: '800', color: TINTA },
  totalCarrito: { fontSize: 14, fontWeight: '900' },
  renglon: { flexDirection: 'row', alignItems: 'center', gap: 9, height: 30, marginTop: 6 },
  miniatura: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fotoRenglon: { width: 26, height: 26 },
  textoRenglon: { flex: 1, fontSize: 12.5, fontWeight: '600', color: '#111111' },
  precioRenglon: { fontSize: 12.5, fontWeight: '700', color: '#111111' },

  /* Mapa */
  mapa: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 340,
    height: 224,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#0B2B3E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  avisoMapa: {
    position: 'absolute',
    top: 12,
    left: 12,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  puntoVerde: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22C55E' },
  avisoTexto: { fontSize: 11.5, fontWeight: '800', color: TINTA },
  marcaTienda: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...sombra,
    shadowOpacity: 0.3,
  },
  casa: { position: 'absolute', width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  anilloMapa: { position: 'absolute' },
  casaCentro: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: TINTA,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  casaPunto: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#FFFFFF' },
  moto: { position: 'absolute', left: 0, top: 0, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  motoPunto: { width: 16, height: 16, borderRadius: 8, borderWidth: 2.5, borderColor: '#FFFFFF' },
  tarjetaPedido: {
    position: 'absolute',
    top: 236,
    left: 0,
    width: 340,
    height: 100,
    borderRadius: 18,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...sombra,
  },
  miniaturas: { flexDirection: 'row', marginTop: 8, paddingLeft: 2 },
  miniaturasFila: { flexDirection: 'row', paddingLeft: 2 },
  circulo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F4F4F5',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fotoCirculo: { width: 30, height: 30 },
  digitos: { flexDirection: 'row', gap: 6, marginTop: 8 },
  digito: {
    width: 32,
    height: 40,
    borderRadius: 9,
    backgroundColor: '#EAF4FA',
    borderWidth: 1,
    borderColor: '#D6E9F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitoTexto: { fontSize: 20, fontWeight: '900' },

  /* Puntos */
  tarjetaAro: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 170,
    height: 248,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    ...sombra,
  },
  tituloAro: { fontSize: 11.5, fontWeight: '800', color: TINTA },
  aroCaja: { width: 128, height: 128, alignItems: 'center', justifyContent: 'center' },
  centroAro: { position: 'absolute', alignItems: 'center' },
  cifraAro: { fontSize: 23, fontWeight: '900', color: TINTA, letterSpacing: -0.5 },
  unidadAro: { fontSize: 10.5, color: GRIS, marginTop: -1 },
  pieAro: { fontSize: 10.5, fontWeight: '600', color: GRIS, textAlign: 'center' },
  columnaFavoritos: { position: 'absolute', top: 0, left: 182, width: 158, gap: 10 },
  tarjetaFavorito: {
    width: 158,
    height: 119,
    borderRadius: 18,
    padding: 10,
    backgroundColor: '#FFFFFF',
    ...sombra,
  },
  fotoFavorito: {
    width: 70,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fotoFavoritoImg: { width: 58, height: 58 },
  textoFavorito: { position: 'absolute', left: 10, right: 10, bottom: 8 },
  nombreFavorito: { fontSize: 12, fontWeight: '800', color: '#111111' },
  precioFavorito: { fontSize: 11, color: GRIS, marginTop: 1 },
  corazon: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0E6E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compraHoy: {
    position: 'absolute',
    top: 260,
    left: 0,
    width: 340,
    height: 68,
    borderRadius: 18,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...sombra,
  },
  textoCompra: { flex: 1 },
  tituloCompra: { fontSize: 12.5, fontWeight: '800', color: TINTA },
  subCompra: { fontSize: 11, color: GRIS, marginTop: 1 },
  ganaste: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#16A34A',
  },
  ganasteTexto: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
});
