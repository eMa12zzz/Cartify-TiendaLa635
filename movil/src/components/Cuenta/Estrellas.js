/*
 * ============================================================
 * LAS CINCO ESTRELLAS — Estrellas.js
 * ============================================================
 * La fila de estrellas que se toca para calificar, y la misma fila quieta
 * cuando ya se calificó (`soloLectura`). La usan las dos valoraciones que la
 * web tiene en "Mis pedidos" y en el estado del pedido: la del servicio de
 * entrega y la del pedido.
 *
 * El amarillo es fijo, no sale de la paleta: una estrella llena es amarilla
 * en modo claro y en oscuro, y en Navidad también. El vacío sí sigue al modo,
 * porque es el gris del fondo de cada uno.
 *
 * Cada estrella se toca en 44 puntos aunque el dibujo mida 30: es el mínimo
 * con el que un pulgar no falla, y aquí fallar significa mandar 3 estrellas
 * en vez de 4.
 * ============================================================
 */

import { Pressable, StyleSheet, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { useColores } from '../../context/ModoContext';

const AMARILLO = '#F5A623';
const VALORES = [1, 2, 3, 4, 5];

const Estrellas = ({ valor = 0, alElegir, tamano = 30, soloLectura = false }) => {
  const COLORES = useColores();

  return (
    <View style={estilos.fila} accessibilityRole={soloLectura ? 'text' : 'radiogroup'}>
      {VALORES.map((n) => {
        const activa = valor >= n;
        const estrella = (
          <Star
            size={tamano}
            color={activa ? AMARILLO : COLORES.tintaApagada}
            fill={activa ? AMARILLO : 'transparent'}
            strokeWidth={1.8}
          />
        );

        if (soloLectura) return <View key={n}>{estrella}</View>;

        return (
          <Pressable
            key={n}
            onPress={() => alElegir?.(n)}
            hitSlop={7}
            accessibilityRole="radio"
            accessibilityState={{ checked: valor === n }}
            accessibilityLabel={`${n} de 5`}
            style={({ pressed }) => pressed && estilos.presionada}
          >
            {estrella}
          </Pressable>
        );
      })}
    </View>
  );
};

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  presionada: {
    transform: [{ scale: 0.9 }],
  },
});

export default Estrellas;
