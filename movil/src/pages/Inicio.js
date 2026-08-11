/*
 * ============================================================
 * INICIO — la portada de la tienda
 * ============================================================
 * El equivalente de `frontend/src/pages/Store.jsx`, en el corte que le toca a
 * esta pantalla: encabezado con buscador y carrito, pastillas de categoría,
 * carrusel de promociones, la fila de "Más vendidos" y la cuadrícula con todo
 * el catálogo.
 *
 * ── Por qué la cuadrícula es un FlatList y no un ScrollView con vistas ──
 *
 * Es LA decisión de esta pantalla. Una tienda puede tener cientos de
 * productos, y un ScrollView monta todos sus hijos de una vez: se abriría con
 * varios segundos de pantalla en blanco y el desplazamiento iría a tirones.
 * FlatList solo dibuja lo que se ve.
 *
 * De ahí sale la forma rara del archivo: todo lo que va ARRIBA de la
 * cuadrícula —barra, pastillas, promos, más vendidos— es el
 * `ListHeaderComponent` de esa misma lista, en vez de vivir en un contenedor
 * aparte. Puesto aparte, la parte de arriba se quedaría fija y solo se
 * desplazaría la cuadrícula, que no es como se lee una tienda.
 *
 * ── Lo que decide qué se ve ──
 *
 * Con una categoría elegida, una búsqueda escrita o una promo filtrando, la
 * portada se calla: se van las promos y los más vendidos, y queda la lista de
 * lo que se pidió. Mismo criterio que la web (`showTrending`) — quien está
 * buscando "leche" no quiere que le sigan ofreciendo otra cosa.
 * ============================================================
 */

import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORES } from '../theme/colores';
import { useTienda } from '../context/TiendaContext';
import { useTema } from '../context/TemaContext';
import BarraTienda from '../components/Tienda/BarraTienda';
import CintaTemporada from '../components/Tienda/CintaTemporada';
import DecoracionTemporada from '../components/Tienda/DecoracionTemporada';
import PastillasCategoria from '../components/Tienda/PastillasCategoria';
import CarruselPromos from '../components/Tienda/CarruselPromos';
import FilaProductos from '../components/Tienda/FilaProductos';
import TarjetaProducto from '../components/Tienda/TarjetaProducto';
import ModalProducto from '../components/Tienda/ModalProducto';
import ModalPromo from '../components/Tienda/ModalPromo';
import Boton from '../components/UI/Boton';
import { Equis, Lupa } from '../components/UI/Iconos';

const Inicio = ({ irACarrito, irACuenta, irASeccion, haySesion }) => {
  const { colores } = useTema();
  const {
    cargando,
    errorCarga,
    recargar,
    categorias,
    categoriaSeleccionada,
    setCategoriaSeleccionada,
    terminoBusqueda,
    setTerminoBusqueda,
    productosFiltrados,
    productosDestacados,
    secciones,
    promosDelCarrusel,
    promoSeleccionada,
    setPromoSeleccionada,
    promoDetalle,
    productosDePromo,
    abrirPromo,
    cerrarPromo,
    verPromoEnTienda,
    cantidadItems,
    agregarAlCarrito,
  } = useTienda();

  const [productoAbierto, setProductoAbierto] = useState(null);

  const verDetalle = useCallback((producto) => setProductoAbierto(producto), []);

  // La portada completa solo cuando no se está filtrando nada.
  const mostrarPortada = !categoriaSeleccionada && !terminoBusqueda && !promoSeleccionada;

  const encabezado = (
    <View>
      {/*
        La cinta va DENTRO del encabezado de la lista y no arriba, junto a la
        barra: la barra se queda fija y la cinta tiene que irse con el scroll.
        Pegada arriba se llevaría su alto en todas las pantallas, todo el año,
        para nada.
      */}
      <CintaTemporada />

      <PastillasCategoria
        categorias={categorias}
        seleccionada={categoriaSeleccionada}
        alSeleccionar={setCategoriaSeleccionada}
      />

      {/* La chapita para soltar el filtro de una promo. Sin ella, la única
          salida sería adivinar que hay que tocar "Todos". */}
      {!!promoSeleccionada && (
        <View style={estilos.filaPromoActiva}>
          <Text style={[estilos.promoActivaTexto, { color: colores.marca }]} numberOfLines={1}>
            Promo: {promoSeleccionada.title || promoSeleccionada.promoDescription}
          </Text>
          <Pressable
            onPress={() => setPromoSeleccionada(null)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Ver todos los productos"
            style={({ pressed }) => [
              estilos.quitarPromo,
              pressed && { borderColor: colores.marca, backgroundColor: colores.marcaSuave },
            ]}
          >
            <Equis size={11} color={COLORES.textoVentaja} />
            <Text style={estilos.quitarPromoTexto}>Ver todos</Text>
          </Pressable>
        </View>
      )}

      {mostrarPortada && promosDelCarrusel.length > 0 && (
        <CarruselPromos promos={promosDelCarrusel} alElegirPromo={abrirPromo} />
      )}

      {mostrarPortada && productosDestacados.length > 0 && (
        <View style={estilos.seccionDestacados}>
          <View style={estilos.tituloDestacados}>
            {/* El punto verde de "en vivo" que la web anima. Aquí va fijo:
                animarlo obligaría a tener un Animated corriendo siempre, y lo
                que comunica —que esto se mueve solo— ya lo dice el color. */}
            <View style={estilos.puntoVivo} />
            <Text style={estilos.tituloSeccion}>Más vendidos</Text>
          </View>

          <FlatList
            data={productosDestacados}
            keyExtractor={(p) => p.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={estilos.filaDestacados}
            renderItem={({ item }) => (
              <View style={estilos.celdaDestacado}>
                <TarjetaProducto producto={item} alVerDetalle={verDetalle} alAgregar={agregarAlCarrito} />
              </View>
            )}
          />
        </View>
      )}

      {/*
        Las filas que se arman solas con el inventario ("Se están acabando",
        "Nuevos en la tienda"). Si en este momento no hay datos para armar
        alguna —una tienda con todo el stock lleno no tiene nada acabándose—
        sencillamente no se pinta. Ver utils/secciones.js.
      */}
      {mostrarPortada &&
        secciones.map((seccion) => (
          <FilaProductos
            key={seccion.clave}
            seccion={seccion}
            alVerTodos={() => irASeccion?.(seccion)}
            alVerDetalle={verDetalle}
            alAgregar={agregarAlCarrito}
          />
        ))}

      <View style={estilos.encabezadoCatalogo}>
        <Text style={estilos.tituloSeccion}>
          {categoriaSeleccionada || (terminoBusqueda ? `"${terminoBusqueda}"` : 'Todos los productos')}
        </Text>
        <Text style={estilos.conteo}>
          {productosFiltrados.length} {productosFiltrados.length === 1 ? 'producto' : 'productos'}
        </Text>
      </View>
    </View>
  );

  const vacio = (
    <View style={estilos.vacio}>
      <Lupa size={34} color={COLORES.marcador} grosor={1.5} />
      {/*
        Una tienda recién montada está vacía hasta que le carguen productos.
        Decir 'No hay productos para ""' hacía parecer que la tienda estaba rota.
      */}
      <Text style={estilos.vacioTexto}>
        {terminoBusqueda || categoriaSeleccionada
          ? `No hay productos para "${terminoBusqueda || categoriaSeleccionada}"`
          : 'Todavía no hay productos en la tienda'}
      </Text>
    </View>
  );

  return (
    <View style={estilos.pantalla}>
      {/*
        Las figuras de temporada van PRIMERAS en el árbol para quedar detrás de
        todo: en React Native pinta encima lo que va después. La lista no tiene
        fondo propio, así que los copos se ven por los huecos entre tarjetas —
        que es exactamente donde tienen que verse.
      */}
      <DecoracionTemporada />

      <BarraTienda
        busqueda={terminoBusqueda}
        alBuscar={setTerminoBusqueda}
        cantidadItems={cantidadItems}
        alAbrirCarrito={irACarrito}
        alAbrirCuenta={irACuenta}
        haySesion={haySesion}
      />

      {cargando ? (
        <View style={estilos.centro}>
          <ActivityIndicator size="large" color={colores.marca} />
        </View>
      ) : errorCarga ? (
        /*
         * El error se muestra con su texto y con un botón para reintentar. En
         * un teléfono "no hay productos" y "no hay internet" se ven igual, y
         * el segundo tiene arreglo — pero solo si se dice cuál de los dos es.
         */
        <View style={estilos.centro}>
          <Text style={estilos.errorTitulo}>No se pudo cargar la tienda</Text>
          <Text style={estilos.errorTexto}>{errorCarga}</Text>
          <View style={estilos.botonError}>
            <Boton
              texto="Reintentar"
              alPresionar={recargar}
              color={colores.marca}
              colorPresionado={colores.marcaOscuro}
            />
          </View>
        </View>
      ) : (
        <FlatList
          data={productosFiltrados}
          keyExtractor={(p) => p.id}
          numColumns={2}
          ListHeaderComponent={encabezado}
          ListEmptyComponent={vacio}
          columnWrapperStyle={estilos.fila}
          contentContainerStyle={estilos.lista}
          renderItem={({ item }) => (
            /*
             * El tope de ancho es lo que arregla la última fila impar. Con
             * `flex: 1` a secas —que es lo que la tarjeta necesita para que
             * las dos de una fila midan igual— un producto solo en la última
             * fila se estiraba a lo ancho de la pantalla, del doble de tamaño
             * que todos los demás. El 48.5% es el ancho que ya tiene cuando
             * está acompañado, así que en las filas completas no cambia nada.
             */
            <View style={estilos.celda}>
              <TarjetaProducto producto={item} alVerDetalle={verDetalle} alAgregar={agregarAlCarrito} />
            </View>
          )}
          // Cierra el teclado al empezar a desplazar: con el teclado abierto se
          // ve una sola fila de productos.
          keyboardDismissMode="on-drag"
        />
      )}

      {productoAbierto && (
        <ModalProducto
          producto={productoAbierto}
          alCerrar={() => setProductoAbierto(null)}
          alAgregar={agregarAlCarrito}
        />
      )}

      {promoDetalle && (
        <ModalPromo
          promo={promoDetalle}
          productos={productosDePromo}
          alCerrar={cerrarPromo}
          alVerEnTienda={() => verPromoEnTienda(promoDetalle)}
          alVerProducto={(p) => {
            // Cerrar la promo antes de abrir el producto: dos hojas encima de
            // la otra dejan la de abajo imposible de cerrar.
            cerrarPromo();
            setProductoAbierto(p);
          }}
          alAgregar={agregarAlCarrito}
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
  /*
   * ── Dónde vive el relleno lateral ──
   *
   * NO en el contenedor de la lista, aunque sea lo primero que uno escribe.
   * El encabezado va DENTRO de ese contenedor, y las pastillas de categoría y
   * el carrusel de promos tienen que ir de orilla a orilla: con el relleno
   * puesto arriba, las pastillas arrancaban a 32 px del borde y la última
   * quedaba cortada sin poder alcanzarla, porque el recorte de la lista le
   * caía encima antes de terminar de deslizarse.
   *
   * Así que el relleno se reparte: las filas de la cuadrícula lo ponen ellas
   * (`fila`), y cada pieza del encabezado que no sea deslizable lo pone la
   * suya. Las que sí se deslizan traen el suyo por dentro y llegan al borde.
   */
  lista: {
    paddingBottom: 28,
  },
  fila: {
    gap: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  celda: {
    flex: 1,
    maxWidth: '48.5%',
  },
  filaPromoActiva: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  promoActivaTexto: {
    flexShrink: 1,
    fontSize: 13.5,
    fontWeight: '700',
  },
  quitarPromo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: COLORES.borde,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 11,
  },
  quitarPromoTexto: {
    fontSize: 12.5,
    color: COLORES.textoVentaja,
    fontWeight: '500',
  },
  seccionDestacados: {
    marginTop: 18,
  },
  tituloDestacados: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  puntoVivo: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  tituloSeccion: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORES.tituloFuerte,
    letterSpacing: -0.3,
  },
  filaDestacados: {
    gap: 12,
    paddingBottom: 4,
    paddingHorizontal: 16,
  },
  celdaDestacado: {
    // Ancho fijo: en una fila horizontal las tarjetas no tienen de dónde sacar
    // su medida, y sin esto se encogen al ancho de su texto.
    width: 160,
  },
  encabezadoCatalogo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 26,
    marginBottom: 14,
    paddingHorizontal: 16,
  },
  conteo: {
    fontSize: 12.5,
    fontWeight: '500',
    color: COLORES.subtitulo,
  },
  vacio: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
    paddingHorizontal: 32,
    gap: 12,
  },
  vacioTexto: {
    fontSize: 14.5,
    color: COLORES.textoSuave,
    textAlign: 'center',
  },
});

export default Inicio;
