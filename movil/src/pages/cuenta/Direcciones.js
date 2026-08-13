/*
 * ============================================================
 * DIRECCIONES — a dónde le llevamos los pedidos
 * ============================================================
 * El equivalente de `frontend/src/pages/cliente/Direcciones.jsx`: la lista de
 * direcciones guardadas, con su nombre, su texto y su referencia.
 *
 * ── Aquí se ven y se borran; se agregan al pagar ──
 *
 * Igual que en la web, y por el mismo motivo. Allá esta pantalla tampoco tiene
 * un campo para escribir: el botón abre un MAPA. Pero el CARRITO sí lo tiene, y
 * su comentario explica por qué se le agregó — mandar al mapa en mitad del pago
 * es pedirle un viaje a alguien que ya tenía la plata en la mano.
 *
 * Aquí pasa lo mismo: escribir una dirección se hace en el momento en que hace
 * falta, que es al elegir el envío (ver pages/Checkout.js), no en una pantalla
 * de mantenimiento a la que casi nadie entra.
 *
 * El mapa no está en móvil y es otro trabajo: react-leaflet es del navegador, y
 * en nativo pide react-native-maps, la llave de Google y su compilación propia.
 * Por eso las direcciones escritas desde el teléfono van sin coordenadas — el
 * repartidor lee el texto y la referencia, que es con lo que se llegaba antes
 * de que existiera el mapa.
 *
 * ── Borrar es mandar la lista completa ──
 *
 * El endpoint reemplaza el arreglo entero (ver api/clienteApi.js), así que
 * quitar una es guardar todas menos esa. Y va con confirmación, que la web no
 * pide: en un teléfono el basurero queda a un centímetro del renglón que se
 * quería tocar.
 * ============================================================
 */

import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { MapPin, Signpost, Trash2 } from 'lucide-react-native';
import { COLORES } from '../../theme/colores';
import { useAuth } from '../../hooks/useAuth';
import { useTema } from '../../context/TemaContext';
import { useAviso } from '../../context/AvisoContext';
import { getCliente, actualizarDirecciones } from '../../api/clienteApi';
import BarraCuenta from '../../components/Cuenta/BarraCuenta';
import Boton from '../../components/UI/Boton';

/*
 * Las direcciones viejas son texto suelto y las nuevas son un objeto. Se
 * normaliza al leer, igual que en la web (`normalizarDireccion`): así lo de
 * antes sigue viéndose y lo de ahora trae su nombre y su referencia.
 */
const normalizar = (item) => {
  if (typeof item === 'string') {
    return { nombre: '', direccion: item, referencia: '' };
  }
  return {
    nombre: item?.nombre || '',
    direccion: item?.direccion || '',
    referencia: item?.referencia || '',
    lat: item?.lat ?? null,
    lng: item?.lng ?? null,
  };
};

const Direcciones = ({ alVolver }) => {
  const { user } = useAuth();
  const { colores } = useTema();
  const { avisar } = useAviso();

  const [direcciones, setDirecciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const cliente = await getCliente(user.id);
      const lista = Array.isArray(cliente?.clientAddress) ? cliente.clientAddress : [];
      setDirecciones(lista.map(normalizar));
    } catch (e) {
      setError(e?.message || 'No se pudieron cargar sus direcciones');
    } finally {
      setCargando(false);
    }
  }, [user?.id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const borrar = (indice) => {
    const dir = direcciones[indice];

    Alert.alert(
      '¿Quitar esta dirección?',
      `${dir.nombre || dir.direccion}\n\nPara volver a tenerla habrá que escribirla de nuevo al hacer un pedido.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: async () => {
            const quedan = direcciones.filter((_, i) => i !== indice);
            setGuardando(true);
            try {
              await actualizarDirecciones(user.id, quedan);
              setDirecciones(quedan);
              avisar('Dirección quitada');
            } catch (e) {
              // No se toca la lista: si el servidor no la borró, sigue estando.
              avisar(e?.message || 'No se pudo quitar la dirección', 'error');
            } finally {
              setGuardando(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={estilos.pantalla}>
      <BarraCuenta titulo="Direcciones" alVolver={alVolver} />

      {cargando ? (
        <View style={estilos.centro}>
          <ActivityIndicator size="large" color={colores.marca} />
        </View>
      ) : error ? (
        <View style={estilos.centro}>
          <Text style={estilos.errorTitulo}>No se pudieron cargar sus direcciones</Text>
          <Text style={estilos.errorTexto}>{error}</Text>
          <View style={estilos.botonError}>
            <Boton
              texto="Reintentar"
              alPresionar={cargar}
              color={colores.marca}
              colorPresionado={colores.marcaOscuro}
            />
          </View>
        </View>
      ) : direcciones.length === 0 ? (
        <View style={estilos.centro}>
          <MapPin size={38} color={COLORES.marcador} strokeWidth={1.5} />
          <Text style={estilos.vacioTitulo}>Sin direcciones guardadas</Text>
          <Text style={estilos.vacioTexto}>
            Al hacer un pedido con envío a domicilio puede escribir la suya, y queda guardada aquí.
          </Text>
        </View>
      ) : (
        <FlatList
          data={direcciones}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={estilos.lista}
          ListFooterComponent={
            <Text style={estilos.pie}>
              Para agregar otra, escríbala al elegir el envío a domicilio en su próximo pedido.
            </Text>
          }
          renderItem={({ item, index }) => (
            <View style={estilos.tarjeta}>
              <MapPin size={19} color={colores.marca} strokeWidth={2} />

              <View style={estilos.datos}>
                {!!item.nombre && <Text style={estilos.nombre}>{item.nombre}</Text>}
                <Text style={item.nombre ? estilos.textoSecundario : estilos.textoPrincipal}>
                  {item.direccion}
                </Text>
                {!!item.referencia && (
                  <View style={estilos.filaReferencia}>
                    <Signpost size={13} color={COLORES.textoTenue} strokeWidth={1.8} />
                    <Text style={estilos.referencia}>{item.referencia}</Text>
                  </View>
                )}
              </View>

              <Pressable
                onPress={() => borrar(index)}
                disabled={guardando}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Quitar ${item.nombre || 'dirección'}`}
                style={({ pressed }) => [
                  estilos.botonBorrar,
                  pressed && estilos.botonBorrarPresionado,
                  guardando && estilos.botonBorrarApagado,
                ]}
              >
                <Trash2 size={16} color={COLORES.error} strokeWidth={1.9} />
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
};

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  errorTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORES.tituloFuerte,
  },
  errorTexto: {
    fontSize: 13.5,
    lineHeight: 20,
    color: COLORES.textoSuave,
    textAlign: 'center',
  },
  botonError: {
    marginTop: 12,
    alignSelf: 'stretch',
  },
  vacioTitulo: {
    marginTop: 4,
    fontSize: 15.5,
    fontWeight: '700',
    color: COLORES.tituloFuerte,
  },
  vacioTexto: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORES.textoSuave,
    textAlign: 'center',
  },
  lista: {
    padding: 16,
    gap: 10,
  },
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    borderWidth: 1,
    borderColor: COLORES.lineaCard,
    borderRadius: 14,
    padding: 14,
  },
  datos: {
    flex: 1,
    gap: 2,
  },
  nombre: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORES.tituloVentaja,
  },
  textoPrincipal: {
    fontSize: 14,
    color: COLORES.tituloVentaja,
    lineHeight: 20,
  },
  textoSecundario: {
    fontSize: 13.5,
    color: COLORES.textoSuave,
    lineHeight: 20,
  },
  filaReferencia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  referencia: {
    flexShrink: 1,
    fontSize: 12,
    color: COLORES.textoTenue,
  },
  botonBorrar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonBorrarPresionado: {
    backgroundColor: '#FDECEC',
  },
  botonBorrarApagado: {
    opacity: 0.5,
  },
  pie: {
    marginTop: 14,
    paddingHorizontal: 4,
    fontSize: 12.5,
    lineHeight: 19,
    color: COLORES.textoTenue,
    textAlign: 'center',
  },
});

export default Direcciones;
