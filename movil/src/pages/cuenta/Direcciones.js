/*
 * ============================================================
 * DIRECCIONES — a dónde le llevamos los pedidos
 * ============================================================
 * El equivalente de `frontend/src/pages/cliente/Direcciones.jsx`: la lista de
 * direcciones guardadas, con su nombre, su texto y su referencia. A diferencia
 * de la web, aquí también se agregan: mismos tres campos y el mismo endpoint
 * que usa Checkout.js al escribir una nueva al elegir el envío.
 *
 * ── Sin mapa, igual que en el checkout ──
 *
 * react-leaflet es del navegador, y en nativo pide react-native-maps, la
 * llave de Google y su compilación propia — otro trabajo. Por eso las
 * direcciones escritas desde el teléfono van sin coordenadas: el repartidor
 * lee el texto y la referencia, que es con lo que se llegaba antes de que
 * existiera el mapa.
 *
 * ── Borrar (y agregar) es mandar la lista completa ──
 *
 * El endpoint reemplaza el arreglo entero (ver api/clienteApi.js), así que
 * tanto quitar una como sumar una nueva es guardar la lista completa ya
 * modificada. Borrar va con confirmación, que la web no pide: en un teléfono
 * el basurero queda a un centímetro del renglón que se quería tocar.
 * ============================================================
 */

import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MapPin, Signpost, Trash2 } from 'lucide-react-native';
import { COLORES } from '../../theme/colores';
import { useAuth } from '../../hooks/useAuth';
import { useTema } from '../../context/TemaContext';
import { useAviso } from '../../context/AvisoContext';
import { getCliente, actualizarDirecciones } from '../../api/clienteApi';
import BarraCuenta from '../../components/Cuenta/BarraCuenta';
import Boton from '../../components/UI/Boton';
import { useAlturaBarraInferior } from '../../components/UI/BarraInferior';

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
  // Sin esto la última dirección queda tapada detrás de la píldora flotante.
  const alturaBarra = useAlturaBarraInferior();

  const [direcciones, setDirecciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const [escribiendo, setEscribiendo] = useState(false);
  const [nueva, setNueva] = useState({ nombre: '', direccion: '', referencia: '' });

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

  const agregar = async () => {
    if (!nueva.direccion.trim()) {
      avisar('Escriba la dirección para poder guardarla', 'error');
      return;
    }

    const lista = [...direcciones, { ...nueva, lat: null, lng: null }];
    setGuardando(true);
    try {
      await actualizarDirecciones(user.id, lista);
      setDirecciones(lista);
      setNueva({ nombre: '', direccion: '', referencia: '' });
      setEscribiendo(false);
      avisar('Dirección guardada');
    } catch (e) {
      avisar(e?.message || 'No se pudo guardar la dirección', 'error');
    } finally {
      setGuardando(false);
    }
  };

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
      ) : (
        <FlatList
          data={direcciones}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={[estilos.lista, { paddingBottom: estilos.lista.padding + alturaBarra }]}
          ListEmptyComponent={
            <View style={estilos.vacio}>
              <MapPin size={38} color={COLORES.marcador} strokeWidth={1.5} />
              <Text style={estilos.vacioTitulo}>Sin direcciones guardadas</Text>
              <Text style={estilos.vacioTexto}>Agregue la primera abajo.</Text>
            </View>
          }
          ListFooterComponent={
            <View style={estilos.agregar}>
              {escribiendo ? (
                /*
                 * Tres campos y nada más, como en Checkout.js. La referencia
                 * es la que de verdad usa el repartidor ("portón verde,
                 * frente a la cancha"), así que se pide pero no se obliga.
                 */
                <View style={[estilos.formulario, { borderColor: colores.marcaSuave }]}>
                  <TextInput
                    value={nueva.nombre}
                    onChangeText={(v) => setNueva((d) => ({ ...d, nombre: v }))}
                    placeholder="Nombre (Casa, Trabajo…)"
                    placeholderTextColor={COLORES.marcador}
                    style={estilos.campo}
                    accessibilityLabel="Nombre de la dirección"
                  />
                  <TextInput
                    value={nueva.direccion}
                    onChangeText={(v) => setNueva((d) => ({ ...d, direccion: v }))}
                    placeholder="Calle, número y colonia"
                    placeholderTextColor={COLORES.marcador}
                    style={estilos.campo}
                    accessibilityLabel="Dirección"
                  />
                  <TextInput
                    value={nueva.referencia}
                    onChangeText={(v) => setNueva((d) => ({ ...d, referencia: v }))}
                    placeholder="Referencia para encontrarla (opcional)"
                    placeholderTextColor={COLORES.marcador}
                    style={estilos.campo}
                    accessibilityLabel="Referencia"
                  />
                  <Boton
                    texto="Guardar dirección"
                    alPresionar={agregar}
                    cargando={guardando}
                    color={colores.marca}
                    colorPresionado={colores.marcaOscuro}
                  />
                  <Pressable
                    onPress={() => {
                      setEscribiendo(false);
                      setNueva({ nombre: '', direccion: '', referencia: '' });
                    }}
                    hitSlop={8}
                  >
                    <Text style={estilos.enlaceTenue}>Cancelar</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable onPress={() => setEscribiendo(true)} hitSlop={8}>
                  <Text style={[estilos.enlace, { color: colores.marca }]}>
                    {direcciones.length === 0 ? '+ Agregar mi primera dirección' : '+ Agregar otra dirección'}
                  </Text>
                </Pressable>
              )}
            </View>
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
  vacio: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
    gap: 8,
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
  agregar: {
    marginTop: 4,
  },
  formulario: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 9,
  },
  campo: {
    borderWidth: 1,
    borderColor: COLORES.borde,
    borderRadius: 10,
    paddingHorizontal: 13,
    height: 44,
    fontSize: 13.5,
    color: COLORES.texto,
    backgroundColor: COLORES.fondo,
    // Android le mete relleno propio a los TextInput y descuadra el alto.
    paddingVertical: 0,
  },
  enlace: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 4,
  },
  enlaceTenue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORES.textoSuave,
    textAlign: 'center',
    paddingVertical: 4,
  },
});

export default Direcciones;
