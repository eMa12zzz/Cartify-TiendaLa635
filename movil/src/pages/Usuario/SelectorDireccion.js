import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { clientColors as c, ui } from '../../theme/Usuario/clientColors';
import { useDireccionCtx } from '../../context/Usuario/DireccionContext';
import { aviso } from '../../utils/aviso';
import { direccionDesdeCoords, CENTRO_POR_DEFECTO } from '../../utils/geo';
import MapaLeaflet from '../../components/Usuario/MapaLeaflet';

/*
 * SelectorDireccion — "¿A dónde te lo llevamos?": marcar la dirección de
 * entrega en el mapa. Puerto de la Bienvenida de la web
 * (`frontend/src/pages/Bienvenida.jsx`): el MISMO diseño —mapa a pantalla
 * completa detrás de todo, un velo oscuro para que el saludo blanco se lea, el
 * saludo arriba y una tarjeta blanca flotante abajo con los campos.
 *
 * El mapa es Leaflet real (MapaLeaflet, dentro de un WebView) con las mismas
 * tiles de OSM y el mismo pin que la web. La dirección escrita sale de
 * Nominatim, también igual que el frontend.
 */
const CENTRO = CENTRO_POR_DEFECTO;

export default function SelectorDireccion({ navigation }) {
  const { activa, guardar } = useDireccionCtx();
  const [coord, setCoord] = useState(activa?.lat != null ? { latitude: activa.lat, longitude: activa.lng } : null);
  const [nombre, setNombre] = useState(activa?.nombre || '');
  const [direccion, setDireccion] = useState(activa?.direccion || '');
  const [referencia, setReferencia] = useState(activa?.referencia || '');
  const [localizando, setLocalizando] = useState(false);
  const [buscando, setBuscando] = useState(false);

  // Coordenadas → dirección con Nominatim (OSM), igual que la web.
  const leerDireccion = async ({ latitude, longitude }) => {
    setBuscando(true);
    try {
      const texto = await direccionDesdeCoords(latitude, longitude);
      if (texto) setDireccion(texto);
    } catch {
      /* sin conexión: se escribe a mano */
    } finally {
      setBuscando(false);
    }
  };

  const marcarEn = (c2) => { setCoord(c2); leerDireccion(c2); };

  const localizarme = async () => {
    setLocalizando(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { aviso('No nos dio permiso de ubicarlo. Puede mover el pin.'); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      marcarEn({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    } catch {
      aviso('No pudimos ubicarlo. Pruebe moviendo el pin.');
    } finally {
      setLocalizando(false);
    }
  };

  const confirmar = () => {
    if (!direccion.trim()) { aviso('Marca o escribe tu dirección de entrega'); return; }
    guardar({
      nombre: nombre.trim(), direccion: direccion.trim(), referencia: referencia.trim(),
      lat: coord?.latitude ?? null, lng: coord?.longitude ?? null,
    });
    navigation.navigate('tienda');
  };

  const omitir = () => navigation.navigate('tienda');

  return (
    <View style={styles.container}>
      {/* Mapa a pantalla completa, detrás de todo. */}
      <View style={StyleSheet.absoluteFill}>
        <MapaLeaflet centro={CENTRO} coord={coord} onMove={marcarEn} />
      </View>

      {/*
       * Velo: oscurece el mapa arriba para que el saludo blanco se lea, y se
       * desvanece hacia el centro. No recibe toques (pointerEvents none), así
       * que se puede tocar el mapa a través de él.
       */}
      <LinearGradient
        colors={['rgba(28,18,10,0.86)', 'rgba(28,18,10,0.35)', 'rgba(28,18,10,0)']}
        locations={[0, 0.45, 0.75]}
        style={styles.velo}
        pointerEvents="none"
      />

      {/*
       * Capa de contenido. box-none deja pasar los toques al mapa en los huecos
       * y solo captura los del saludo (Omitir) y la tarjeta.
       */}
      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']} pointerEvents="box-none">
        {/* ── Saludo, arriba ── */}
        <View style={styles.saludo} pointerEvents="box-none">
          <View style={{ flex: 1 }} pointerEvents="none">
            <Text style={styles.marca}>TIENDA LA 635</Text>
            <Text style={styles.titulo}>¿A dónde te lo llevamos?</Text>
            <Text style={styles.bajada}>Toque el mapa para marcar el punto o use su ubicación.</Text>
          </View>
          <TouchableOpacity onPress={omitir} hitSlop={8} style={styles.omitirBtn}>
            <Text style={styles.omitirText}>Omitir</Text>
          </TouchableOpacity>
        </View>

        {/* ── Tarjeta flotante, abajo ── */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          pointerEvents="box-none"
        >
          <View style={styles.tarjeta}>
            <Text style={styles.label}>Su dirección de entrega</Text>
            <View style={styles.campo}>
              <TextInput
                style={styles.campoInput}
                value={direccion}
                onChangeText={setDireccion}
                placeholder={buscando ? 'Buscando la dirección…' : 'Ej. Calle Los Almendros #12, San Salvador'}
                placeholderTextColor={c.textMuted}
                multiline
              />
              {buscando && <ActivityIndicator size="small" color={c.primary} />}
            </View>

            <TouchableOpacity style={styles.ubicBtn} onPress={localizarme} disabled={localizando}>
              {localizando
                ? <ActivityIndicator size="small" color={c.primary} />
                : <Text style={styles.ubicBtnText}>Usar mi ubicación</Text>}
            </TouchableOpacity>

            <View style={styles.dos}>
              <View style={styles.col}>
                <Text style={styles.labelChica}>Nombre</Text>
                <View style={styles.campo}>
                  <TextInput
                    style={styles.campoInput}
                    value={nombre}
                    onChangeText={setNombre}
                    maxLength={30}
                    placeholder="Casa, Trabajo…"
                    placeholderTextColor={c.textMuted}
                  />
                </View>
              </View>
              <View style={styles.col}>
                <Text style={styles.labelChica}>Referencia</Text>
                <View style={styles.campo}>
                  <TextInput
                    style={styles.campoInput}
                    value={referencia}
                    onChangeText={setReferencia}
                    maxLength={80}
                    placeholder="Portón verde…"
                    placeholderTextColor={c.textMuted}
                  />
                </View>
              </View>
            </View>

            <View style={styles.fila}>
              <TouchableOpacity style={[styles.boton, styles.botonGris]} onPress={omitir}>
                <Text style={styles.botonGrisText}>Omitir por ahora</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.boton, styles.botonPrimario]} onPress={confirmar}>
                <Text style={styles.botonPrimarioText}>Usar esta dirección</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e8e8e8' },

  velo: { position: 'absolute', top: 0, left: 0, right: 0, height: '60%' },

  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },

  // ── Saludo ──
  saludo: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  marca: {
    fontSize: 11, letterSpacing: 2.5, color: 'rgba(255,255,255,0.8)',
    fontWeight: ui.weight.bold, marginBottom: 6,
  },
  titulo: {
    fontSize: 26, fontWeight: ui.weight.extrabold, color: '#fff',
    letterSpacing: -0.4, marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 12,
  },
  bajada: { fontSize: 13.5, lineHeight: 20, color: 'rgba(255,255,255,0.92)' },
  omitirBtn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: ui.radius.full,
  },
  omitirText: { color: '#fff', fontWeight: ui.weight.semibold, fontSize: ui.size.sm },

  // ── Tarjeta ──
  tarjeta: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 24, shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  label: { fontSize: ui.size.xs, fontWeight: ui.weight.bold, color: c.textSecondary, marginBottom: 7 },
  labelChica: { fontSize: 11, fontWeight: ui.weight.bold, color: c.textSecondary, marginBottom: 6 },

  campo: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: c.cardBorder, borderRadius: 14,
    paddingHorizontal: 12, backgroundColor: '#fff',
  },
  campoIcono: { fontSize: 15 },
  campoInput: {
    flex: 1, paddingVertical: 12, fontSize: ui.size.sm, color: c.textPrimary,
  },

  ubicBtn: {
    marginTop: 12, borderWidth: 1, borderColor: c.primary, borderStyle: 'dashed',
    borderRadius: ui.radius.full, paddingVertical: 11, alignItems: 'center',
    backgroundColor: c.primaryLight,
  },
  ubicBtnText: { color: c.primary, fontWeight: ui.weight.semibold, fontSize: ui.size.sm },

  dos: { flexDirection: 'row', gap: 10, marginTop: 14 },
  col: { flex: 1 },

  fila: { flexDirection: 'row', gap: 10, marginTop: 16 },
  boton: { flex: 1, borderRadius: ui.radius.full, paddingVertical: 14, alignItems: 'center' },
  botonGris: { borderWidth: 1, borderColor: c.cardBorder, backgroundColor: '#fff' },
  botonGrisText: { color: c.textSecondary, fontWeight: ui.weight.bold, fontSize: ui.size.sm },
  botonPrimario: { backgroundColor: c.primary },
  botonPrimarioText: { color: '#fff', fontWeight: ui.weight.bold, fontSize: ui.size.sm },
});
