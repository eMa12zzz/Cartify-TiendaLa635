/*
 * ============================================================
 * ONBOARDING — las pestañas de bienvenida, una sola vez
 * ============================================================
 * Lo primero que ve quien acaba de instalar la app: cuatro pantallas
 * deslizables que explican qué se puede hacer aquí, antes de pedirle que
 * entre o se registre. RootNavigator.js decide si esto se muestra (lee
 * `utils/almacen.js` con la misma llave que graba `terminar`, más abajo) —
 * este archivo solo pinta las diapositivas y avisa cuándo se terminó.
 *
 * ── El modelo: la landing de la web ──
 * La web tiene una landing (cartify-tienda-la635-bice.vercel.app) que enseña
 * la tienda con FOTOS de productos y maquetas de la propia app — una mini
 * tienda, el orbe del asistente, el mapa con la ruta, el aro de puntos — no
 * con íconos sueltos. Esta bienvenida sigue ese mismo molde:
 *
 *   - Cada diapositiva es un capítulo numerado ("01 LA TIENDA", "02 ASISTENTE
 *     DE VOZ"...) cuyo titular remata en una palabra de acento.
 *   - En el centro va una ESCENA (components/Onboarding/Escenas.js): la
 *     maqueta de lo que se explica, hecha con las fotos reales del catálogo
 *     (components/Onboarding/fotos.js) y las piezas de la propia app.
 *   - Abajo, la explicación corta, en un panel de vidrio, y el botón.
 *
 * ── La animación: cuatro cosas entran EN ORDEN, no todas juntas ──
 * Al llegar a una diapositiva (por swipe o por el botón) entra, en fila:
 *   1. El ícono gigante de marca de agua, que ya viene con el deslizamiento
 *      (`scrollX`), y el titular.
 *   2. La escena, que sube desde abajo; sus piezas (fotos, tarjetas, aviso)
 *      entran una tras otra con resorte — cada escena maneja las suyas.
 *   3. El panel con la explicación, también de abajo hacia arriba.
 *   4. El botón para seguir, centrado, el último en aparecer.
 * Los cuatro comparten un solo `Animated.Value` por diapositiva
 * (`entradas[i]`, de 0 a 1) y cada uno mira una tajada distinta de ese
 * recorrido, así que entran en cascada sin animaciones sueltas que se
 * puedan desincronizar.
 *
 * ── "Liquid glass": vidrio de verdad, con `expo-blur` ──
 * El panel de la explicación y el botón son vidrio esmerilado real
 * (`BlurView`, `tint="dark"`): se ve el degradado desenfocado detrás. Encima
 * va un lavado blanco tenue para que el texto blanco mantenga contraste sin
 * importar qué tan clara u oscura salga la paleta de temporada.
 *
 * ── De dónde sale el "look", y por qué no es un onboarding genérico ──
 *   1. El ícono de marca de agua GIGANTE y tenue detrás del contenido: la
 *      misma idea de TarjetaPromo.js (`marcaDeAgua`) — aquí a pantalla
 *      completa.
 *   2. El degradado de tres paradas [marca, acento, marcaOscuro] con
 *      `locations={[0, 0.55, 1]}`: EXACTAMENTE el de la tarjeta de saldo de
 *      pages/cuenta/Puntos.js, no una paleta inventada para esta pantalla.
 *   3. La flechita del botón es `Flecha` de components/UI/Iconos.js — la misma
 *      que trae cada tarjeta de promoción en su esquina.
 *
 * ── De dónde sale el texto ──
 * "Siga su pedido en el mapa" y la de puntos/favoritos son el mismo texto
 * (casi palabra por palabra) de las Ventajas en `frontend/src/pages/
 * LoginClient.jsx` — no se inventó una promesa nueva, se repitió la que la
 * tienda ya le hace a quien entra por la web.
 * ============================================================
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { Defs, Line, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Bike, Mic, Star, Store } from 'lucide-react-native';
import { ALTURA_ESTADO } from '../theme/pantalla';
import { useTema } from '../context/TemaContext';
import { useBotonAtras } from '../hooks/useBotonAtras';
import MarcaTienda from '../components/UI/MarcaTienda';
import { Flecha } from '../components/UI/Iconos';
import { aclarar, ESCENAS } from '../components/Onboarding/Escenas';

// El ancho/alto de la píldora de los puntos, igual que CarruselPromos.js.
const ANCHO_PUNTO = 7;
const ANCHO_PILDORA = 22;

// Las mismas tres paradas y el mismo reparto que la tarjeta de saldo de
// Puntos.js ([0, 0.55, 1]) — solo cambia el ORDEN de los tres colores en
// cada diapositiva, para que se note el cambio al deslizar sin salirse
// nunca de la paleta de la temporada activa.
const degradadoDe = (colores, orden) => ({
  colors: orden.map((clave) => colores[clave]),
  locations: [0, 0.55, 1],
});

/*
 * `numero` + `etiqueta` y el `tituloAcento` al final del título son de la
 * landing: cada sección suya lleva una etiqueta numerada ("01 LA TIENDA",
 * "02 ASISTENTE DE VOZ"...) y su titular remata en una palabra o frase corta
 * en el color de acento ("a un click.", "control total."). Las etiquetas son
 * las mismas de la landing donde existen (LA TIENDA, ASISTENTE DE VOZ); las
 * otras dos siguen su mismo molde.
 */
const diapositivasDe = (colores) => [
  {
    clave: 'bienvenida',
    ...degradadoDe(colores, ['marca', 'acento', 'marcaOscuro']),
    IconoFondo: Store,
    numero: '01',
    etiqueta: 'LA TIENDA',
    tituloPrefijo: 'El súper de la esquina,\na un ',
    tituloAcento: 'toque',
    texto: 'Compre desde el celular y reciba en su puerta, o pase a recogerlo usted mismo.',
  },
  {
    clave: 'voz',
    ...degradadoDe(colores, ['marcaClaro', 'marca', 'acento']),
    IconoFondo: Mic,
    numero: '02',
    etiqueta: 'ASISTENTE DE VOZ',
    tituloPrefijo: 'Pida ',
    tituloAcento: 'hablando',
    texto: 'Dígale a nuestro asistente qué necesita y arme su pedido sin escribir ni un producto.',
  },
  {
    clave: 'mapa',
    ...degradadoDe(colores, ['acento', 'marca', 'marcaOscuro']),
    IconoFondo: Bike,
    numero: '03',
    etiqueta: 'SEGUIMIENTO',
    tituloPrefijo: 'Siga su pedido en ',
    tituloAcento: 'el mapa',
    texto: 'Vea al repartidor acercarse y sepa cuándo salir a la puerta.',
  },
  {
    clave: 'puntos',
    ...degradadoDe(colores, ['marcaOscuro', 'acento', 'marcaClaro']),
    IconoFondo: Star,
    numero: '04',
    etiqueta: 'PUNTOS Y FAVORITOS',
    tituloPrefijo: 'Junte puntos con\n',
    tituloAcento: 'cada compra',
    texto: 'Se convierten en descuento la próxima vez. Y lo que marque con el corazón no se le vuelve a perder.',
  },
];

// Una tajada del recorrido 0→1 de `valor` se vuelve opacidad + un empuje
// desde abajo — la misma receta para los bloques que entran en cascada,
// solo cambia EN QUÉ TRAMO del recorrido le toca a cada uno.
const tramo = (valor, inicio, fin, desplazamiento = 26) => ({
  opacity: valor.interpolate({ inputRange: [inicio, fin], outputRange: [0, 1], extrapolate: 'clamp' }),
  transform: [
    {
      translateY: valor.interpolate({
        inputRange: [inicio, fin],
        outputRange: [desplazamiento, 0],
        extrapolate: 'clamp',
      }),
    },
  ],
});

/*
 * La textura de fondo, también de la landing: una cuadrícula finísima y un
 * resplandor blando detrás de donde va la escena. Es lo que hace que el
 * degradado se sienta como un escenario y no como una pared lisa.
 */
const PASO_CUADRICULA = 44;
const Textura = ({ ancho, alto }) => {
  const verticales = Math.ceil(ancho / PASO_CUADRICULA);
  const horizontales = Math.ceil(alto / PASO_CUADRICULA);
  return (
    <Svg width={ancho} height={alto} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id="brillo" cx="50%" cy="46%" rx="62%" ry="34%">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.22" />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={ancho} height={alto} fill="url(#brillo)" />
      {Array.from({ length: verticales }, (_, i) => (
        <Line key={`v${i}`} x1={i * PASO_CUADRICULA} y1={0} x2={i * PASO_CUADRICULA} y2={alto} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
      ))}
      {Array.from({ length: horizontales }, (_, j) => (
        <Line key={`h${j}`} x1={0} y1={j * PASO_CUADRICULA} x2={ancho} y2={j * PASO_CUADRICULA} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
      ))}
    </Svg>
  );
};

const Onboarding = ({ alTerminar }) => {
  const { colores } = useTema();
  const insets = useSafeAreaInsets();

  const diapositivas = diapositivasDe(colores);
  // El acento puro se perdía sobre fondos que ya son del color de la marca:
  // la palabra final del titular va en una versión aclarada de ese mismo acento.
  const acentoClaro = aclarar(colores.acento, 0.55);

  const [ancho, setAncho] = useState(Dimensions.get('window').width);
  // Un ScrollView horizontal NO estira solo a sus hijos al alto disponible
  // (el alto de cada `View` de una diapositiva sale de su CONTENIDO, no del
  // contenedor) — sin este número puesto a mano, el degradado de cada
  // diapositiva se cortaba donde terminaba el contenido y dejaba el resto
  // de la pantalla en negro, el color de `estilos.pantalla` de más abajo.
  const [alto, setAlto] = useState(Dimensions.get('window').height);
  const [activa, setActiva] = useState(0);
  // El espacio que le queda a la escena entre el titular y el panel de
  // abajo: cada escena tiene un tamaño fijo y se ESCALA para caber aquí, en
  // un teléfono chico o en uno alto.
  const [zona, setZona] = useState(null);
  const scrollRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // El ancho (y el alto) reales, no los del arranque: igual que
  // CarruselPromos.js, para que una rotación de pantalla no deje el
  // "paginado" midiendo otra cosa.
  const alMedir = useCallback((e) => {
    setAncho(e.nativeEvent.layout.width);
    setAlto(e.nativeEvent.layout.height);
  }, []);

  const alMedirZona = useCallback((e) => {
    const { width, height } = e.nativeEvent.layout;
    setZona((previa) => (previa && previa.w === width && previa.h === height ? previa : { w: width, h: height }));
  }, []);

  const irA = useCallback(
    (i) => {
      const destino = Math.max(0, Math.min(diapositivas.length - 1, i));
      setActiva(destino);
      scrollRef.current?.scrollTo({ x: destino * ancho, animated: true });
    },
    [ancho, diapositivas.length]
  );

  // El botón de atrás de Android retrocede una diapositiva en vez de salir
  // de la app — pero solo mientras no sea la primera, donde el atrás normal
  // (salir) es exactamente lo que alguien esperaría de la pantalla de arranque.
  useBotonAtras(() => irA(activa - 1), activa > 0);

  const alTerminarDeDeslizar = useCallback(
    (e) => setActiva(Math.round(e.nativeEvent.contentOffset.x / ancho)),
    [ancho]
  );

  const esUltima = activa === diapositivas.length - 1;
  const siguiente = () => (esUltima ? alTerminar() : irA(activa + 1));

  /*
   * La cascada de cada diapositiva: un `Animated.Value` por diapositiva, de
   * 0 a 1, que arranca cada vez que esa diapositiva pasa a ser la activa (al
   * llegar por swipe o por el botón) y se reinicia a 0 en las demás — así,
   * si se vuelve a esa diapositiva, la entrada se repite en vez de quedarse
   * "ya vista" para siempre.
   */
  const entradas = useRef([]).current;
  if (entradas.length !== diapositivas.length) {
    entradas.length = 0;
    diapositivas.forEach(() => entradas.push(new Animated.Value(0)));
  }
  useEffect(() => {
    // La que se va NO se apaga de inmediato: todavía se está deslizando hacia
    // afuera y un titular o un panel que desaparecen a medio salir se ven
    // como un parpadeo. Se reinicia cuando ya no se ve (y el efecto siguiente
    // cancela estos temporizadores, que vuelven a armarse para todas).
    const reinicios = [];
    entradas.forEach((valor, i) => {
      if (i === activa) {
        valor.setValue(0);
        Animated.timing(valor, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      } else {
        reinicios.push(setTimeout(() => valor.setValue(0), 800));
      }
    });
    return () => reinicios.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activa]);

  /*
   * Los puntos: MISMA píldora animada de CarruselPromos.js. Se dibujan una
   * vez POR diapositiva (viven dentro del contenido que viaja con el scroll),
   * pero comparten estos mismos `Animated.Value` — así las cuatro copias se
   * mueven exactamente igual, sin cuatro animaciones sueltas
   * desincronizándose entre sí.
   */
  const anchosPuntos = useRef([]).current;
  if (anchosPuntos.length !== diapositivas.length) {
    anchosPuntos.length = 0;
    diapositivas.forEach((_, i) =>
      anchosPuntos.push(new Animated.Value(i === activa ? ANCHO_PILDORA : ANCHO_PUNTO))
    );
  }
  useEffect(() => {
    Animated.parallel(
      anchosPuntos.map((valor, i) =>
        Animated.timing(valor, {
          toValue: i === activa ? ANCHO_PILDORA : ANCHO_PUNTO,
          duration: 220,
          useNativeDriver: false,
        })
      )
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activa]);

  return (
    <View style={estilos.pantalla}>
      {/* Íconos claros: el fondo de toda esta pantalla es oscuro, al revés
          del resto de la app (ver App.js, que deja "dark" puesto). */}
      <StatusBar style="light" />

      {/*
        `ScrollView` normal, no `Animated.ScrollView`: mismo componente y
        mismo `ref.scrollTo` que ya usa CarruselPromos.js, en vez de un tipo
        nuevo solo para este archivo. El único costo es que la entrada/salida
        de la marca de agua (`scrollX` de abajo) corre por JS
        (`useNativeDriver: false`) y no por el hilo nativo — para cuatro
        diapositivas livianas no se nota.
      */}
      <ScrollView
        ref={scrollRef}
        style={estilos.scroll}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onLayout={alMedir}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        onMomentumScrollEnd={alTerminarDeDeslizar}
      >
        {diapositivas.map((d, i) => {
          // La marca de agua sigue el propio deslizamiento: no hace falta
          // disparar una animación a mano cuando cambia `activa`, el
          // `scrollX` ya se mueve al mismo ritmo que el dedo. Se mueve MÁS
          // despacio que el resto (la mitad del recorrido): se queda
          // "flotando" atrás, un ligerísimo paralaje.
          const rango = [(i - 1) * ancho, i * ancho, (i + 1) * ancho];
          const paralaje = scrollX.interpolate({ inputRange: rango, outputRange: [ancho * 0.2, 0, -ancho * 0.2], extrapolate: 'clamp' });
          const IconoAgua = d.IconoFondo;

          const { Escena, medidas } = ESCENAS[d.clave];
          // Nunca más grande de lo natural + un poco (en tabletas se ve
          // mejor algo más grande), ni tan chica que no se lea.
          const escala = zona ? Math.max(0.5, Math.min(1.12, zona.w / medidas.w, zona.h / medidas.h)) : 1;

          // Las tajadas de la cascada de ESTA diapositiva, encimadas a
          // propósito (cada una empieza antes de que la anterior termine)
          // para que se sienta continua y no cuatro golpes sueltos.
          const animTitulo = tramo(entradas[i], 0, 0.26, 18);
          const animEscena = tramo(entradas[i], 0.1, 0.46, 80);
          const animInfo = tramo(entradas[i], 0.44, 0.78, 34);
          const animBoton = tramo(entradas[i], 0.68, 1, 26);

          return (
            <View key={d.clave} style={{ width: ancho, height: alto }}>
              <LinearGradient
                colors={d.colors}
                locations={d.locations}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <Textura ancho={ancho} alto={alto} />

              {/*
                La marca de agua: el mismo truco de TarjetaPromo.js
                (`marcaDeAgua`), un ícono enorme y casi invisible detrás de
                todo, que se asoma por los lados de la escena.
              */}
              <Animated.View
                pointerEvents="none"
                style={[estilos.marcaDeAgua, { transform: [{ translateX: paralaje }] }]}
              >
                <IconoAgua size={ancho * 1.05} color="#FFFFFF" strokeWidth={0.8} />
              </Animated.View>

              <View
                style={[
                  estilos.cuerpo,
                  { paddingTop: ALTURA_ESTADO + 62, paddingBottom: Math.max(insets.bottom, 16) },
                ]}
              >
                {/* 1. El capítulo: etiqueta numerada y titular con su palabra
                    de acento, como cada sección de la landing. */}
                <Animated.View style={[estilos.bloqueTitulo, animTitulo]}>
                  <View style={estilos.filaEtiqueta}>
                    <View style={estilos.numeroChip}>
                      <Text style={estilos.numeroTexto}>{d.numero}</Text>
                    </View>
                    <Text style={estilos.etiquetaTexto}>{d.etiqueta}</Text>
                  </View>
                  <Text style={estilos.titulo}>
                    {d.tituloPrefijo}
                    <Text style={{ color: acentoClaro }}>{d.tituloAcento}</Text>
                  </Text>
                </Animated.View>

                {/* 2. La escena: sube desde abajo con la maqueta de lo que se
                    explica (fotos reales, la tarjeta, el mapa...). Es un
                    dibujo, no algo que se toque: se le quita al lector de
                    pantalla. */}
                <View style={estilos.zonaEscena} onLayout={alMedirZona}>
                  <Animated.View
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    style={{
                      opacity: animEscena.opacity,
                      transform: [animEscena.transform[0], { scale: escala }],
                    }}
                  >
                    <Escena activa={i === activa} />
                  </Animated.View>
                </View>

                {/* 3. La explicación, en su panel de vidrio, de abajo hacia
                    arriba. */}
                <Animated.View style={[estilos.panelVidrio, animInfo]}>
                  <BlurView intensity={34} tint="dark" style={estilos.vidrio}>
                    <View style={estilos.vidrioTinte} pointerEvents="none" />
                    <Text style={estilos.texto}>{d.texto}</Text>
                  </BlurView>
                </Animated.View>

                {/* 4. El botón: centrado, el último en aparecer, del mismo
                    vidrio "liquid glass" que el panel de arriba. */}
                <Animated.View style={[estilos.zonaBoton, animBoton]}>
                  <Pressable
                    onPress={siguiente}
                    accessibilityRole="button"
                    accessibilityLabel={esUltima ? 'Comenzar' : 'Siguiente'}
                    style={({ pressed }) => [estilos.botonSombra, pressed && estilos.botonPresionado]}
                  >
                    <BlurView intensity={55} tint="dark" style={estilos.botonVidrio}>
                      <View style={estilos.vidrioTinte} pointerEvents="none" />
                      <Text style={estilos.botonTexto}>{esUltima ? 'Comenzar' : 'Siguiente'}</Text>
                      <View style={estilos.botonFlecha}>
                        <Flecha size={16} color="#FFFFFF" />
                      </View>
                    </BlurView>
                  </Pressable>
                </Animated.View>

                <View style={estilos.puntos}>
                  {diapositivas.map((dd, j) => (
                    <Pressable
                      key={dd.clave}
                      onPress={() => irA(j)}
                      hitSlop={10}
                      accessibilityRole="button"
                      accessibilityLabel={`Ir a la diapositiva ${j + 1}`}
                      accessibilityState={{ selected: j === activa }}
                    >
                      <Animated.View style={[estilos.punto, { width: anchosPuntos[j] }]} />
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* La marca arriba a la izquierda y "Saltar" a la derecha, fijos
          mientras se desliza: el "menú" de la landing, en pequeño. */}
      <View pointerEvents="none" style={[estilos.marcaArriba, { top: ALTURA_ESTADO + 8 }]}>
        <MarcaTienda tamano={14} color="#FFFFFF" />
      </View>

      {!esUltima && (
        <Pressable
          onPress={alTerminar}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Saltar la introducción"
          style={[estilos.saltar, { top: ALTURA_ESTADO + 14 }]}
        >
          <Text style={estilos.saltarTexto}>Saltar</Text>
        </Pressable>
      )}
    </View>
  );
};

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scroll: {
    flex: 1,
  },
  marcaDeAgua: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.09,
  },
  // Titular arriba, escena en el medio (ocupa lo que sobra), explicación y
  // botón abajo: `zonaEscena` es el `flex: 1` que reparte el espacio.
  cuerpo: {
    flex: 1,
    paddingHorizontal: 22,
  },
  bloqueTitulo: {
    alignItems: 'center',
  },
  // La etiqueta numerada ("01 LA TIENDA"), calcada de la landing.
  filaEtiqueta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  numeroChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: 'rgba(0,0,0,0.30)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  numeroTexto: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  etiquetaTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.82)',
    letterSpacing: 1.4,
  },
  titulo: {
    marginTop: 10,
    paddingHorizontal: 8,
    fontSize: 27,
    lineHeight: 31,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.8,
    textShadowColor: 'rgba(0,0,0,0.28)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 14,
  },
  zonaEscena: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  // Sombra y radio afuera del BlurView (si el `overflow: hidden` que recorta
  // el desenfoque estuviera aquí, se comería la sombra también).
  panelVidrio: {
    borderRadius: 24,
    elevation: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
  },
  // El propio BlurView: acá sí va `overflow: hidden`, para que el
  // desenfoque respete las esquinas redondas en vez de pintarlas cuadradas.
  vidrio: {
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  // Un lavado blanco muy tenue ENCIMA del desenfoque: sin esto el texto
  // blanco de siempre perdía contraste en las diapositivas de paleta más
  // clara. Con `tint="dark"` el vidrio ya sale oscurecido; este lavado es
  // el brillo que le falta a un vidrio, no el color.
  vidrioTinte: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  texto: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.94)',
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  // El botón: CENTRADO (no estirado a lo ancho) y del mismo vidrio que el
  // panel de arriba.
  zonaBoton: {
    alignItems: 'center',
    marginTop: 16,
  },
  botonSombra: {
    borderRadius: 30,
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
  },
  botonPresionado: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  botonVidrio: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 54,
    paddingHorizontal: 26,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  botonTexto: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  botonFlecha: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  // Los puntos van debajo de todo: son el paginado de toda la pantalla, no
  // un adorno de un panel en particular.
  puntos: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
  },
  punto: {
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  marcaArriba: {
    position: 'absolute',
    left: 22,
  },
  saltar: {
    position: 'absolute',
    right: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  saltarTexto: {
    fontSize: 13.5,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
});

export default Onboarding;
