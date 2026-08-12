import { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Image,
  StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { clientColors as c, ui } from '../../theme/Usuario/clientColors';
import { useAuth } from '../../hooks/useAuth';
import { puedeRepartir } from '../../hooks/Usuario/useReparto';
import { NOMBRE_TIENDA } from '../../utils/tienda';

// Iconos dibujados con Views (mismo estilo que la web con lucide).
import { Persona, Corazon, Pin, Estrella, Bici } from '../../components/UI/Iconos';
import {
  IconoBolsa, IconoTarjeta, IconoCampana, IconoRecibo, IconoAyuda, IconoSalir,
} from '../../components/Usuario/IconosCuenta';

// Las pantallas del área (cada una es el "Outlet" de la web).
import DetallesCuenta from './DetallesCuenta';
import MisPedidos from './MisPedidos';
import Favoritos from './Favoritos';
import Direcciones from './Direcciones';
import MetodoPago from './MetodoPago';
import Notificaciones from './Notificaciones';
import PuntosFidelidad from './PuntosFidelidad';
import Recibidos from './Recibidos';
import CentroAyuda from './CentroAyuda';
import Reparto from './Reparto';

/*
 * ============================================================
 * MiCuentaLayout — el "marco" del área "Mi Cuenta"
 * ============================================================
 * Puerto de `frontend/src/components/Layout/ClienteLayout.jsx`.
 *
 * La web usa React Router: un <Outlet /> donde entra cada página según la URL.
 * El móvil no tiene router, así que el "qué página mostrar" vive en un estado
 * local (`activa`) y el switch de abajo hace de Outlet. El diseño es el mismo:
 * barra superior con el nombre de la tienda + avatar, y debajo una fila de
 * pestañas horizontales deslizable, con la activa en café y subrayada.
 * ============================================================
 */

// `label` es el nombre corto de la pestaña; `icon` su dibujo. `ready` marca las
// ya cableadas (todas lo están). Igual que el navItems de la web.
const NAV = [
  { key: 'datos',        label: 'Mis datos',   icon: Persona,      Screen: DetallesCuenta },
  { key: 'pedidos',      label: 'Pedidos',     icon: IconoBolsa,   Screen: MisPedidos },
  { key: 'favoritos',    label: 'Favoritos',   icon: Corazon,      Screen: Favoritos },
  { key: 'direcciones',  label: 'Direcciones', icon: Pin,          Screen: Direcciones },
  { key: 'pagos',        label: 'Pagos',       icon: IconoTarjeta, Screen: MetodoPago },
  { key: 'notificaciones', label: 'Avisos',    icon: IconoCampana, Screen: Notificaciones },
  { key: 'puntos',       label: 'Puntos',      icon: Estrella,     Screen: PuntosFidelidad },
  { key: 'recibidos',    label: 'Recibos',     icon: IconoRecibo,  Screen: Recibidos },
];

export default function MiCuentaLayout({ navigation }) {
  const { user, logout } = useAuth();
  const [activa, setActiva] = useState('datos');

  const displayName = user?.userName || user?.fullName || 'Cliente';
  const initials = displayName.substring(0, 1).toUpperCase();

  /*
   * "Reparto" solo lo ve el personal. Va de primero porque para ellos es lo
   * único que vienen a hacer aquí. Igual que en la web.
   */
  const items = puedeRepartir(user)
    ? [{ key: 'reparto', label: 'Reparto', icon: Bici, Screen: Reparto }, ...NAV]
    : NAV;

  // Además de las pestañas, "Ayuda" y "Salir" viven al final de la barra.
  const itemActivo = [...items, { key: 'ayuda', label: 'Ayuda', icon: IconoAyuda, Screen: CentroAyuda }]
    .find((it) => it.key === activa) || items[0];
  const Pantalla = itemActivo.Screen;

  /*
   * Cerrar sesión pide confirmación (la web usa un modal; aquí un Alert nativo):
   * es la única acción del menú que saca de la sesión.
   */
  const confirmarSalir = () => {
    Alert.alert(
      '¿Cerrar sesión?',
      'Tendrá que volver a ingresar su correo y contraseña para entrar de nuevo.',
      [
        { text: 'Quedarme', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  // Pinta una pestaña (icono + texto + subrayado si está activa).
  const Pestana = ({ it }) => {
    const active = activa === it.key;
    const Icon = it.icon;
    return (
      <TouchableOpacity
        key={it.key}
        onPress={() => setActiva(it.key)}
        style={styles.tab}
        activeOpacity={0.7}
      >
        <Icon size={16} color={active ? c.primary : c.textSecondary} />
        <Text style={[styles.tabLabel, { color: active ? c.primary : c.textSecondary, fontWeight: active ? ui.weight.bold : ui.weight.medium }]}>
          {it.label}
        </Text>
        {active && <View style={styles.tabUnderline} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Barra superior: nombre de la tienda (vuelve a la tienda) + avatar ── */}
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation?.navigate?.('tienda')}>
          <Text style={styles.brand}>{NOMBRE_TIENDA.arriba}</Text>
          <Text style={styles.brand}>{NOMBRE_TIENDA.abajo}</Text>
        </TouchableOpacity>

        <View style={styles.topRight}>
          <Text style={styles.userName} numberOfLines={1}>{displayName}</Text>
          <View style={styles.avatar}>
            {user?.image ? (
              <Image source={{ uri: user.image }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarInitial}>{initials}</Text>
            )}
          </View>
        </View>
      </View>

      {/* ── Pestañas horizontales deslizables ── */}
      <View style={styles.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {items.map((it) => <Pestana key={it.key} it={it} />)}
          {/* Ayuda y Salir, separados: no son secciones de la cuenta sino
              cosas que se hacen desde ella. */}
          <Pestana it={{ key: 'ayuda', label: 'Ayuda', icon: IconoAyuda }} />
          <TouchableOpacity onPress={confirmarSalir} style={styles.tab} activeOpacity={0.7}>
            <IconoSalir size={16} color={c.textSecondary} />
            <Text style={[styles.tabLabel, { color: c.textSecondary }]}>Salir</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ── Contenido de la pestaña activa (hace de <Outlet />) ── */}
      <View style={styles.content}>
        <Pantalla irA={setActiva} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: c.mainBg },
  topbar: {
    height: 56, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: c.topbarBg, borderBottomWidth: 1, borderBottomColor: c.sidebarBorder,
  },
  brand: { fontWeight: ui.weight.bold, fontSize: 13, color: c.textPrimary, lineHeight: 15 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 10, maxWidth: '55%' },
  userName: { fontSize: 13, fontWeight: ui.weight.semibold, color: c.textPrimary, flexShrink: 1 },
  avatar: {
    width: 32, height: 32, borderRadius: 16, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center', backgroundColor: c.primary,
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarInitial: { color: c.buttonText, fontWeight: ui.weight.bold, fontSize: 14 },
  tabsWrap: { backgroundColor: c.topbarBg, borderBottomWidth: 1, borderBottomColor: c.sidebarBorder },
  tabsRow: { alignItems: 'center', paddingHorizontal: 8 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 14, position: 'relative',
  },
  tabLabel: { fontSize: 13.5 },
  tabUnderline: {
    position: 'absolute', left: 8, right: 8, bottom: 0, height: 3,
    borderTopLeftRadius: 3, borderTopRightRadius: 3, backgroundColor: c.primary,
  },
  content: { flex: 1, backgroundColor: c.mainBg },
});
