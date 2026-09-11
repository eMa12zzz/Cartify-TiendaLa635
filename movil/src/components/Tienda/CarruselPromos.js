/*
 * ============================================================
 * CARRUSEL DE PROMOCIONES
 * ============================================================
 * Las promociones anunciadas, una al lado de otra, deslizables con el dedo.
 *
 * ── Por qué NO es el carrusel 3D de la web ──
 *
 * En la web las tarjetas viven en un anillo: la del centro de frente y las de
 * los lados giradas hacia adentro, como los discos de una rocola. Eso son
 * `perspective`, `rotateY`, `translateZ` y máscaras de degradado, animadas con
 * framer-motion. React Native no tiene ninguna de las dos cosas: el 3D real
 * necesitaría react-native-reanimated y las máscaras, otra librería más.
 *
 * Lo que sí se conserva es para qué existía ese anillo: que se vea que hay
 * MÁS de una promoción. Aquí lo hace el asomo de la siguiente por la derecha
 * —la tarjeta no ocupa todo el ancho a propósito— más los puntos de abajo.
 * Un carrusel donde la tarjeta llena la pantalla se lee como una sola imagen
 * fija y nadie desliza.
 *
 * El deslizamiento se detiene siempre alineado (`snapToInterval`), no a media
 * tarjeta: media promoción cortada se ve como un error de dibujo.
 * ============================================================
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTema } from '../../context/TemaContext';
import { etiquetaPromo, textoVencimiento } from '../../utils/promos';
import TarjetaPromo from './TarjetaPromo';

const MARGEN = 16;   // el mismo que el resto de la portada
const SEPARACION = 12;
// Cuánto asoma la siguiente. Es el aviso de que el carrusel sigue.
const ASOMO = 34;

// Ancho del punto en reposo y de la píldora activa.
const ANCHO_PUNTO = 8;
const ANCHO_PILDORA = 22;

const CarruselPromos = ({ promos, alElegirPromo }) => {
  const { colores } = useTema();
  const [activa, setActiva] = useState(0);
  const [anchoPantalla, setAnchoPantalla] = useState(Dimensions.get('window').width);
  const scrollRef = useRef(null);

  const unaSola = promos.length === 1;
  /*
   * Con una sola promoción no hay nada que asomar, así que ocupa el ancho
   * entero: dejarle el hueco del asomo la haría ver descentrada.
   */
  const anchoTarjeta = anchoPantalla - MARGEN * 2 - (unaSola ? 0 : ASOMO);
  const paso = anchoTarjeta + SEPARACION;

  /*
   * El ancho se relee al rotar el teléfono. Dimensions.get() se evalúa una vez
   * y se queda con el valor del arranque: sin esto, en horizontal las tarjetas
   * seguían midiendo lo de vertical y el snap paraba en cualquier lado.
   */
  const alMedir = useCallback((e) => setAnchoPantalla(e.nativeEvent.layout.width), []);

  const alTerminarDeDeslizar = useCallback(
    (e) => {
      const x = e.nativeEvent.contentOffset.x;
      setActiva(Math.max(0, Math.min(promos.length - 1, Math.round(x / paso))));
    },
    [paso, promos.length]
  );

  /*
   * Saltar a una promoción desde su punto. La marca activa se actualiza al
   * toque —no hay que esperar a que el scroll termine para ver cuál se
   * eligió— y el scroll la sigue.
   */
  const irA = useCallback(
    (i) => {
      setActiva(i);
      scrollRef.current?.scrollTo({ x: i * paso, animated: true });
    },
    [paso]
  );

  /*
   * El ancho de cada punto, animado con Animated en vez de LayoutAnimation:
   * esta última no se anima de forma confiable con la New Architecture
   * encendida en Android (app.json trae newArchEnabled), que es la misma
   * razón por la que el resto de la app (Asistente.js, AvisoContext.js) ya
   * usa Animated y no LayoutAnimation para esto.
   *
   * Va con `useNativeDriver: false` a propósito, aunque pierda algún frame:
   * el ancho es lo único que dibuja bien las puntas redondeadas de la
   * píldora en cualquier tamaño intermedio. Animar con `transform: scaleX`
   * corre en el hilo nativo y no tiembla, pero el `borderRadius` no se
   * escala junto con el transform —se estira igual que el resto de la
   * caja— y la píldora terminaba con las puntas ovaladas en vez de
   * redondas. Entre una animación perfecta y una forma correcta, gana la
   * forma.
   */
  const anchosPuntos = useRef([]).current;
  if (anchosPuntos.length !== promos.length) {
    anchosPuntos.length = 0;
    promos.forEach((_, i) => anchosPuntos.push(new Animated.Value(i === activa ? ANCHO_PILDORA : ANCHO_PUNTO)));
  }

  useEffect(() => {
    const animaciones = anchosPuntos.map((valor, i) =>
      Animated.timing(valor, {
        toValue: i === activa ? ANCHO_PILDORA : ANCHO_PUNTO,
        duration: 220,
        useNativeDriver: false,
      })
    );
    Animated.parallel(animaciones).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activa]);

  if (promos.length === 0) return null;

  return (
    <View style={estilos.seccion} onLayout={alMedir}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={paso}
        decelerationRate="fast"
        disableIntervalMomentum
        onMomentumScrollEnd={alTerminarDeDeslizar}
        contentContainerStyle={{ paddingHorizontal: MARGEN, gap: SEPARACION }}
        // Sin más de una, deslizar no lleva a ningún lado.
        scrollEnabled={!unaSola}
      >
        {promos.map((promo) => (
          <Pressable
            key={promo._id}
            onPress={() => alElegirPromo(promo)}
            accessibilityRole="button"
            accessibilityLabel={`Ver los productos de ${promo.title || 'esta promoción'}`}
            style={({ pressed }) => pressed && estilos.presionada}
          >
            <TarjetaPromo
              promo={promo}
              etiqueta={etiquetaPromo(promo)}
              vencimiento={textoVencimiento(promo)}
              ancho={anchoTarjeta}
            />
          </Pressable>
        ))}
      </ScrollView>

      {/*
        Los puntos. Solo tienen sentido si hay más de una: con una sola, un
        punto suelto abajo parece un adorno sin explicación.

        Se ven de 8px pero se tocan de bastante más (hitSlop): igual que en
        la web, donde el botón es alto y transparente y adentro va la rayita.
      */}
      {!unaSola && (
        <View style={estilos.puntos}>
          {promos.map((promo, i) => (
            <Pressable
              key={promo._id}
              onPress={() => irA(i)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={`Ir a la promoción ${i + 1}`}
              accessibilityState={{ selected: i === activa }}
            >
              <Animated.View
                style={[
                  estilos.punto,
                  { width: anchosPuntos[i] },
                  i === activa && { backgroundColor: colores.marcaOscuro },
                ]}
              />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
};

const estilos = StyleSheet.create({
  seccion: {
    paddingTop: 6,
    paddingBottom: 4,
  },
  presionada: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  puntos: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: 12,
  },
  // El ancho real (8 u 22) lo pone anchosPuntos, animado; height/radius se
  // quedan fijos porque redondear un alto que no cambia no hacía falta.
  punto: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D9C7B4',
  },
});

export default CarruselPromos;
