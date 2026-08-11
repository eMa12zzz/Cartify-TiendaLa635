/*
 * ============================================================
 * BARRA DE LA TIENDA
 * ============================================================
 * El equivalente de `HeaderTienda.jsx`: el nombre de la tienda, el buscador y
 * el carrito con su contador.
 *
 * En la web las tres cosas caben en un renglón. Aquí no: un buscador usable
 * necesita casi todo el ancho del teléfono, y apretarlo entre el nombre y el
 * carrito lo dejaba en unos 120 px, donde no cabe ni "gaseosa". Por eso van en
 * dos pisos — marca y carrito arriba, buscador abajo— que es como resuelven
 * esto las tiendas que se usan desde el teléfono.
 *
 * Lo que NO se trajo del encabezado de la web: el menú de pasillos y el
 * asistente de voz. Los pasillos quedaron fuera del alcance de esta pantalla y
 * el asistente necesita micrófono, permisos y su propia dependencia.
 * ============================================================
 */

import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORES } from '../../theme/colores';
import { ALTURA_ESTADO } from '../../theme/pantalla';
import { useTema } from '../../context/TemaContext';
import { Bolsa, Equis, Lupa, Persona } from '../UI/Iconos';

const BarraTienda = ({
  busqueda,
  alBuscar,
  cantidadItems = 0,
  alAbrirCarrito,
  alAbrirCuenta,
  haySesion = false,
}) => {
  const { colores } = useTema();

  return (
  <View style={[estilos.barra, { paddingTop: ALTURA_ESTADO + 10 }]}>
    <View style={estilos.piso}>
      <View>
        <Text style={estilos.marcaChica}>Tienda</Text>
        <Text style={estilos.marcaNombre}>la 635</Text>
      </View>

      <View style={estilos.acciones}>
        {/*
          La cuenta. Con sesión lleva a sus datos y a cerrarla; sin sesión, a
          entrar. Es la única puerta a cerrar sesión que hay en la app: sin
          este botón, quien entra se queda dentro para siempre.
        */}
        <Pressable
          onPress={alAbrirCuenta}
          accessibilityRole="button"
          accessibilityLabel={haySesion ? 'Mi cuenta' : 'Iniciar sesión'}
          hitSlop={8}
          style={({ pressed }) => [
            estilos.botonRedondo,
            pressed && { borderColor: colores.marca, backgroundColor: colores.marcaSuave },
          ]}
        >
          <Persona size={20} color={COLORES.texto} />
          {/* El puntito café dice "hay sesión abierta" sin ocupar un renglón
              con el nombre, que en un teléfono no cabe al lado de la marca. */}
          {haySesion && <View style={[estilos.puntoSesion, { backgroundColor: colores.marca }]} />}
        </Pressable>

        <Pressable
          onPress={alAbrirCarrito}
          accessibilityRole="button"
          accessibilityLabel={
            cantidadItems > 0
              ? `Abrir el carrito, ${cantidadItems} en el carrito`
              : 'Abrir el carrito, está vacío'
          }
          hitSlop={8}
          style={({ pressed }) => [
            estilos.botonRedondo,
            pressed && { borderColor: colores.marca, backgroundColor: colores.marcaSuave },
          ]}
        >
          <Bolsa size={21} color={COLORES.texto} />
          {/*
            El contador solo aparece cuando hay algo. Un "0" permanente sobre el
            icono se lee como un error del sistema, no como un carrito vacío.
          */}
          {cantidadItems > 0 && (
            <View style={[estilos.contador, { backgroundColor: colores.marca }]}>
              <Text style={estilos.contadorTexto}>
                {/* Más de 99 no cabe en el círculo y tampoco aporta: a esas
                    alturas lo que importa es "muchos". */}
                {cantidadItems > 99 ? '99+' : cantidadItems}
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>

    <View style={estilos.buscador}>
      <Lupa size={17} color={COLORES.marcador} />
      <TextInput
        value={busqueda}
        onChangeText={alBuscar}
        placeholder="Buscar en la tienda"
        placeholderTextColor={COLORES.marcador}
        style={estilos.campo}
        // El teclado muestra "buscar" en vez de un salto de línea, y filtrar
        // ya pasa con cada letra, así que aceptar solo cierra el teclado.
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        // En iOS aparece su propia equis; se apaga para no tener dos.
        clearButtonMode="never"
      />
      {/*
        La equis para borrar. En un teléfono, dejar la búsqueda limpia con el
        teclado son ocho retrocesos; sin ella, mucha gente se queda con el
        filtro puesto y cree que la tienda solo tiene esos cuatro productos.
      */}
      {!!busqueda && (
        <Pressable
          onPress={() => alBuscar('')}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Borrar la búsqueda"
        >
          <Equis size={15} color={COLORES.textoSuave} />
        </Pressable>
      )}
    </View>
  </View>
  );
};

const estilos = StyleSheet.create({
  barra: {
    backgroundColor: COLORES.fondo,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.linea,
    gap: 12,
  },
  piso: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  acciones: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  botonRedondo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORES.linea,
  },
  // El color de estos dos lo pone la temporada en línea (ver arriba): aquí
  // solo va la forma.
  puntoSesion: {
    position: 'absolute',
    top: 5,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORES.fondo,
  },
  contador: {
    position: 'absolute',
    top: 1,
    right: 1,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    // El aro blanco despega el contador del icono que tiene debajo.
    borderWidth: 1.5,
    borderColor: COLORES.fondo,
  },
  contadorTexto: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
    borderColor: COLORES.borde,
    borderRadius: 10,
    paddingHorizontal: 12,
    // 44 de alto: es un campo, y los campos también se tocan.
    height: 44,
  },
  campo: {
    flex: 1,
    fontSize: 14.5,
    color: COLORES.texto,
    // Android le mete relleno propio a los TextInput y descuadra el alto.
    paddingVertical: 0,
  },
});

export default BarraTienda;
