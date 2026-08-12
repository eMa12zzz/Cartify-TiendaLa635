import { useState } from 'react';
import {
  ScrollView, View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { clientColors as c, ui } from '../../theme/Usuario/clientColors';
import { useDireccionCtx } from '../../context/Usuario/DireccionContext';
import { aviso } from '../../utils/aviso';
import { direccionDesdeCoords, CENTRO_POR_DEFECTO } from '../../utils/geo';
import MapaLeaflet from '../../components/Usuario/MapaLeaflet';

/*
 * SelectorDireccion — "¿A dónde te lo llevamos?": marcar la dirección de
 * entrega en el mapa. Puerto de `frontend/src/components/Store/SelectorDireccion.jsx`
 * + la Bienvenida con mapa. Se muestra al iniciar (si aún no hay dirección) y
 * desde el encabezado de la tienda para cambiarla.
 *
 * El mapa es Leaflet real (MapaLeaflet, dentro de un WebView) — el MISMO de la
 * web, con las mismas tiles de OSM y el mismo pin. La dirección escrita sale de
 * Nominatim, igual que en el frontend.
 */
const CENTRO = CENTRO_POR_DEFECTO;

export default function SelectorDireccion({ navigation }) {
  const { activa, guardar } = useDireccionCtx();
  const [coord, setCoord] = useState(activa?.lat != null ? { latitude: activa.lat, longitude: activa.lng } : null);
  const [nombre, setNombre] = useState(activa?.nombre || '');
  const [direccion, setDireccion] = useState(activa?.direccion || '');
  const [referencia, setReferencia] = useState(activa?.referencia || '');
  const [localizando, setLocalizando] = useState(false);

  // Coordenadas → dirección con Nominatim (OSM), igual que la web.
  const leerDireccion = async ({ latitude, longitude }) => {
    try {
      const texto = await direccionDesdeCoords(latitude, longitude);
      if (texto) setDireccion(texto);
    } catch { /* sin conexión: se escribe a mano */ }
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.head}>
        <Text style={styles.title}>¿A dónde te lo llevamos?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('tienda')}>
          <Text style={styles.omitir}>Omitir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <View style={styles.mapWrap}>
          <MapaLeaflet centro={CENTRO} coord={coord} onMove={marcarEn} />
        </View>

        <TouchableOpacity style={styles.ubicBtn} onPress={localizarme} disabled={localizando}>
          {localizando ? <ActivityIndicator color={c.primary} /> : <Text style={styles.ubicBtnText}>📍 Usar mi ubicación</Text>}
        </TouchableOpacity>
        <Text style={styles.hint}>Toca el mapa o arrastra el pin para marcar el punto exacto.</Text>

        <TextInput style={styles.input} value={nombre} onChangeText={setNombre}
          placeholder="Nombre (Casa, Trabajo…) — opcional" placeholderTextColor={c.textMuted} />
        <TextInput style={styles.input} value={direccion} onChangeText={setDireccion}
          placeholder="Dirección" placeholderTextColor={c.textMuted} multiline />
        <TextInput style={styles.input} value={referencia} onChangeText={setReferencia}
          placeholder="Referencia (portón, color…) — opcional" placeholderTextColor={c.textMuted} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.confirmar} onPress={confirmar}>
          <Text style={styles.confirmarText}>Usar esta dirección</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  head: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.cardBorder,
  },
  title: { fontSize: ui.size.lg, fontWeight: ui.weight.bold, color: c.textPrimary },
  omitir: { fontSize: ui.size.sm, color: c.textSecondary, fontWeight: ui.weight.semibold },

  mapWrap: { height: 260, borderRadius: ui.radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: c.cardBorder },
  ubicBtn: { marginTop: 12, borderWidth: 1, borderColor: c.primary, borderRadius: ui.radius.full, paddingVertical: 12, alignItems: 'center' },
  ubicBtnText: { color: c.primary, fontWeight: ui.weight.semibold },
  hint: { fontSize: ui.size.xs, color: c.textMuted, marginTop: 8 },
  input: {
    marginTop: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: c.cardBorder, borderRadius: ui.radius.lg,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: ui.size.base, color: c.textPrimary,
  },

  bottomBar: { padding: 16, borderTopWidth: 1, borderTopColor: c.cardBorder },
  confirmar: { backgroundColor: c.primary, borderRadius: ui.radius.full, paddingVertical: 16, alignItems: 'center' },
  confirmarText: { color: '#fff', fontSize: ui.size.base, fontWeight: ui.weight.bold },
});
