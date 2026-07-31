/*
 * BOTÓN — el café de la tienda.
 *
 * Copia el de la web: ancho completo, 13 de alto interno, esquinas de 8 y el
 * café que se oscurece al presionar. Cuando está cargando no se apaga sin más:
 * muestra la rueda, porque un botón que deja de responder sin decir nada se
 * vuelve a tocar tres veces.
 */

import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORES } from '../../theme/colores';

const Boton = ({ texto, alPresionar, cargando = false, deshabilitado = false, icono = null, estilo }) => {
  const inactivo = cargando || deshabilitado;

  return (
    <Pressable
      onPress={alPresionar}
      disabled={inactivo}
      accessibilityRole="button"
      style={({ pressed }) => [
        estilos.boton,
        pressed && !inactivo && estilos.presionado,
        inactivo && estilos.inactivo,
        estilo,
      ]}
    >
      {cargando ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <View style={estilos.contenido}>
          <Text style={estilos.texto}>{texto}</Text>
          {icono}
        </View>
      )}
    </Pressable>
  );
};

const estilos = StyleSheet.create({
  boton: {
    width: '100%',
    paddingVertical: 13,
    backgroundColor: COLORES.marca,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  presionado: {
    backgroundColor: COLORES.marcaOscuro,
  },
  inactivo: {
    backgroundColor: COLORES.marcaApagado,
  },
  contenido: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  texto: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default Boton;
