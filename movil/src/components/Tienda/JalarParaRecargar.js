/*
 * ============================================================
 * JALAR PARA RECARGAR — con Tiqui colgando
 * ============================================================
 * Jalar la lista hacia abajo desde arriba la recarga. En vez del círculo
 * que gira, baja Tiqui colgada de su cordón:
 *
 *   · mientras se jala, baja con el dedo y pone cara de sorpresa (la están
 *     jalando);
 *   · al soltar pasado el punto, pone cara de contenta, sube y desaparece,
 *     y la lista se recarga detrás;
 *   · si se suelta antes, vuelve a subir y no pasa nada.
 *
 * Por qué no el RefreshControl de siempre: en Android no le avisa a nadie
 * cuánto se va jalando, solo cuando ya se soltó, y la cara tiene que
 * cambiar con el dedo. Por eso un gesto de react-native-gesture-handler que
 * corre A LA PAR del desplazamiento de la lista: la lista sigue
 * desplazándose como siempre y el gesto solo cuenta cuando se empezó arriba
 * del todo y hacia abajo.
 *
 * Uso: envuelve la lista y le pasa lo que necesita.
 *   <JalarParaRecargar alRecargar={refrescar}>
 *     {({ alDesplazar }) => <FlatList onScroll={alDesplazar} scrollEventThrottle={16} … />}
 *   </JalarParaRecargar>
 * ============================================================
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import TiquiColgada from '../Tiqui/TiquiColgada';

// Cuánto hay que jalar (ya con la resistencia) para que recargue.
const PUNTO = 88;
// Hasta dónde baja como mucho.
const TOPE = 140;
// El alto de Tiqui colgada, cordón incluido, y cuánto cordón lleva: poco,
// para que al llegar al punto ya se vea entera, sombrero incluido.
const ALTO_TIQUI = 112;
const LARGO_CORDON = 40;

const JalarParaRecargar = ({ alRecargar, children }) => {
  // Cuánto se jaló (lo que baja la lista) y dónde va Tiqui.
  const jalon = useRef(new Animated.Value(0)).current;
  const tiquiY = useRef(new Animated.Value(-ALTO_TIQUI)).current;
  const [cara, setCara] = useState('jalada');
  const [visible, setVisible] = useState(false);

  // Dónde va la lista y si el gesto empezó arriba del todo.
  const desplazado = useRef(0);
  const empezoArriba = useRef(false);
  const recargando = useRef(false);
  const ultimo = useRef(0);

  const alDesplazar = useCallback((e) => {
    desplazado.current = e.nativeEvent.contentOffset.y;
  }, []);

  const recargar = useCallback(async () => {
    recargando.current = true;
    try {
      await alRecargar?.();
    } finally {
      recargando.current = false;
    }
  }, [alRecargar]);

  // La lista vuelve a su lugar y Tiqui sube hasta perderse arriba.
  const soltar = useCallback((alcanzo) => {
    setCara(alcanzo ? 'soltada' : 'normal');
    Animated.parallel([
      Animated.spring(jalon, { toValue: 0, friction: 7, tension: 70, useNativeDriver: true }),
      Animated.timing(tiquiY, {
        toValue: -ALTO_TIQUI - 30,
        // La soltaron contenta: se queda un instante para que se le vea la cara.
        duration: alcanzo ? 560 : 300,
        delay: alcanzo ? 260 : 0,
        easing: Easing.in(Easing.back(1.4)),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setCara('jalada');
    });
    if (alcanzo) recargar();
  }, [jalon, tiquiY, recargar]);

  const gestoNativo = useMemo(() => Gesture.Native(), []);
  const gesto = useMemo(
    () => Gesture.Pan()
      .runOnJS(true)
      // Solo hacia abajo; de lado (los carruseles) no es jalar.
      .activeOffsetY(10)
      .failOffsetY(-10)
      .failOffsetX([-14, 14])
      .simultaneousWithExternalGesture(gestoNativo)
      .onStart(() => {
        empezoArriba.current = desplazado.current <= 1 && !recargando.current;
        ultimo.current = 0;
        if (empezoArriba.current) {
          setCara('jalada');
          setVisible(true);
        }
      })
      .onUpdate((e) => {
        if (!empezoArriba.current) return;
        // Con resistencia: cuanto más se jala, menos baja.
        const d = Math.max(0, e.translationY);
        const baja = Math.min(TOPE, d * 0.6);
        ultimo.current = baja;
        jalon.setValue(baja);
        tiquiY.setValue(baja - ALTO_TIQUI);
      })
      .onEnd(() => {
        if (!empezoArriba.current) return;
        empezoArriba.current = false;
        soltar(ultimo.current >= PUNTO);
      })
      .onFinalize(() => {
        // Si el gesto se canceló a medias, que nada quede colgando.
        if (empezoArriba.current) {
          empezoArriba.current = false;
          soltar(false);
        }
      }),
    [gestoNativo, jalon, tiquiY, soltar]
  );

  return (
    <GestureDetector gesture={gesto}>
      <View
        style={{ flex: 1, overflow: 'hidden' }}
        // Quien usa lector de pantalla no puede jalar: tiene la acción a mano.
        accessibilityActions={[{ name: 'recargar', label: 'Recargar la tienda' }]}
        onAccessibilityAction={(e) => e.nativeEvent.actionName === 'recargar' && recargar()}
      >
        {visible && (
          <Animated.View
            pointerEvents="none"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', zIndex: 2, elevation: 2, transform: [{ translateY: tiquiY }] }}
          >
            <TiquiColgada cara={cara} alto={ALTO_TIQUI} largo={LARGO_CORDON} />
          </Animated.View>
        )}
        <Animated.View style={{ flex: 1, transform: [{ translateY: jalon }] }}>
          <GestureDetector gesture={gestoNativo}>
            {children({
              alDesplazar,
              // Sin el rebote de iOS ni el brillo de Android: el que baja es Tiqui.
              propsLista: { bounces: false, overScrollMode: Platform.OS === 'android' ? 'never' : undefined, scrollEventThrottle: 16 },
            })}
          </GestureDetector>
        </Animated.View>
      </View>
    </GestureDetector>
  );
};

export default JalarParaRecargar;
