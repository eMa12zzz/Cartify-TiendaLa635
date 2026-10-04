/*
 * ============================================================
 * SELECTOR DE IDIOMA — "Español · English"
 * ============================================================
 * El de `frontend/src/components/Store/SelectorIdioma.jsx`. Va donde se llega
 * SIN cuenta —la bienvenida y el inicio de sesión—: quien no lee español no
 * va a encontrar "Preferencias" dentro de Mi Cuenta, y ni tiene cuenta todavía.
 *
 * Cada opción va escrita en su propio idioma ("English", no "Inglés"). Sin
 * recuadros: texto suelto, la elegida en negrita y subrayada.
 *
 * `color`: la bienvenida tiene colores fijos (no cambia con el modo oscuro);
 * en el resto sale del modo.
 * ============================================================
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Globe } from 'lucide-react-native';
import { useColores } from '../../context/ModoContext';
import { useIdioma } from '../../context/IdiomaContext';
import { IDIOMAS } from '../../utils/idioma';

const SelectorIdioma = ({ color }) => {
  const { idioma, setIdioma, t } = useIdioma();
  const COLORES = useColores();
  const tinta = color || COLORES.textoSuave;

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={t('Idioma')} style={estilos.fila}>
      <Globe size={14} color={tinta} strokeWidth={2} />
      {IDIOMAS.map((op, i) => {
        const activo = idioma === op.clave;
        return (
          <View key={op.clave} style={estilos.opcion}>
            {i > 0 && <Text style={[estilos.punto, { color: tinta }]}>·</Text>}
            <Pressable
              onPress={() => setIdioma(op.clave)}
              hitSlop={10}
              accessibilityRole="radio"
              accessibilityState={{ checked: activo }}
              accessibilityLanguage={op.clave}
            >
              <Text
                style={[
                  estilos.texto,
                  { color: tinta },
                  activo && estilos.textoActivo,
                ]}
              >
                {op.nombre}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
};

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  punto: {
    fontSize: 13,
  },
  texto: {
    fontSize: 13.5,
    paddingVertical: 4,
  },
  textoActivo: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

export default SelectorIdioma;
