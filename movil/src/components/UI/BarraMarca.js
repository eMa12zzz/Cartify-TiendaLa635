/*
 * BARRA DE MARCA — "Tienda la 635" arriba de todo.
 *
 * Es la misma TopBar de la web y aparece igual en las dos pantallas, con una
 * diferencia que vale la pena conservar: en Iniciar sesión va a la izquierda
 * con la salida "Seguir viendo la tienda" al lado, y en Registrarse va sola y
 * centrada. Quien se está registrando ya decidió; a quien solo pasaba por ahí
 * hay que dejarle la puerta abierta.
 *
 * El `paddingTop` extra es la barra de estado de Android: sin eso el nombre de
 * la tienda queda debajo de la hora y la señal.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Store } from 'lucide-react-native';
import { COLORES } from '../../theme/colores';
import { ALTURA_ESTADO } from '../../theme/pantalla';

const BarraMarca = ({ centrado = false, alTocarMarca, textoAccion, alPresionarAccion }) => (
  <View style={[estilos.barra, { paddingTop: ALTURA_ESTADO + 12 }, centrado && estilos.barraCentrada]}>
    <Pressable onPress={alTocarMarca} disabled={!alTocarMarca} style={centrado && estilos.marcaCentrada}>
      <Text style={[estilos.marcaChica, centrado && estilos.centrado]}>Tienda</Text>
      <Text style={[estilos.marcaNombre, centrado && estilos.centrado]}>la 635</Text>
    </Pressable>

    {textoAccion && (
      <Pressable
        onPress={alPresionarAccion}
        style={({ pressed }) => [estilos.accion, pressed && estilos.accionPresionada]}
        accessibilityRole="button"
      >
        {/* Mismo icono que la web: lucide `Store`, 15 px y trazo 2.2. */}
        <Store size={15} color="#6B6B6B" strokeWidth={2.2} />
        <Text style={estilos.textoAccion}>{textoAccion}</Text>
      </Pressable>
    )}
  </View>
);

const estilos = StyleSheet.create({
  barra: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: COLORES.linea,
    paddingBottom: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORES.fondo,
  },
  barraCentrada: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  marcaCentrada: {
    alignItems: 'center',
  },
  marcaChica: {
    fontSize: 12,
    color: '#AAAAAA',
    lineHeight: 15,
  },
  marcaNombre: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111111',
    letterSpacing: -0.5,
    lineHeight: 24,
  },
  centrado: {
    textAlign: 'center',
  },
  accion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: COLORES.linea,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  accionPresionada: {
    borderColor: COLORES.marca,
  },
  textoAccion: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#6B6B6B',
  },
});

export default BarraMarca;
