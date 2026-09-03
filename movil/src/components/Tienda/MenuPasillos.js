/*
 * ============================================================
 * MENÚ DE PASILLOS — la lista de pasillos de la tienda
 * ============================================================
 * Puerto de `frontend/src/components/Store/MenuTienda.jsx`, pero como hoja
 * que sube desde abajo en vez de un dropdown bajo el botón: aquí ya está el
 * patrón probado en ModalProducto/ModalConfirmarEdad (asa que se arrastra,
 * fondo que se aclara), y un dropdown anclado en el botón necesitaría medir
 * dónde quedó ese botón en pantalla — más trabajo para el mismo resultado.
 *
 * Elegir un pasillo NO navega a otra pantalla: solo cambia qué deja ver
 * `productosFiltrados` en TiendaContext, igual que en la web — el carrito y
 * la posición en la tienda no se pierden.
 *
 * Impresiones no aparece en esta lista: pide su propia pantalla (archivo,
 * tamaño, color, páginas) antes de comprar, y esa pantalla todavía no existe
 * en móvil. TiendaContext ya deja `pasillos` filtrado a los de flujo
 * 'estandar' — ver utils/modulos.js.
 * ============================================================
 */

import { useEffect, useRef } from 'react';
import { Animated, Easing, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Store, Check } from 'lucide-react-native';
import { COLORES } from '../../theme/colores';
import { useTema } from '../../context/TemaContext';
import { useBotonAtras } from '../../hooks/useBotonAtras';
import { iconoDeModulo } from '../../utils/modulos';

const Opcion = ({ Icono, texto, activa, colores, onPress }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="menuitem"
    accessibilityState={{ selected: activa }}
    style={({ pressed }) => [
      estilos.opcion,
      activa && { backgroundColor: colores.marcaSuave },
      pressed && !activa && { backgroundColor: COLORES.linea },
    ]}
  >
    <Icono size={18} strokeWidth={2.1} color={activa ? colores.marca : COLORES.textoSuave} />
    <Text style={[estilos.opcionTexto, activa && { color: colores.marca }]} numberOfLines={1}>
      {texto}
    </Text>
    {activa && <Check size={16} strokeWidth={2.6} color={colores.marca} />}
  </Pressable>
);

const MenuPasillos = ({ pasillos, moduloSeleccionado, alElegir, alCerrar }) => {
  const { colores } = useTema();
  const { bottom } = useSafeAreaInsets();

  // La misma entrada y salida que ModalProducto: fondo que se aclara, hoja
  // que sube desde abajo, y al revés al cerrar.
  const fondoOpacidad = useRef(new Animated.Value(0)).current;
  const panelY = useRef(new Animated.Value(300)).current;
  const cerrandoRef = useRef(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fondoOpacidad, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(panelY, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fondoOpacidad, panelY]);

  const cerrarConAnimacion = () => {
    if (cerrandoRef.current) return;
    cerrandoRef.current = true;
    Animated.parallel([
      Animated.timing(fondoOpacidad, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(panelY, {
        toValue: 300,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => alCerrar());
  };

  useBotonAtras(cerrarConAnimacion);

  // El asa se arrastra igual que en ModalProducto: baja con el dedo, y al
  // soltar decide sola si cierra o vuelve a subir, según si pasó la mitad
  // del panel. Ver el comentario largo en ModalProducto.js sobre por qué
  // hace falta onPanResponderTerminationRequest.
  const panelAlturaRef = useRef(0);
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evento, gesto) => Math.abs(gesto.dy) > 4,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_evento, gesto) => {
        if (gesto.dy > 0) panelY.setValue(gesto.dy);
      },
      onPanResponderRelease: (_evento, gesto) => {
        const mitad = (panelAlturaRef.current || 300) / 2;
        if (gesto.dy > mitad) {
          cerrarConAnimacion();
        } else {
          Animated.timing(panelY, {
            toValue: 0,
            duration: 200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.timing(panelY, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      },
    })
  ).current;

  // Elegir cierra el menú: es una sola decisión, no una pantalla para
  // quedarse mirando.
  const elegir = (id) => {
    alElegir(id);
    cerrarConAnimacion();
  };

  return (
    <View style={estilos.capa}>
      <Animated.View style={[estilos.fondo, { opacity: fondoOpacidad }]}>
        <Pressable style={estilos.zonaCierre} onPress={cerrarConAnimacion} accessibilityLabel="Cerrar" />

        <Animated.View
          style={[estilos.panel, { transform: [{ translateY: panelY }] }]}
          onLayout={(e) => { panelAlturaRef.current = e.nativeEvent.layout.height; }}
        >
          <View style={estilos.encabezado}>
            <View style={estilos.zonaAsa} {...panResponder.panHandlers}>
              <View style={estilos.asa} />
            </View>
          </View>

          <Text style={estilos.titulo}>Pasillos de la tienda</Text>

          <ScrollView
            style={estilos.lista}
            contentContainerStyle={{ paddingBottom: Math.max(bottom, 14) }}
            bounces={false}
            showsVerticalScrollIndicator={false}
          >
            <Opcion
              Icono={Store}
              texto="Toda la tienda"
              activa={!moduloSeleccionado}
              colores={colores}
              onPress={() => elegir(null)}
            />

            {pasillos.map((m) => (
              <Opcion
                key={m._id}
                Icono={iconoDeModulo(m)}
                texto={m.name}
                activa={String(moduloSeleccionado) === String(m._id)}
                colores={colores}
                onPress={() => elegir(m._id)}
              />
            ))}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const estilos = StyleSheet.create({
  capa: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 15,
    elevation: 15,
  },
  fondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  zonaCierre: {
    flex: 1,
  },
  panel: {
    backgroundColor: COLORES.fondo,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '75%',
  },
  encabezado: {
    paddingTop: 10,
    alignItems: 'center',
  },
  zonaAsa: {
    paddingVertical: 14,
    paddingHorizontal: 60,
  },
  asa: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORES.borde,
  },
  titulo: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORES.textoTenue,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    paddingHorizontal: 22,
    marginBottom: 6,
  },
  lista: {
    paddingHorizontal: 12,
  },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    minHeight: 48,
  },
  opcionTexto: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORES.tituloFuerte,
  },
});

export default MenuPasillos;
