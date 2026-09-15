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
 * ── La animación: cuatro cosas entran EN ORDEN, no todas juntas ──
 * Al llegar a una diapositiva (por swipe o por el botón) entra, en fila:
 *   1. El ícono gigante de marca de agua y el círculo de arriba — estos ya
 *      están apareciendo desde que el dedo va deslizando (van con el scroll,
 *      `scrollX`), así que son lo primero que se alcanza a ver.
 *   2. El panel de "demostración": un cuadro que sube desde abajo con el
 *      nombre de la pantalla arriba y, debajo, un ícono grande a modo de
 *      ilustración de lo que se explica (la tienda no tiene fotos propias —
 *      ver más abajo — así que el ícono hace ese trabajo).
 *   3. El panel de información (la descripción), que entra después,
 *      también de abajo hacia arriba.
 *   4. El botón para seguir, centrado, el último en aparecer.
 * Los tres últimos comparten un solo `Animated.Value` por diapositiva
 * (`entradas[i]`, de 0 a 1) y cada uno mira una tajada distinta de ese mismo
 * recorrido — así entran en cascada sin necesitar tres animaciones sueltas
 * que se puedan desincronizar entre sí.
 *
 * ── "Liquid glass": vidrio de verdad, con `expo-blur` ──
 * El panel de demostración, el de información y el botón son vidrio
 * esmerilado real (`BlurView`, `tint="dark"`) y no una simple transparencia:
 * se ve el degradado de fondo desenfocado detrás, como pidió el ejemplo.
 * Encima del desenfoque va un lavado blanco muy tenue (10-14%) para que el
 * texto blanco de siempre mantenga contraste sin importar qué tan clara o
 * oscura salga la paleta de temporada debajo.
 *
 * ── De dónde sale el "look", y por qué no es un onboarding genérico ──
 * Lo que tiene cara de "esta tienda" ya existe en dos lugares y se reutiliza
 * tal cual, no se inventa de nuevo:
 *
 *   1. El ícono de marca de agua GIGANTE y tenue detrás del contenido: es
 *      la misma idea de TarjetaPromo.js (`marcaDeAgua`, 31% del ancho de la
 *      tarjeta al 17% de opacidad) — aquí a pantalla completa.
 *   2. El degradado de tres paradas [marca, acento, marcaOscuro] con
 *      `locations={[0, 0.55, 1]}`: es EXACTAMENTE el de la tarjeta de saldo
 *      en pages/cuenta/Puntos.js, no una paleta inventada para esta pantalla.
 *   3. La flechita del botón es `Flecha` de components/UI/Iconos.js — la
 *      misma que trae cada tarjeta de promoción en su esquina — y no un
 *      ícono de lucide cualquiera.
 *
 * ── Por qué el logo Y un ícono en la primera diapositiva ──
 * `MarcaTienda` es la MISMA marca que el encabezado y el login: la primera
 * cara que ve alguien nuevo tiene que ser reconocible como la marca de la
 * tienda. El ícono de tienda gigante de fondo es puro ambiente, igual que
 * en las demás diapositivas.
 *
 * ── De dónde sale el texto ──
 * "Siga su pedido en el mapa" y la de puntos/favoritos son el mismo texto
 * (casi palabra por palabra) de las Ventajas en `frontend/src/pages/
 * LoginClient.jsx` — no se inventó una promesa nueva, se repitió la que la
 * tienda ya le hace a quien entra por la web.
 *
 * ── Por qué el panel de "demostración" es un ícono y no una foto o video ──
 * La tienda no tiene banco de fotografías propio (ver el porqué de que
 * `Iconos.js` dibuje todo a mano: no atar la tienda a un set que no es
 * suyo), y un producto al azar del catálogo no es una "foto de bienvenida":
 * depende de la red y puede no haber cargado todavía la primera vez que se
 * abre la app, sin sesión garantizada. Un video pediría una dependencia
 * nueva (expo-video/expo-av) que no hacía falta: el mismo ícono de la
 * diapositiva, grande y dentro de su propio vidrio, cuenta la misma idea sin
 * depender de nada que pueda no llegar a tiempo.
 * ============================================================
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Bike, Mic, Star, Store } from 'lucide-react-native';
import { ALTURA_ESTADO } from '../theme/pantalla';
import { useTema } from '../context/TemaContext';
import { useBotonAtras } from '../hooks/useBotonAtras';
import MarcaTienda from '../components/UI/MarcaTienda';
import { Flecha } from '../components/UI/Iconos';

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

const diapositivasDe = (colores) => [
  {
    clave: 'bienvenida',
    ...degradadoDe(colores, ['marca', 'acento', 'marcaOscuro']),
    IconoFondo: Store,
    marca: true,
    titulo: 'El súper de la esquina, a un toque',
    texto: 'Compre desde el celular y reciba en su puerta, o pase a recogerlo usted mismo.',
  },
  {
    clave: 'voz',
    ...degradadoDe(colores, ['marcaClaro', 'marca', 'acento']),
    Icono: Mic,
    titulo: 'Pida hablando',
    texto: 'Dígale a nuestro asistente qué necesita y arme su pedido sin escribir ni un producto.',
  },
  {
    clave: 'mapa',
    ...degradadoDe(colores, ['acento', 'marca', 'marcaOscuro']),
    Icono: Bike,
    titulo: 'Siga su pedido en el mapa',
    texto: 'Vea al repartidor acercarse y sepa cuándo salir a la puerta.',
  },
  {
    clave: 'puntos',
    ...degradadoDe(colores, ['marcaOscuro', 'acento', 'marcaClaro']),
    Icono: Star,
    titulo: 'Junte puntos con cada compra',
    texto: 'Se convierten en descuento la próxima vez. Y lo que marque con el corazón no se le vuelve a perder.',
  },
];

// Una tajada del recorrido 0→1 de `valor` se vuelve opacidad + un empuje
// desde abajo — la misma receta para los tres paneles que entran en
// cascada, solo cambia EN QUÉ TRAMO del recorrido le toca a cada uno.
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

const Onboarding = ({ alTerminar }) => {
  const { colores } = useTema();
  const insets = useSafeAreaInsets();

  const diapositivas = diapositivasDe(colores);

  const [ancho, setAncho] = useState(Dimensions.get('window').width);
  // Un ScrollView horizontal NO estira solo a sus hijos al alto disponible
  // (el alto de cada `View` de una diapositiva sale de su CONTENIDO, no del
  // contenedor) — sin este número puesto a mano, el degradado de cada
  // diapositiva se cortaba donde terminaba el contenido y dejaba el resto
  // de la pantalla en negro, el color de `estilos.pantalla` de más abajo.
  const [alto, setAlto] = useState(Dimensions.get('window').height);
  const [activa, setActiva] = useState(0);
  const scrollRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // El ancho (y el alto) reales, no los del arranque: igual que
  // CarruselPromos.js, para que una rotación de pantalla no deje el
  // "paginado" midiendo otra cosa.
  const alMedir = useCallback((e) => {
    setAncho(e.nativeEvent.layout.width);
    setAlto(e.nativeEvent.layout.height);
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

  // El anillo que respira detrás del ícono: mismo espíritu que el puntito
  // verde de BurbujaPedido.js, pero de anillo entero porque aquí sí hay
  // sitio de sobra para notarlo.
  const pulso = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const bucle = Animated.loop(
      Animated.timing(pulso, {
        toValue: 1,
        duration: 2200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    );
    bucle.start();
    return () => bucle.stop();
  }, [pulso]);

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
    entradas.forEach((valor, i) => {
      valor.setValue(0);
      if (i === activa) {
        Animated.timing(valor, {
          toValue: 1,
          duration: 950,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activa]);

  /*
   * Los puntos: MISMA píldora animada de CarruselPromos.js. Se dibujan una
   * vez POR diapositiva (viven dentro del panel que viaja con el scroll),
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
        del ícono y la marca de agua (`scrollX` de abajo) corre por JS
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
          // La entrada y salida del ícono y la marca de agua siguen el
          // propio deslizamiento: no hace falta disparar una animación a
          // mano cuando cambia `activa`, el `scrollX` ya se mueve al mismo
          // ritmo que el dedo. El resto del contenido (más abajo) usa en
          // cambio `entradas[i]`, la cascada por tiempo.
          const rango = [(i - 1) * ancho, i * ancho, (i + 1) * ancho];
          const opacidadIcono = scrollX.interpolate({ inputRange: rango, outputRange: [0, 1, 0], extrapolate: 'clamp' });
          const escalaIcono = scrollX.interpolate({ inputRange: rango, outputRange: [0.9, 1, 0.9], extrapolate: 'clamp' });
          // La marca de agua se mueve MÁS despacio que el resto (la mitad
          // del recorrido): se queda "flotando" atrás en vez de entrar en
          // bloque con todo lo demás, un ligerísimo paralaje.
          const paralaje = scrollX.interpolate({ inputRange: rango, outputRange: [ancho * 0.2, 0, -ancho * 0.2], extrapolate: 'clamp' });
          const IconoAgua = d.IconoFondo || d.Icono;
          const IconoDemo = d.Icono || d.IconoFondo;

          // Las tres tajadas de la cascada de ESTA diapositiva: demo → info
          // → botón, encimadas a propósito (cada una empieza antes de que
          // la anterior termine) para que se sienta continua y no tres
          // golpes sueltos.
          const animDemo = tramo(entradas[i], 0, 0.42);
          const animInfo = tramo(entradas[i], 0.32, 0.72);
          const animBoton = tramo(entradas[i], 0.62, 1);

          return (
            <View key={d.clave} style={{ width: ancho, height: alto }}>
              <LinearGradient
                colors={d.colors}
                locations={d.locations}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />

              {/*
                La marca de agua: el mismo truco de TarjetaPromo.js
                (`marcaDeAgua`), un ícono enorme y casi invisible detrás de
                todo — hace las veces de la "foto" que un onboarding con
                fotografía pondría en la mitad de arriba, que acá se deja
                sin nada más encima para que respire.
              */}
              <Animated.View
                pointerEvents="none"
                style={[estilos.marcaDeAgua, { transform: [{ translateX: paralaje }] }]}
              >
                <IconoAgua size={ancho * 1.05} color="#FFFFFF" strokeWidth={0.8} />
              </Animated.View>

              {/*
                `justifyContent: 'flex-end'` en `estilos.cuerpo` es lo que
                empuja todo este bloque hacia abajo y deja la mitad de
                arriba solo para el fondo — igual que un onboarding con foto
                a pantalla completa le deja ese espacio a la foto.
              */}
              <View
                style={[
                  estilos.cuerpo,
                  { paddingTop: ALTURA_ESTADO, paddingBottom: Math.max(insets.bottom, 16) },
                ]}
              >
                {/* 1. El ícono gigante: lo primero que se alcanza a ver, ya
                    entrando con el propio deslizamiento del dedo. */}
                <Animated.View style={{ opacity: opacidadIcono, transform: [{ scale: escalaIcono }] }}>
                  <View style={estilos.iconoZona}>
                    <Animated.View
                      style={[
                        estilos.anilloPulso,
                        {
                          opacity: pulso.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
                          transform: [{ scale: pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) }],
                        },
                      ]}
                    />
                    <View style={estilos.iconoCirculo}>
                      {d.marca ? (
                        <MarcaTienda tamano={15} alto={30} color="#FFFFFF" centrado />
                      ) : (
                        <d.Icono size={28} color="#FFFFFF" strokeWidth={1.8} />
                      )}
                    </View>
                  </View>
                </Animated.View>

                {/* 2. El panel de "demostración": sube desde abajo, con el
                    nombre de la pantalla arriba y un ícono grande debajo
                    haciendo de imagen — vidrio de verdad con BlurView. */}
                <Animated.View style={[estilos.panelVidrio, estilos.panelDemo, animDemo]}>
                  <BlurView intensity={46} tint="dark" style={estilos.vidrio}>
                    <View style={estilos.vidrioTinte} pointerEvents="none" />
                    <Text style={estilos.tituloDemo}>{d.titulo}</Text>
                    <View style={estilos.demoInsignia}>
                      <IconoDemo size={34} color="#FFFFFF" strokeWidth={1.6} />
                    </View>
                  </BlurView>
                </Animated.View>

                {/* 3. El panel de información: la descripción, entra
                    después del panel de demostración, también de abajo
                    hacia arriba. Mismo formato de vidrio. */}
                <Animated.View style={[estilos.panelVidrio, estilos.panelInfo, animInfo]}>
                  <BlurView intensity={34} tint="dark" style={estilos.vidrio}>
                    <View style={estilos.vidrioTinte} pointerEvents="none" />
                    <Text style={estilos.texto}>{d.texto}</Text>
                  </BlurView>
                </Animated.View>

                {/* 4. El botón: centrado, el último en aparecer, mismo
                    vidrio "liquid glass" que los paneles de arriba. */}
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
    opacity: 0.1,
  },
  // La mitad de arriba se le deja al fondo: `justifyContent: 'flex-end'` es
  // lo que hace que el bloque de ícono+paneles+botón+puntos caiga hacia
  // abajo en vez de quedar centrado a media pantalla.
  cuerpo: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 22,
  },
  iconoZona: {
    width: 76,
    height: 76,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    // Se mete un poco DENTRO del panel de demostración (margen negativo): en
    // el ejemplo el ícono está pegado al borde de arriba de la hoja, no
    // flotando aparte con un hueco en medio.
    marginBottom: -20,
    zIndex: 1,
  },
  anilloPulso: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  iconoCirculo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    // Si la tienda tiene logo subido, MarcaTienda pinta una imagen (no las
    // dos líneas de texto) y esa imagen es más ancha que este círculo —
    // recortado en vez de desbordado.
    overflow: 'hidden',
  },
  // Base común de los dos paneles de vidrio: la sombra y el radio viven
  // AFUERA del BlurView (si el `overflow: hidden` que recorta el desenfoque
  // fuera aquí, se comería la sombra también).
  panelVidrio: {
    borderRadius: 26,
    elevation: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
  },
  panelDemo: {
    // Nada de margen: el hueco con el panel de información lo pone ese
    // panel (`marginTop`), para no duplicar el número en dos lados.
  },
  panelInfo: {
    marginTop: 10,
  },
  // El propio BlurView: acá sí va `overflow: hidden`, para que el
  // desenfoque respete las esquinas redondas en vez de pintarlas cuadradas.
  vidrio: {
    borderRadius: 26,
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
  tituloDemo: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginTop: 30,
    marginBottom: 16,
    paddingHorizontal: 18,
  },
  // El "ícono grande" que hace de imagen/video de demostración.
  demoInsignia: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 28,
  },
  texto: {
    fontSize: 13.5,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  // El botón: CENTRADO (no estirado a lo ancho como antes) y del mismo
  // vidrio que los paneles de arriba.
  zonaBoton: {
    alignItems: 'center',
    marginTop: 18,
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
  // Los puntos van debajo de todo, igual que en el ejemplo: son el
  // paginado de toda la pantalla, no un adorno de un panel en particular.
  puntos: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
  },
  punto: {
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
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
