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
 * ── Por qué aquí arriba solo queda el carrito ──
 *
 * Había un segundo botón, el de la persona, que era la única puerta a la cuenta
 * y a cerrar sesión. Dejó de serlo cuando llegó la barra de abajo: la cuenta es
 * uno de sus cuatro apartados, está siempre en el mismo sitio y al alcance del
 * pulgar. Dos botones que llevan al mismo lugar, a un centímetro uno del otro,
 * no son dos caminos: son uno mal contado.
 *
 * El carrito sí se queda arriba, y no es incoherencia. La barra de abajo es
 * para CAMBIAR de apartado; el carrito no es un apartado, es lo que uno lleva
 * en la mano mientras recorre este. Su contador tiene que verse desde la
 * tienda, junto a los productos que lo van llenando.
 *
 * El asistente de voz no está aquí — tiene su propio apartado en la barra
 * de abajo.
 *
 * ── El menú de pasillos, que sí se sumó ──
 *
 * En la web tocar el nombre de la tienda despliega sus módulos (panadería,
 * farmacia...). Aquí lo mismo: el nombre es un botón con un icono de
 * hamburguesa al lado, y abre MenuPasillos — la hoja que sube desde abajo en
 * vez del dropdown de la web. Ver Inicio.js para quién guarda si está
 * abierto y utils/modulos.js para qué pasillos existen.
 * ============================================================
 */

import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Menu, ShoppingBag } from 'lucide-react-native';
import { COLORES } from '../../theme/colores';
import { ALTURA_ESTADO } from '../../theme/pantalla';
import { useTema } from '../../context/TemaContext';
import { Equis, Lupa } from '../UI/Iconos';
import MarcaTienda from '../UI/MarcaTienda';

const BarraTienda = ({ busqueda, alBuscar, cantidadItems = 0, alAbrirCarrito, alAbrirPasillos }) => {
  const { colores } = useTema();

  return (
  <View style={[estilos.barra, { paddingTop: ALTURA_ESTADO + 10 }]}>
    <View style={estilos.piso}>
      <Pressable
        onPress={alAbrirPasillos}
        accessibilityRole="button"
        accessibilityLabel="Pasillos de la tienda"
        hitSlop={6}
        style={({ pressed }) => [estilos.marca, pressed && { backgroundColor: colores.marcaTenue }]}
      >
        <Menu size={19} color="#6B7280" strokeWidth={2.2} />
        <MarcaTienda tamano={20} />
      </Pressable>

      <View style={estilos.acciones}>
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
          <ShoppingBag size={21} color={COLORES.texto} strokeWidth={2.2} />
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
  // El botón que abre los pasillos: hamburguesa + nombre, con su propio
  // relleno para que el tinte de "lo estoy tocando" no quede pegado al
  // texto.
  marca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 4,
    paddingRight: 10,
    paddingLeft: 2,
    borderRadius: 12,
    // Que no se estire hasta pegarse con el carrito en un nombre largo.
    flexShrink: 1,
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
  // El color lo pone la temporada en línea (ver arriba): aquí solo va la forma.
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
    // Píldora completa (mitad del alto), a juego con los campos del login y
    // con las pastillas de categoría de aquí abajo, que ya eran redondas.
    borderRadius: 22,
    paddingHorizontal: 16,
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
