import { ScrollView, View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { clientColors as c, ui } from '../../theme/Usuario/clientColors';
import { useCentroAyuda } from '../../hooks/Usuario/useCentroAyuda';
import { Pin } from '../../components/UI/Iconos';
import { IconoMensaje, IconoAyuda } from '../../components/Usuario/IconosCuenta';

/*
 * CentroAyuda — preguntas frecuentes y los canales REALES de la tienda.
 * Puerto de `frontend/src/pages/cliente/CentroAyuda.jsx`. Qué se puede ofrecer
 * lo decide useCentroAyuda; aquí solo se pinta.
 */

// El tipo de canal manda el icono (la lista viene del hook sin saber de dibujos).
const ICONOS = { whatsapp: IconoMensaje, direccion: Pin };

export default function CentroAyuda() {
  const { faqs, canales } = useCentroAyuda();

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.h1}>Centro de ayuda</Text>

      {/* Canales de contacto. Si no hay ninguno, no se pinta nada. */}
      {canales.length > 0 && (
        <View style={styles.canales}>
          {canales.map((canal) => {
            const Icon = ICONOS[canal.tipo] || IconoAyuda;
            const contenido = (
              <>
                <Icon size={20} color={c.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.canalEtiqueta}>{canal.etiqueta}</Text>
                  <Text style={styles.canalValor}>{canal.valor}</Text>
                </View>
              </>
            );
            // Solo lo que lleva a algún lado se comporta como enlace.
            return canal.enlace ? (
              <TouchableOpacity
                key={canal.tipo}
                style={styles.canal}
                onPress={() => Linking.openURL(canal.enlace)}
                activeOpacity={0.85}
              >
                {contenido}
              </TouchableOpacity>
            ) : (
              <View key={canal.tipo} style={styles.canal}>{contenido}</View>
            );
          })}
        </View>
      )}

      {/* Preguntas frecuentes */}
      <View style={styles.faqHead}>
        <IconoAyuda size={20} color={c.primary} />
        <Text style={styles.faqTitulo}>Preguntas frecuentes</Text>
      </View>
      <View style={{ gap: 20 }}>
        {faqs.map((faq, i) => (
          <View key={i}>
            <Text style={styles.faqQ}>{faq.q}</Text>
            <Text style={styles.faqA}>{faq.a}</Text>
          </View>
        ))}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20 },
  h1: { fontSize: ui.size.xxl, fontWeight: ui.weight.bold, color: c.textPrimary, marginBottom: 24 },

  canales: { gap: 12, marginBottom: 32 },
  canal: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
    backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder, borderRadius: ui.radius.lg,
  },
  canalEtiqueta: { fontSize: ui.size.xs, color: c.textMuted },
  canalValor: { fontSize: ui.size.sm, fontWeight: ui.weight.semibold, color: c.textPrimary },

  faqHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  faqTitulo: { fontSize: ui.size.base, fontWeight: ui.weight.bold, color: c.textPrimary },
  faqQ: { fontSize: ui.size.sm, fontWeight: ui.weight.bold, color: c.textPrimary, marginBottom: 4 },
  faqA: { fontSize: ui.size.sm, color: c.textSecondary, lineHeight: 21 },
});
