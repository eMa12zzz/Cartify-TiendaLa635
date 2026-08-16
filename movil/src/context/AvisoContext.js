/*
 * ============================================================
 * AVISOS — el reemplazo de react-hot-toast
 * ============================================================
 * La tienda web avisa con toasts en media docena de momentos: al agregar algo
 * al carrito, al sacarlo, cuando ya no hay stock, cuando el carrito guardado
 * se corrigió solo. No son adornos — el de agregar, en particular, DICE CUÁNTAS
 * unidades lleva, porque al segundo toque el texto era idéntico y no había
 * forma de saber si el toque había contado.
 *
 * `react-hot-toast` es del navegador y no corre aquí. En vez de traer una
 * librería de toasts para React Native, esto son treinta líneas: un texto que
 * aparece abajo, se queda un momento y se va.
 *
 * Por qué NO se usa el `Alert` de React Native: Alert es modal. Interrumpe,
 * tapa la tienda y hay que darle "OK" para seguir comprando. Avisar que un
 * producto entró al carrito no merece detener a nadie.
 * ============================================================
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { COLORES } from '../theme/colores';

const AvisoContext = createContext(null);

// Cuánto se queda en pantalla. Lo suficiente para leerlo sin que estorbe.
const DURACION = 2600;

export const AvisoProvider = ({ children }) => {
  const [aviso, setAviso] = useState(null); // { texto, tipo }
  const opacidad = useRef(new Animated.Value(0)).current;
  const temporizador = useRef(null);

  const mostrar = useCallback((texto, tipo = 'normal') => {
    if (!texto) return;
    /*
     * Un aviso nuevo pisa al anterior en vez de hacer cola. Quien toca "+"
     * tres veces seguidas quiere ver el último número, no los tres avisos uno
     * tras otro durante ocho segundos.
     */
    if (temporizador.current) clearTimeout(temporizador.current);
    setAviso({ texto, tipo });
  }, []);

  // La animación va aparte del estado: se dispara cuando cambia el aviso, y
  // el temporizador de salida se arma recién cuando terminó de entrar.
  useEffect(() => {
    if (!aviso) return;

    opacidad.setValue(0);
    Animated.timing(opacidad, {
      toValue: 1,
      duration: 160,
      useNativeDriver: true,
    }).start();

    temporizador.current = setTimeout(() => {
      Animated.timing(opacidad, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(({ finished }) => {
        // Solo se desmonta si la salida llegó al final: si en medio del
        // desvanecido entró otro aviso, este callback no debe borrarlo.
        if (finished) setAviso(null);
      });
    }, DURACION);

    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, [aviso, opacidad]);

  return (
    <AvisoContext.Provider value={{ avisar: mostrar }}>
      {children}
      {aviso && (
        <Animated.View
          pointerEvents="none"
          style={[estilos.capa, { opacity: opacidad }]}
        >
          <View style={[estilos.burbuja, aviso.tipo === 'error' && estilos.burbujaError]}>
            <Text style={estilos.texto}>{aviso.texto}</Text>
          </View>
        </Animated.View>
      )}
    </AvisoContext.Provider>
  );
};

export const useAviso = () => {
  const ctx = useContext(AvisoContext);
  if (!ctx) throw new Error('useAviso debe usarse dentro de <AvisoProvider>');
  return ctx;
};

const estilos = StyleSheet.create({
  /*
   * `pointerEvents="none"` en la capa es lo que evita el peor error de este
   * patrón: un aviso invisible que se queda encima de la tienda comiéndose los
   * toques. Aquí nunca recibe ninguno.
   */
  capa: {
    position: 'absolute',
    left: 0,
    right: 0,
    // Arriba de la barra de abajo del carrito, que mide unos 88.
    bottom: 104,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  burbuja: {
    backgroundColor: COLORES.tituloFuerte,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 22,
    maxWidth: '100%',
  },
  burbujaError: {
    backgroundColor: COLORES.error,
  },
  texto: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '600',
    textAlign: 'center',
  },
});
