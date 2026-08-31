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

import { useCallback, useState } from 'react';
import { Dimensions, LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, UIManager, View } from 'react-native';

// El punto activo se alarga con LayoutAnimation en vez de saltar directo al
// ancho nuevo: es la animación "gratis" de React Native, sin traer
// react-native-reanimated solo para esto. En Android hace falta encenderla a
// mano (en iOS ya viene activa).
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { useTema } from '../../context/TemaContext';
import { etiquetaPromo, textoVencimiento } from '../../utils/promos';
import TarjetaPromo from './TarjetaPromo';

const MARGEN = 16;   // el mismo que el resto de la portada
const SEPARACION = 12;
// Cuánto asoma la siguiente. Es el aviso de que el carrusel sigue.
const ASOMO = 34;

const CarruselPromos = ({ promos, alElegirPromo }) => {
  const { colores } = useTema();
  const [activa, setActiva] = useState(0);
  const [anchoPantalla, setAnchoPantalla] = useState(Dimensions.get('window').width);

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
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setActiva(Math.max(0, Math.min(promos.length - 1, Math.round(x / paso))));
    },
    [paso, promos.length]
  );

  if (promos.length === 0) return null;

  return (
    <View style={estilos.seccion} onLayout={alMedir}>
      <ScrollView
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

        Son indicadores, no controles — por eso no se tocan. En la web sí se
        puede hacer clic, pero ahí el carrusel avanza solo y hace falta poder
        saltar; aquí el dedo ya llega a la tarjeta directamente.
      */}
      {!unaSola && (
        <View style={estilos.puntos}>
          {promos.map((promo, i) => (
            <View
              key={promo._id}
              style={[
                estilos.punto,
                i === activa && [estilos.puntoActivo, { backgroundColor: colores.marcaOscuro }],
              ]}
            />
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
  punto: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D9C7B4',
  },
  // La activa se alarga en vez de solo cambiar de color: se distingue de un
  // vistazo aunque la pantalla esté al sol. El color lo pone la temporada.
  puntoActivo: {
    width: 22,
  },
});

export default CarruselPromos;
