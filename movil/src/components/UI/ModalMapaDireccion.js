/*
 * ============================================================
 * MARCAR LA DIRECCIÓN EN EL MAPA — ModalMapaDireccion.js
 * ============================================================
 * Puerto de `frontend/src/components/Store/MapaDireccion.jsx`: el mapa donde
 * el cliente pone el pin en su portón, con los campos de la dirección
 * debajo. Se usa en los dos mismos lugares que la web — Checkout y Mi
 * cuenta → Direcciones — como una sola hoja compartida, no dos copias.
 *
 * ── Por qué es un WebView con Leaflet, y no react-native-maps ──
 * La web dejó Google Maps por Nominatim/OpenStreetMap: la llave de Google
 * del proyecto ya no sirve (venció el trial) y Maps pide facturación con
 * tarjeta (ver `useUbicacion.js`). `react-native-maps` en Android SIEMPRE
 * dibuja con el motor de Google Maps por debajo — así que hubiera chocado
 * con el mismo problema que ya se evitó en la web. Un WebView que corre la
 * MISMA librería (Leaflet, mismas teselas OSM) no necesita ninguna llave.
 * El HTML que corre adentro está en `mapaLeafletHtml.js`; este archivo solo
 * pone el marco (la hoja, los campos, guardar/cancelar) y escucha los
 * mensajes que manda el mapa.
 *
 * ── Por qué es obligatorio poner el pin ──
 * Sin coordenadas el repartidor sale con un texto y sin saber a qué portón
 * tocar, y el envío no puede cobrarse por distancia. Se puede corregir el
 * TEXTO a mano (Nominatim acierta la calle pero no sabe que es "la casa del
 * portón verde"), pero no se puede guardar sin haber tocado el mapa.
 *
 * ── "Dirección actual" ──
 * Pide el GPS con `expo-location` (permiso de foreground nada más, no hace
 * falta ubicación en segundo plano) y mueve el pin igual que si se hubiera
 * tocado ese punto en el mapa. El mapa vive en el WebView y esto corre en
 * React Native, así que la posición se le manda al revés que un toque
 * normal: por `injectJavaScript`, llamando a `window.marcarPinExterno` (ver
 * mapaLeafletHtml.js) en vez de esperar un mensaje del mapa.
 * ============================================================
 */

import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocateFixed, MapPin } from 'lucide-react-native';
import { COLORES } from '../../theme/colores';
import { useTema } from '../../context/TemaContext';
import { useBotonAtras } from '../../hooks/useBotonAtras';
import { useUbicacion, CENTRO_POR_DEFECTO } from '../../hooks/useUbicacion';
import { crearHtmlMapa } from './mapaLeafletHtml';
import Boton from './Boton';
import CampoTexto from './CampoTexto';
import { AIRE_ABAJO_MINIMO, ALTURA_BARRA_FLOTANTE } from './BarraInferior';

const ALTO_MAPA = 260;

/*
 * `conBarraFlotante`: true solo cuando esta hoja se abre desde una pantalla
 * que vive DENTRO de un apartado del Tab (Mi cuenta → Direcciones) — ahí la
 * píldora de abajo flota por encima y tapa "Guardar esta dirección" si no se
 * le deja hueco. Desde Checkout no hace falta: es una pantalla de Stack que
 * reemplaza el Tab entero, sin píldora detrás. Mismo criterio que
 * `ModalProducto` (ver el comentario grande ahí).
 */
const ModalMapaDireccion = ({ alCerrar, alGuardar, guardando = false, conBarraFlotante = false }) => {
  const { colores } = useTema();
  const { bottom } = useSafeAreaInsets();
  const {
    posicion,
    direccion,
    setDireccion,
    buscando,
    localizando,
    avisoGeocod,
    marcarEn,
    localizarme,
  } = useUbicacion();
  const [nombre, setNombre] = useState('');
  const [referencia, setReferencia] = useState('');
  const webviewRef = useRef(null);

  // Misma entrada/salida animada que ModalProducto y ModalConfirmarEdad.
  const fondoOpacidad = useRef(new Animated.Value(0)).current;
  const panelY = useRef(new Animated.Value(400)).current;
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
        toValue: 400,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => alCerrar());
  };

  useBotonAtras(cerrarConAnimacion);

  const panelAlturaRef = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evento, gesto) => Math.abs(gesto.dy) > 4,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_evento, gesto) => {
        if (gesto.dy > 0) panelY.setValue(gesto.dy);
      },
      onPanResponderRelease: (_evento, gesto) => {
        const mitad = (panelAlturaRef.current || 400) / 2;
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

  // El HTML se arma una sola vez: si se reconstruyera en cada fotograma, el
  // WebView recargaría el mapa entero (y perdería el pin) en cada tecla que
  // se escribe en "Referencia".
  const htmlMapa = useRef(crearHtmlMapa({ colorPin: colores.marca, centro: CENTRO_POR_DEFECTO })).current;

  const alMensajeDelMapa = (evento) => {
    try {
      const { lat, lng } = JSON.parse(evento.nativeEvent.data);
      marcarEn({ lat, lng });
    } catch {
      // Un mensaje que no se puede leer no tira la hoja: el pin simplemente
      // no se movió, y la persona puede volver a tocar el mapa.
    }
  };

  /*
   * Cada vez que cambia la posición —tocando el mapa o con "Dirección
   * actual"— se le avisa al mapa por si acaso. Cuando el cambio vino de un
   * toque dentro del propio mapa esto es un no-op (ya está ahí); cuando vino
   * del GPS es lo único que lo entera de dónde centrarse y poner el pin.
   */
  useEffect(() => {
    if (posicion) {
      webviewRef.current?.injectJavaScript(
        `window.marcarPinExterno(${posicion.lat}, ${posicion.lng}); true;`
      );
    }
  }, [posicion]);

  const listo = !!posicion && direccion.trim().length > 0 && !guardando;

  const guardar = () => {
    if (!listo) return;
    alGuardar({
      nombre: nombre.trim(),
      direccion: direccion.trim(),
      referencia: referencia.trim(),
      lat: posicion.lat,
      lng: posicion.lng,
    });
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

          <ScrollView
            contentContainerStyle={[
              estilos.contenido,
              {
                paddingBottom: conBarraFlotante
                  ? 16 + Math.max(bottom, AIRE_ABAJO_MINIMO) + ALTURA_BARRA_FLOTANTE
                  : Math.max(bottom + 16, 30),
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={estilos.titulo}>Marque su dirección</Text>

            <View style={estilos.marcoMapa}>
              <WebView
                ref={webviewRef}
                originWhitelist={['*']}
                source={{ html: htmlMapa }}
                onMessage={alMensajeDelMapa}
                style={{ height: ALTO_MAPA }}
                javaScriptEnabled
              />

              {/*
                La instrucción va ENCIMA del mapa: debajo, en una pantalla
                chica, queda fuera de la vista y nadie se entera de que hay
                que tocar algo.
              */}
              {!posicion && (
                <View style={estilos.avisoSobreMap}>
                  <Text style={estilos.avisoSobreMapTexto}>Toque en el mapa dónde le dejamos su pedido</Text>
                </View>
              )}
            </View>

            <Pressable
              onPress={localizarme}
              disabled={localizando}
              hitSlop={4}
              style={({ pressed }) => [
                estilos.botonUbicacion,
                { borderColor: colores.marca },
                localizando && estilos.botonUbicacionApagado,
                pressed && !localizando && { backgroundColor: colores.marcaSuave },
              ]}
            >
              {localizando ? (
                <ActivityIndicator size="small" color={colores.marca} />
              ) : (
                <LocateFixed size={15} color={colores.marca} />
              )}
              <Text style={[estilos.textoUbicacion, { color: colores.marca }]}>
                {localizando ? 'Buscando su ubicación…' : 'Dirección actual'}
              </Text>
            </Pressable>

            <CampoTexto
              etiqueta="Dirección"
              icono={MapPin}
              marcador={posicion ? 'Calle, número y colonia' : 'Se llena al marcar en el mapa'}
              valor={direccion}
              alCambiar={setDireccion}
              redondo
            />
            {buscando && (
              <View style={estilos.filaBuscando}>
                <ActivityIndicator size="small" color={COLORES.textoTenue} />
                <Text style={estilos.buscandoTexto}>Buscando la dirección de ese punto…</Text>
              </View>
            )}
            {avisoGeocod ? <Text style={estilos.avisoGeocod}>{avisoGeocod}</Text> : null}

            <CampoTexto
              etiqueta="Nombre (opcional)"
              marcador="Casa, Trabajo…"
              valor={nombre}
              alCambiar={setNombre}
              redondo
            />
            <CampoTexto
              etiqueta="Referencia (opcional)"
              marcador="Portón verde, frente a la cancha"
              valor={referencia}
              alCambiar={setReferencia}
              redondo
            />

            <View style={estilos.filaBotones}>
              <Pressable onPress={cerrarConAnimacion} hitSlop={8} style={estilos.botonCancelar}>
                <Text style={estilos.textoCancelar}>Cancelar</Text>
              </Pressable>
              <View style={estilos.botonGuardar}>
                <Boton
                  texto={posicion ? 'Guardar esta dirección' : 'Marque el punto en el mapa'}
                  alPresionar={guardar}
                  cargando={guardando}
                  deshabilitado={!listo}
                  color={colores.marca}
                  colorPresionado={colores.marcaOscuro}
                  estilo={estilos.botonRedondo}
                />
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const estilos = StyleSheet.create({
  capa: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    elevation: 20,
  },
  fondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  zonaCierre: {
    flex: 1,
  },
  panel: {
    maxHeight: '92%',
    backgroundColor: COLORES.fondo,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
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
  contenido: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  titulo: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORES.tituloFuerte,
    marginBottom: 14,
  },
  marcoMapa: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORES.lineaCard,
    marginBottom: 14,
  },
  avisoSobreMap: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,.94)',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  avisoSobreMapTexto: {
    fontSize: 12.5,
    color: '#5a4a3c',
    textAlign: 'center',
  },
  botonUbicacion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    marginBottom: 14,
  },
  botonUbicacionApagado: {
    opacity: 0.6,
  },
  textoUbicacion: {
    fontSize: 13,
    fontWeight: '700',
  },
  filaBuscando: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -10,
    marginBottom: 12,
  },
  buscandoTexto: {
    fontSize: 12,
    color: COLORES.textoTenue,
  },
  avisoGeocod: {
    fontSize: 12,
    color: COLORES.textoTenue,
    marginTop: -10,
    marginBottom: 12,
  },
  filaBotones: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  botonCancelar: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORES.borde,
  },
  textoCancelar: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORES.textoSuave,
  },
  botonGuardar: {
    flex: 1,
  },
  botonRedondo: {
    borderRadius: 28,
  },
});

export default ModalMapaDireccion;
