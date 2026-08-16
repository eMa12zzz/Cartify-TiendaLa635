/*
 * PANTALLA DE CARGA — la pantalla de bienvenida adicional al Splash Screen.
 *
 * El Splash Screen de app.json es el que pinta el sistema operativo mientras
 * el JS todavía no cargó; en cuanto React ya está corriendo, esa pantalla se
 * va sola y no se puede volver a mostrar. Esta es la que la reemplaza mientras
 * se revisa si hay una sesión guardada (ver useSplashTimer), con la marca de
 * la tienda en vez de un blanco vacío.
 */

import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { COLORES } from '../theme/colores';

const PantallaCarga = () => (
  <View style={estilos.contenedor}>
    <View style={estilos.marca}>
      <Text style={estilos.marcaChica}>Tienda</Text>
      <Text style={estilos.marcaNombre}>la 635</Text>
    </View>
    <ActivityIndicator size="large" color={COLORES.marca} style={estilos.indicador} />
  </View>
);

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORES.fondo,
  },
  marca: {
    alignItems: 'center',
  },
  marcaChica: {
    fontSize: 15,
    color: COLORES.textoTenue,
    letterSpacing: 1,
  },
  marcaNombre: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORES.tituloFuerte,
    letterSpacing: -0.5,
  },
  indicador: {
    marginTop: 30,
  },
});

export default PantallaCarga;
