import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { clientColors as c, ui } from '../../theme/Usuario/clientColors';
import { useAuth } from '../../hooks/useAuth';
import { useLoyalty } from '../../hooks/Usuario/useLoyalty';
import { fechaNumerica } from '../../utils/fecha';
import { Estrella } from '../../components/UI/Iconos';
import { IconoAlerta } from '../../components/Usuario/IconosCuenta';

/*
 * PuntosFidelidad — tarjeta de fidelidad del cliente (área "Mi Cuenta").
 * Puerto de `frontend/src/pages/cliente/PuntosFidelidad.jsx`. Muestra el saldo
 * DISPONIBLE real y la próxima fecha de vencimiento. La lógica vive en useLoyalty.
 *
 * Nota RN: la web pinta la tarjeta con un degradado CSS (café→acento). Sin
 * `expo-linear-gradient` (no instalado) se usa un fondo café sólido con un
 * recuadro de acento; el mismo espíritu, sin agregar dependencias.
 */
export default function PuntosFidelidad() {
  const { user } = useAuth();
  const {
    points, pointsPerDollar, expiryMonths, nextExpiry, expiringSoon, loading,
    redeemRate, minRedeem, valorEnDinero,
  } = useLoyalty();

  const venceStr = nextExpiry ? fechaNumerica(nextExpiry) : '—';
  const plural = pointsPerDollar === 1 ? '' : 's';

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.h1}>Puntos de fidelidad</Text>

      {/* ── Tarjeta de fidelidad ── */}
      <View style={styles.tarjeta}>
        <View style={styles.sello}>
          <View style={styles.selloDot} />
          <Text style={styles.selloText}>Tienda{'\n'}la 635</Text>
        </View>

        <Text style={styles.nombre}>{user?.fullName || 'Cliente'}</Text>
        <View style={styles.puntosRow}>
          <Estrella size={16} color="#fff" />
          <Text style={styles.puntosText}>{loading ? '…' : points} puntos disponibles</Text>
        </View>

        <View style={{ marginTop: 24 }}>
          <Text style={styles.valen}>Valen ${valorEnDinero.toFixed(2)} en tu próxima compra</Text>
          <Text style={styles.tarjetaSub}>Ganas {pointsPerDollar} punto{plural} por cada $1 que gastas.</Text>
          <Text style={styles.tarjetaSub}>Próximo vencimiento: {venceStr}</Text>
        </View>
      </View>

      {/* Aviso de puntos que vencen pronto (30 días) */}
      {expiringSoon > 0 && (
        <View style={styles.alerta}>
          <IconoAlerta size={16} color="#b45309" />
          <Text style={styles.alertaText}>
            Tienes {expiringSoon} puntos que vencen en los próximos 30 días. ¡Aprovéchalos!
          </Text>
        </View>
      )}

      {/* ── Preguntas frecuentes (reflejan la config real) ── */}
      <View style={{ gap: 20, marginTop: 8 }}>
        <Faq
          q="¿Cómo consigo puntos?"
          a={`Por cada $1 que gastas en la tienda ganas ${pointsPerDollar} punto${plural}. Se acumulan automáticamente con cada compra que realizas.`}
        />
        <Faq
          q="¿Cómo los uso?"
          a={`Cada ${redeemRate} puntos equivalen a $1 de descuento. Al pagar tu compra en la tienda podrás elegir usarlos (necesitas al menos ${minRedeem} puntos).`}
        />
        <Faq
          q="¿Cuándo vencen?"
          a={`Los puntos de cada compra vencen a los ${expiryMonths} meses de haberlos ganado. Arriba ves la fecha del lote que vence primero.`}
        />
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const Faq = ({ q, a }) => (
  <View>
    <Text style={styles.faqQ}>{q}</Text>
    <Text style={styles.faqA}>{a}</Text>
  </View>
);

const styles = StyleSheet.create({
  scroll: { padding: 20 },
  h1: { fontSize: ui.size.xxl, fontWeight: ui.weight.bold, color: c.textPrimary, marginBottom: 24 },

  tarjeta: {
    backgroundColor: c.primary, borderRadius: ui.radius.xl, padding: 24, marginBottom: 16, overflow: 'hidden',
  },
  sello: {
    position: 'absolute', right: 28, top: '50%', marginTop: -48,
    width: 96, height: 96, borderRadius: ui.radius.lg,
    backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center',
  },
  selloDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  selloText: { color: '#fff', fontWeight: ui.weight.extrabold, fontSize: ui.size.xs, textAlign: 'center' },
  nombre: { color: '#fff', fontSize: ui.size.xl, fontWeight: ui.weight.bold },
  puntosRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  puntosText: { color: 'rgba(255,255,255,0.85)', fontSize: ui.size.sm },
  valen: { color: '#fff', fontSize: ui.size.lg, fontWeight: ui.weight.bold },
  tarjetaSub: { color: 'rgba(255,255,255,0.9)', fontSize: ui.size.sm, marginTop: 4 },

  alerta: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(217,119,6,.12)', borderRadius: ui.radius.lg,
    paddingHorizontal: 16, paddingVertical: 12, marginBottom: 24,
  },
  alertaText: { flex: 1, fontSize: ui.size.sm, color: '#b45309' },

  faqQ: { fontSize: ui.size.sm, fontWeight: ui.weight.bold, color: c.textPrimary, marginBottom: 4 },
  faqA: { fontSize: ui.size.sm, color: c.textSecondary, lineHeight: 21 },
});
