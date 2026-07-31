/*
 * ============================================================
 * BIENVENIDA — donde cae quien ya entró
 * ============================================================
 * Un inicio de sesión que no lleva a ningún lado no se puede dar por
 * funcionando: no hay forma de saber si el token llegó, de quién es la sesión,
 * ni de cerrarla. Esta pantalla es esa comprobación.
 *
 * A propósito es corta. La Bienvenida de la web pide la dirección de entrega
 * sobre un mapa, y eso pide react-leaflet, permisos de ubicación y la pantalla
 * de la tienda detrás; nada de eso existe todavía en móvil. Cuando exista, este
 * archivo se reemplaza por la de verdad.
 * ============================================================
 */

import { StyleSheet, Text, View } from 'react-native';
import BarraMarca from '../components/UI/BarraMarca';
import Boton from '../components/UI/Boton';
import { Estrella } from '../components/UI/Iconos';
import { useAuth } from '../hooks/useAuth';
import { COLORES } from '../theme/colores';

const Bienvenida = () => {
  const { user, logout } = useAuth();

  // Al personal se le saluda distinto: entra por la misma puerta que el
  // cliente, pero no viene a comprar.
  const esPersonal = user?.type && user.type !== 'client';
  const nombre = user?.fullName || user?.userName || 'de vuelta';

  return (
    <View style={estilos.pantalla}>
      <BarraMarca centrado />

      <View style={estilos.cuerpo}>
        <View style={estilos.medalla}>
          <Estrella size={30} />
        </View>

        <Text style={estilos.titulo}>Hola, {nombre}</Text>
        <Text style={estilos.bajada}>
          {esPersonal
            ? 'Entró como personal de la tienda. El área de reparto todavía no está en la app.'
            : 'Su sesión está abierta. La tienda, el carrito y sus pedidos llegan en las siguientes pantallas.'}
        </Text>

        <View style={estilos.datos}>
          <Fila etiqueta="Correo" valor={user?.email} />
          <Fila etiqueta="Usuario" valor={user?.userName} />
          <Fila etiqueta="Entró como" valor={esPersonal ? 'Personal' : 'Cliente'} />
        </View>

        <Boton texto="Cerrar sesión" alPresionar={logout} estilo={estilos.boton} />
      </View>
    </View>
  );
};

const Fila = ({ etiqueta, valor }) =>
  valor ? (
    <View style={estilos.fila}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <Text style={estilos.valor} numberOfLines={1}>
        {valor}
      </Text>
    </View>
  ) : null;

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  cuerpo: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    alignItems: 'center',
  },
  medalla: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: COLORES.marcaSuave,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  titulo: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORES.tituloFuerte,
    textAlign: 'center',
    marginBottom: 10,
  },
  bajada: {
    fontSize: 15,
    lineHeight: 23,
    color: COLORES.textoSuave,
    textAlign: 'center',
    marginBottom: 30,
  },
  datos: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: COLORES.lineaCard,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 28,
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 16,
  },
  etiqueta: {
    fontSize: 13.5,
    color: COLORES.textoTenue,
  },
  valor: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORES.tituloVentaja,
  },
  boton: {
    alignSelf: 'stretch',
  },
});

export default Bienvenida;
