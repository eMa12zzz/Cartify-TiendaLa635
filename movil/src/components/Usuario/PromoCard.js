import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { coloresDePromo } from '../../utils/temasPromo';

/*
 * PromoCard — la cara de una promoción.
 * Puerto de `frontend/src/components/Store/PromoCard.jsx`. La tarjeta se DIBUJA
 * con los colores del tema (temasPromo) y el texto de la promo: fondo en
 * degradado (135°), pastilla de ahorro con el color de acento, pastilla de
 * vencimiento con borde, título a 2 líneas, descripción a 2 líneas y la flecha
 * en su círculo abajo a la derecha. Proporción 2.2:1, esquinas de 20, como la web.
 */
export default function PromoCard({ promo, title, descripcion, etiqueta, vencimiento, imagen, onPress, width }) {
  const col = coloresDePromo(promo);
  // Sobre acento claro el texto va oscuro para que se lea (como en la web).
  const textoSobreAcento = col.texto === '#FFFFFF' ? '#3D2B1A' : col.texto;
  const alto = Math.round(width / 2.2);

  return (
    <TouchableOpacity activeOpacity={0.92} onPress={onPress} style={{ width, height: alto, borderRadius: 20, overflow: 'hidden' }}>
      {/* Fondo en degradado (de esquina a esquina ≈ 135°). */}
      <LinearGradient colors={col.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />

      {/* Foto que ACOMPAÑA a la derecha, difuminada hacia el fondo por la izquierda. */}
      {!!imagen && (
        <View style={styles.imgWrap}>
          <Image source={{ uri: imagen }} style={styles.img} resizeMode="cover" />
          <LinearGradient
            colors={[col.grad[1], 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}

      {/* Texto */}
      <View style={styles.content}>
        {(!!etiqueta || !!vencimiento) && (
          <View style={styles.pills}>
            {!!etiqueta && (
              <View style={[styles.etiqueta, { backgroundColor: col.acento }]}>
                <Text style={[styles.etiquetaText, { color: textoSobreAcento }]}>{etiqueta}</Text>
              </View>
            )}
            {!!vencimiento && (
              <View style={[styles.venc, { borderColor: col.acento }]}>
                <Text style={[styles.vencText, { color: col.texto }]}>{vencimiento}</Text>
              </View>
            )}
          </View>
        )}
        <Text style={[styles.title, { color: col.texto, maxWidth: imagen ? '62%' : '100%' }]} numberOfLines={2}>
          {title || 'Promoción'}
        </Text>
        {!!descripcion && (
          <Text style={[styles.desc, { color: col.texto, maxWidth: imagen ? '58%' : '80%' }]} numberOfLines={2}>
            {descripcion}
          </Text>
        )}
      </View>

      {/* Flecha */}
      <View style={[styles.arrow, { backgroundColor: col.flecha }]}>
        <Text style={[styles.arrowText, { color: textoSobreAcento }]}>→</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  imgWrap: { position: 'absolute', top: 0, right: 0, width: '46%', height: '100%' },
  img: { width: '100%', height: '100%' },
  content: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center', padding: 18 },
  pills: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  etiqueta: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  etiquetaText: { fontSize: 14, fontWeight: '800', letterSpacing: 0.3 },
  venc: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  vencText: { fontSize: 11, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '800', lineHeight: 25, letterSpacing: -0.3 },
  desc: { fontSize: 13, marginTop: 6, lineHeight: 18, opacity: 0.9 },
  arrow: {
    position: 'absolute', right: 16, bottom: 16, width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  arrowText: { fontSize: 18, fontWeight: '800', lineHeight: 20 },
});
