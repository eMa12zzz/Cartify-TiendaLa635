/*
 * ============================================================
 * DETALLE DE PROMOCIÓN
 * ============================================================
 * Qué trae una promoción. Se abre al tocar su tarjeta en el carrusel, igual
 * que en la web (`PromoDetailModal.jsx`).
 *
 * Existe por una razón concreta: antes, tocar el banner solo filtraba la lista
 * de abajo, sin avisar. El toque no se sentía como que hubiera pasado algo, y
 * la gente lo tocaba dos y tres veces.
 *
 * Los productos que se ven aquí salen del catálogo ya mapeado, no de
 * `promo.items`: así se muestran con su precio de oferta y su stock real, los
 * mismos que verá en la tienda. Ver TiendaContext.
 * ============================================================
 */

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORES } from '../../theme/colores';
import { useTema } from '../../context/TemaContext';
import Boton from '../UI/Boton';
import { Equis } from '../UI/Iconos';
import { useBotonAtras } from '../../hooks/useBotonAtras';
import { etiquetaPromo, textoVencimiento } from '../../utils/promos';
import TarjetaPromo from './TarjetaPromo';
import TarjetaProducto from './TarjetaProducto';
import { AIRE_ABAJO_MINIMO, ALTURA_BARRA_FLOTANTE } from '../UI/BarraInferior';

// Solo se abre desde Inicio (el carrusel de promos de la tienda), así que a
// diferencia de ModalProducto no hace falta un prop: la píldora flotante
// SIEMPRE está detrás.
const ModalPromo = ({ promo, productos, alCerrar, alVerEnTienda, alVerProducto, alAgregar }) => {
  const { colores } = useTema();
  const { bottom } = useSafeAreaInsets();
  useBotonAtras(alCerrar);

  if (!promo) return null;

  return (
    /*
     * Vista sobre la pantalla y no <Modal>, por lo mismo que el detalle de
     * producto: aquí se puede agregar al carrito SIN cerrar la hoja —una
     * promoción trae varios productos y se llevan varios— así que el aviso de
     * "agregado" tiene que poder verse. Con Modal quedaba debajo.
     */
    <View style={estilos.capa}>
      <View style={estilos.fondo}>
        <Pressable style={estilos.zonaCierre} onPress={alCerrar} accessibilityLabel="Cerrar" />

        <View style={estilos.panel}>
          <View style={estilos.encabezado}>
            <View style={estilos.asa} />
            <Pressable
              onPress={alCerrar}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Cerrar la promoción"
              style={estilos.cerrar}
            >
              <Equis size={16} color={COLORES.textoSuave} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={estilos.contenido} bounces={false}>
            {/*
              La misma tarjeta del carrusel, no un encabezado distinto: quien
              tocó un banner café con "2x1" tiene que ver ese mismo banner al
              abrirse, o parece que entró a otra cosa.

              El ancho va fijo al del panel menos sus márgenes; TarjetaPromo
              saca su alto de ahí.
            */}
            <View style={estilos.zonaTarjeta}>
              <TarjetaPromoAncho promo={promo} />
            </View>

            {productos.length === 0 ? (
              <Text style={estilos.vacio}>
                Los productos de esta promoción no están disponibles en este momento.
              </Text>
            ) : (
              <>
                <Text style={estilos.titulo}>
                  {productos.length === 1
                    ? '1 producto en esta promoción'
                    : `${productos.length} productos en esta promoción`}
                </Text>

                {/*
                  Dos columnas, igual que la portada. Se arma con `flexWrap` y
                  no con FlatList porque ya vamos dentro de un ScrollView, y
                  anidar dos listas que se desplazan en el mismo sentido es
                  justo lo que React Native avisa que no se haga.
                */}
                <View style={estilos.cuadricula}>
                  {productos.map((p) => (
                    <View key={p.id} style={estilos.celda}>
                      <TarjetaProducto
                        producto={p}
                        alVerDetalle={alVerProducto}
                        alAgregar={alAgregar}
                      />
                    </View>
                  ))}
                </View>
              </>
            )}
          </ScrollView>

          <View
            style={[
              estilos.pie,
              { paddingBottom: 26 + Math.max(bottom, AIRE_ABAJO_MINIMO) + ALTURA_BARRA_FLOTANTE },
            ]}
          >
            <Boton
              texto="Ver todos en la tienda"
              alPresionar={alVerEnTienda}
              color={colores.marca}
              colorPresionado={colores.marcaOscuro}
              estilo={estilos.botonRedondo}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

/*
 * La tarjeta necesita saber cuánto mide para calcular su alto. Dentro del
 * modal eso no se sabe hasta que el panel se dibuja, así que se mide.
 */
const TarjetaPromoAncho = ({ promo }) => {
  const [ancho, setAncho] = useState(0);

  return (
    <View onLayout={(e) => setAncho(e.nativeEvent.layout.width)}>
      {ancho > 0 && (
        <TarjetaPromo
          promo={promo}
          etiqueta={etiquetaPromo(promo)}
          vencimiento={textoVencimiento(promo)}
          ancho={ancho}
        />
      )}
    </View>
  );
};

const estilos = StyleSheet.create({
  capa: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    elevation: 10,
  },
  fondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  zonaCierre: {
    flex: 1,
  },
  panel: {
    backgroundColor: COLORES.fondo,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '88%',
  },
  encabezado: {
    paddingTop: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  asa: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORES.borde,
  },
  // Misma esquina que la "X" de ModalProducto (right:10, top:8), no la que
  // traía antes: las dos hojas se abren una detrás de otra en la misma
  // tienda y debían sentirse iguales, no cada una a su manera.
  cerrar: {
    position: 'absolute',
    right: 10,
    top: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contenido: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
  },
  zonaTarjeta: {
    marginBottom: 20,
  },
  titulo: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORES.tituloVentaja,
    marginBottom: 12,
  },
  cuadricula: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  celda: {
    /*
     * Dos por fila, contando el hueco de 12 que las separa. Sin `flexGrow`
     * a propósito: con él, una promoción de tres productos dejaba al tercero
     * estirado a todo lo ancho, del doble de tamaño que sus dos hermanos.
     */
    width: '48%',
  },
  vacio: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORES.textoSuave,
    textAlign: 'center',
    paddingVertical: 24,
  },
  pie: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 26,
    borderTopWidth: 1,
    borderTopColor: COLORES.linea,
  },
  // Píldora completa, a juego con el resto de botones de la app — el Boton
  // base trae 8 de esquina, pensado para otros usos.
  botonRedondo: {
    borderRadius: 28,
  },
});

export default ModalPromo;
