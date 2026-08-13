/*
 * ============================================================
 * BARRA DE UNA PANTALLA DE LA CUENTA
 * ============================================================
 * La flecha de volver y el título. La usan las cinco pantallas que cuelgan del
 * perfil (mis datos, puntos, favoritos, direcciones, avisos).
 *
 * Existe por una razón concreta: las cinco vuelven al MISMO sitio y tienen que
 * volver IGUAL. Copiada cinco veces, la quinta sale con la flecha tres píxeles
 * más adentro y el título medio punto más chico, y el conjunto se siente hecho
 * por dos personas distintas.
 *
 * El botón mide 40x40 aunque la flecha mida 18: lo que se toca no es el dibujo
 * sino el botón, y una flecha de 18 píxeles se falla una de cada tres veces.
 * ============================================================
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORES } from '../../theme/colores';
import { ALTURA_ESTADO } from '../../theme/pantalla';
import { useTema } from '../../context/TemaContext';
import { ChevronIzquierda } from '../UI/Iconos';

const BarraCuenta = ({ titulo, alVolver }) => {
  const { colores } = useTema();

  return (
    <View style={[estilos.barra, { paddingTop: ALTURA_ESTADO + 10 }]}>
      <Pressable
        onPress={alVolver}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Volver a mi cuenta"
        style={({ pressed }) => [
          estilos.botonVolver,
          pressed && { backgroundColor: colores.marcaSuave },
        ]}
      >
        <ChevronIzquierda size={18} />
      </Pressable>

      <Text style={estilos.titulo} numberOfLines={1}>
        {titulo}
      </Text>
    </View>
  );
};

const estilos = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.linea,
  },
  botonVolver: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    flexShrink: 1,
    fontSize: 19,
    fontWeight: '800',
    color: COLORES.tituloFuerte,
    letterSpacing: -0.3,
  },
});

export default BarraCuenta;
