/*
 * ============================================================
 * TARJETA DE PRODUCTO
 * ============================================================
 * La cara de un producto en la portada. Copia de
 * `frontend/src/components/Store/ProductCard.jsx`, con una ausencia a
 * propósito: el crecer al pasar el cursor. En una pantalla táctil no hay
 * cursor, y el propio comentario de la web dice que ese efecto es solo del
 * ratón porque con el dedo se queda pegado. Lo que sí se conserva es el
 * hundido al apretar, que es lo que el dedo recibe a cambio.
 *
 * ── El corazón: relleno gris en vez de contorno ──
 *
 * La web usa los caracteres ♡ y ♥ — hueco cuando no está marcado, lleno
 * cuando sí. Aquí los iconos se dibujan con Views (ver UI/Iconos.js) y el
 * corazón es un cuadrado girado con dos bolitas encima: hacerle un contorno
 * pide dibujar la silueta entera de nuevo, y a 17 píxeles el borde saldría
 * dentado. Así que la diferencia la marca el color, que a ese tamaño se lee
 * mejor de todos modos: gris apagado contra rojo.
 * ============================================================
 */

import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORES } from '../../theme/colores';
import { useTema } from '../../context/TemaContext';
import { useFavoritos } from '../../context/FavoritosContext';
import { Corazon, Mas, Paquete } from '../UI/Iconos';
import { esPorLibra, esSoloAdultos, piezasEnTexto } from '../../utils/unidades';

// El rojo del corazón encendido. No sale del tema: es el rojo de "me gusta" de
// toda la vida, y en Navidad —donde el acento YA es rojo— un corazón del color
// del tema se confundiría con el sello de la promoción.
const ROJO_FAVORITO = '#FF4D6D';

// El sello de la promo, con las mismas palabras que la web.
const selloDePromo = (promo) => {
  if (!promo) return null;
  if (promo.type === 'nxm') return `${promo.buyQty}x${promo.payQty}`;
  if (promo.type === 'descuento') return `-${promo.discount}%`;
  if (promo.type === 'anuncio') return promo.etiqueta || 'Nuevo';
  return 'Oferta';
};

const TarjetaProducto = ({ producto, alVerDetalle, alAgregar }) => {
  const [fallóImagen, setFallóImagen] = useState(false);
  const { colores } = useTema();
  const { esFavorito, alternar } = useFavoritos();

  const bajoStock = producto.stock < 10;
  const sello = selloDePromo(producto.promo);
  const contenido = !esPorLibra(producto) ? piezasEnTexto(producto) : null;
  const marcado = esFavorito(producto.id);

  return (
    <Pressable
      onPress={() => alVerDetalle?.(producto)}
      accessibilityRole="button"
      accessibilityLabel={`${producto.nombre}, $${Number(producto.precio).toFixed(2)}`}
      style={({ pressed }) => [estilos.tarjeta, pressed && estilos.tarjetaPresionada]}
    >
      <View style={estilos.marcoImagen}>
        {producto.imagen && !fallóImagen ? (
          <Image
            source={{ uri: producto.imagen }}
            /*
             * `contain` y no `cover`: con cover se recorta lo que sobra para
             * llenar la caja, y a una foto vertical le come la mitad. Las fotos
             * vienen de mil tamaños distintos (unas del proveedor, otras del
             * celular), así que ninguna caja fija les queda bien a todas.
             */
            resizeMode="contain"
            style={estilos.imagen}
            onError={() => setFallóImagen(true)}
          />
        ) : (
          <Paquete size={38} />
        )}
      </View>

      {/*
        El sello va anclado a la TARJETA y no al marco de la foto: dentro del
        marco, el relleno lo empujaría hacia adentro y quedaría flotando en
        medio de la imagen.
      */}
      {sello && (
        <View style={[estilos.sello, { backgroundColor: colores.marca }]}>
          <Text style={estilos.selloTexto} numberOfLines={1}>{sello}</Text>
        </View>
      )}

      {/*
        El corazón. Mide 32 y se toca con `hitSlop` hasta 44: el diseño pide
        que sea discreto —no puede robarle protagonismo a la foto— pero un
        pulgar necesita 44, y fallarlo aquí no es inocente, porque el toque
        cae en la tarjeta y abre el producto en vez de marcar el favorito.
      */}
      <Pressable
        onPress={() => alternar(producto.id, producto.nombre)}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityState={{ selected: marcado }}
        accessibilityLabel={
          marcado ? `Quitar ${producto.nombre} de favoritos` : `Guardar ${producto.nombre} en favoritos`
        }
        style={({ pressed }) => [estilos.corazon, pressed && estilos.corazonPresionado]}
      >
        <Corazon size={16} color={marcado ? ROJO_FAVORITO : '#D2CCC6'} />
      </Pressable>

      <View style={estilos.cuerpo}>
        {!!producto.marca && (
          <Text style={estilos.marca} numberOfLines={1}>{producto.marca.toUpperCase()}</Text>
        )}

        <View style={estilos.filaNombre}>
          <Text style={estilos.nombre} numberOfLines={2}>{producto.nombre}</Text>
          {/*
            El +18 pegado al nombre: es una condición para comprarlo, no un
            adorno. Mejor enterarse aquí que en la puerta de la casa.
          */}
          {esSoloAdultos(producto) && (
            <View style={estilos.marca18}>
              <Text style={estilos.marca18Texto}>+18</Text>
            </View>
          )}
        </View>

        {/*
          Solo se avisa cuando se está acabando o cuando ya no hay. Poner
          "100 disponibles" en cada tarjeta le enseña el inventario al cliente
          sin que le sirva de nada; lo que sí lo mueve es saber que quedan pocas.
        */}
        {producto.stock === 0 ? (
          <Text style={estilos.stock}>Agotado</Text>
        ) : bajoStock ? (
          <Text style={estilos.stock}>¡Quedan pocas!</Text>
        ) : null}

        <View style={estilos.filaPrecio}>
          <View style={estilos.bloquePrecio}>
            {!!producto.precioAnterior && (
              <Text style={estilos.precioViejo}>${Number(producto.precioAnterior).toFixed(2)}</Text>
            )}
            {/*
              El "/lb" pegado al precio y no en un renglón aparte: es parte del
              precio, no un dato adicional. Sin él, "$1.25" en un tomate se lee
              como lo que cuesta ese tomate. Ver utils/unidades.js.
            */}
            <Text style={estilos.precio} numberOfLines={1}>
              ${Number(producto.precio).toFixed(2)}
              {esPorLibra(producto) && <Text style={estilos.porUnidad}>/lb</Text>}
            </Text>
            {!!contenido && <Text style={estilos.contenido}>{contenido}</Text>}
          </View>

          {/*
            El botón es NEGRO, no café: el acento de la marca es el café, y el
            negro hace que la acción de agregar resalte sobre él en vez de
            competirle.

            `hitSlop` es el equivalente del rectángulo invisible que la web le
            pone con un pseudo-elemento: el cuadro se ve de 38 y se toca de 48.
            Errarle a este botón cuesta una venta.
          */}
          <Pressable
            onPress={() => alAgregar?.(producto)}
            disabled={producto.stock === 0}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Agregar ${producto.nombre} al carrito`}
            style={({ pressed }) => [
              estilos.botonMas,
              pressed && estilos.botonMasPresionado,
              producto.stock === 0 && estilos.botonMasApagado,
            ]}
          >
            <Mas size={15} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};

const estilos = StyleSheet.create({
  tarjeta: {
    backgroundColor: COLORES.fondo,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
    /*
     * `width: '100%'` y NO `flex: 1`, aunque flex sea lo que uno escribe.
     *
     * Quien manda el ancho es la celda que la envuelve —flexible en la
     * cuadrícula, fija de 160 en la fila de "Más vendidos"— y la tarjeta solo
     * lo llena. Con `flex: 1` aquí, dentro de la celda de ancho fijo la
     * tarjeta pasa a tener flexBasis 0: la celda no tiene alto propio, calcula
     * el suyo sumando lo que aportan sus hijos, y ese 0 le deja alto CERO. La
     * fila entera se veía como una franja vacía.
     */
    width: '100%',
  },
  tarjetaPresionada: {
    transform: [{ scale: 0.98 }],
    borderColor: COLORES.lineaCard,
  },
  /*
   * El marco de la foto: un panel redondeado DENTRO de la tarjeta, con aire
   * alrededor. No es adorno — le da a cada producto el mismo escenario. Con
   * fotos de proveedores distintos la fila se veía despareja; encuadradas
   * todas igual, la vista compara productos en vez de tropezar con las fotos.
   */
  marcoImagen: {
    backgroundColor: '#F4F4F5',
    height: 130,
    margin: 8,
    marginBottom: 0,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    overflow: 'hidden',
  },
  imagen: {
    width: '100%',
    height: '100%',
  },
  sello: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    // Deja sitio al corazón de la derecha: sin el tope, un "Fresquitos" largo
    // se le metía debajo.
    maxWidth: '60%',
    zIndex: 2,
  },
  corazon: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },
  corazonPresionado: {
    transform: [{ scale: 0.9 }],
  },
  selloTexto: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  cuerpo: {
    padding: 10,
    paddingTop: 9,
    flex: 1,
  },
  marca: {
    fontSize: 9.5,
    color: '#AAAAAA',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  filaNombre: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
  },
  nombre: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#111111',
    lineHeight: 17,
    flexShrink: 1,
  },
  /*
   * El +18 va en el rojo de los avisos y no en el café de la marca: no es una
   * característica que se presume, es una condición para poder comprarlo.
   */
  marca18: {
    backgroundColor: COLORES.error,
    borderRadius: 999,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginTop: 1,
  },
  marca18Texto: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  // En el diseño el aviso de existencias siempre va en rojo: es lo que empuja
  // a comprar.
  stock: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#D8542C',
    marginTop: 3,
  },
  filaPrecio: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: 10,
    gap: 6,
  },
  bloquePrecio: {
    flexShrink: 1,
  },
  precioViejo: {
    fontSize: 10.5,
    color: '#BBBBBB',
    textDecorationLine: 'line-through',
  },
  precio: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111111',
  },
  // El "/lb" más chico y más tenue que el número: acompaña al precio, no
  // compite con él. Del mismo tamaño se leería como parte de la cifra.
  porUnidad: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORES.textoTenue,
  },
  contenido: {
    fontSize: 10.5,
    fontWeight: '500',
    color: COLORES.textoTenue,
    marginTop: 1,
  },
  botonMas: {
    backgroundColor: COLORES.tituloFuerte,
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonMasPresionado: {
    backgroundColor: '#000000',
    transform: [{ scale: 0.95 }],
  },
  /*
   * El "+" de un producto agotado va GRIS, no en el café apagado de la marca.
   * Ese café es el del botón deshabilitado de las pantallas de sesión, y en
   * una tienda pintada de verde por Navidad un botón marrón no se lee como
   * "apagado": se lee como un color suelto que nadie eligió.
   */
  botonMasApagado: {
    backgroundColor: '#D6D3D1',
  },
});

export default TarjetaProducto;
