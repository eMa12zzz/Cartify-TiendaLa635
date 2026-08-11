/*
 * ============================================================
 * CINTA DE TEMPORADA
 * ============================================================
 * La franja con el saludo de la fecha, debajo del encabezado.
 *
 * Es la mitad seria de la decoración: las figuras que caen ponen el ambiente,
 * pero esto DICE algo. "Pida con tiempo, que diciembre se llena" le sirve a
 * quien compra; un copo de nieve, no.
 *
 * Sin festón en las orillas, y eso no es un recorte: la versión web ya lo
 * apaga por debajo de 700 px de ancho, porque en un teléfono el texto ocupa
 * toda la línea y los triangulitos solo lo apretarían.
 * ============================================================
 */

import { StyleSheet, Text, View } from 'react-native';
import { useTema } from '../../context/TemaContext';

const CintaTemporada = () => {
  const { decoracion, colores } = useTema();

  /*
   * Sin temporada, con la decoración apagada, o con un tema sin saludo, no se
   * pinta NADA. Ni una vista vacía: un contenedor invisible con relleno sigue
   * empujando la tienda hacia abajo todo el año.
   */
  if (!decoracion?.saludo) return null;

  return (
    <View
      style={[estilos.banda, { backgroundColor: colores.marca }]}
      accessibilityRole="text"
    >
      <Text style={estilos.texto}>{decoracion.saludo}</Text>
    </View>
  );
};

const estilos = StyleSheet.create({
  banda: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  texto: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 12.5,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});

export default CintaTemporada;
