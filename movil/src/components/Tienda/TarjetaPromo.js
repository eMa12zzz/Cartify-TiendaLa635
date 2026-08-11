/*
 * ============================================================
 * TARJETA DE PROMOCIÓN
 * ============================================================
 * La cara de una promoción, copiada de `PromoCard.jsx`: el sello del ahorro,
 * cuánto le queda, el título y la descripción, sobre el degradado de su tema y
 * con su icono de marca de agua al fondo.
 *
 * ── Las tres capas, y por qué ese orden ──
 *
 *   1. El degradado (LinearGradient), que es el fondo.
 *   2. La marca de agua: el icono en grande, muy tenue. Es una CAPA, no un
 *      vecino que pelea por el espacio — el texto se dibuja encima, así que un
 *      título largo lo cruza sin problema y el icono nunca le quita lugar.
 *   3. El texto.
 *
 * Si la tienda sube una foto, esta ACOMPAÑA: se acomoda a la derecha y el
 * texto se queda legible a la izquierda. Para quien sí diseñó su banner
 * completo está `imagenCompleta`, que devuelve el comportamiento de imagen a
 * sangre. Es una decisión, no un accidente.
 *
 * ── El difuminado de la foto que acompaña ──
 *
 * Igual que la web, la foto se funde hacia la izquierda con el fondo. La web lo
 * hace con `maskImage`; aquí con MaskedView, que pinta la imagen SOLO donde su
 * máscara es opaca. La máscara es un degradado horizontal de transparente
 * (izquierda) a opaco (46%), así que por los huecos transparentes asoma el
 * degradado del fondo que ya está pintado detrás — y se funde con cualquier
 * tema, sea cual sea su color.
 * ============================================================
 */

import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
// El Image de expo-image y no el de react-native: el nativo no decodifica
// WebP/AVIF de forma fiable, y los banners que sube la tienda pueden venir en
// .webp desde Cloudinary.
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
// Para difuminar la foto que acompaña hacia el fondo, como la web con maskImage.
import MaskedView from '@react-native-masked-view/masked-view';
import { coloresDePromo } from '../../utils/temasPromo';
import { glifoDePromo, MaterialCommunityIcons } from '../../utils/iconosPromo';
import { Flecha, Reloj } from '../UI/Iconos';

// La misma proporción que la web (2.2:1), para que el texto respire igual.
const PROPORCION = 2.2;

const TarjetaPromo = ({ promo, etiqueta, vencimiento, ancho }) => {
  const [fallóImagen, setFallóImagen] = useState(false);
  const colores = coloresDePromo(promo);

  const hayImagen = !!promo?.image && !fallóImagen;
  const aSangre = hayImagen && promo.imagenCompleta;
  const acompaña = hayImagen && !promo.imagenCompleta;

  /*
   * Sobre fondos oscuros el texto es blanco; el acento entonces necesita letra
   * oscura para que se lea. Es la misma cuenta que hace la web.
   */
  const textoSobreAcento = colores.texto === '#FFFFFF' ? '#3D2B1A' : colores.texto;

  const glifo = glifoDePromo(promo?.icono);
  /*
   * La marca de agua se dibuja siempre que haya icono y NO haya foto. Con foto
   * serían dos cosas peleando por la mitad derecha de la tarjeta.
   */
  const marcaDeAgua = !!glifo && !hayImagen;
  const alto = ancho / PROPORCION;

  // Los dos colores del degradado, o el gris de respaldo cuando la promo trae
  // su banner completo y el degradado no se ve.
  const degradado = aSangre ? ['#EDE7E0', '#EDE7E0'] : colores.colores;

  return (
    /*
     * El primer color del degradado va TAMBIÉN como fondo del contenedor, y no
     * es redundante: es lo que sostiene la tarjeta si el degradado no llega a
     * pintarse.
     *
     * Sin esto el modo de fallo es el peor posible. El texto de casi todos los
     * temas es blanco —está pensado para ir sobre un fondo oscuro— así que una
     * tarjeta sin fondo no se ve "sin degradado": se ve VACÍA, con el título y
     * la descripción en blanco sobre blanco. Solo sobreviven el sello y la
     * flecha, que llevan color propio. Cuesta un `backgroundColor` y convierte
     * un fallo mudo en uno que apenas se nota.
     */
    <View
      style={[estilos.tarjeta, { width: ancho, height: alto, backgroundColor: degradado[0] }]}
    >
      {/*
        El degradado va de la esquina de arriba a la izquierda a la de abajo a
        la derecha: es lo que en CSS es `135deg`, que es lo que usa la web.
      */}
      <LinearGradient
        colors={degradado}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {marcaDeAgua && (
        <View style={estilos.marcaDeAgua} pointerEvents="none">
          <MaterialCommunityIcons
            name={glifo}
            /*
             * El 31% del ANCHO, como en la web (31cqw). Atado al ancho de la
             * tarjeta y no a un número fijo: la misma pieza se pinta a 600 px
             * en una tableta y a 300 en un teléfono, y un icono de 90 px se ve
             * discreto en la primera y enorme en la segunda.
             */
            size={ancho * 0.31}
            color={colores.acento}
          />
        </View>
      )}

      {/*
        La foto se pinta a través de una máscara de degradado: opaca a la
        derecha y desvaneciéndose hacia la izquierda, así se funde con el fondo
        en vez de cortarse con un borde duro. Es el equivalente del `maskImage`
        de la web. Por los huecos transparentes de la máscara se ve el degradado
        del fondo, que ya está pintado detrás.
      */}
      {acompaña && (
        <MaskedView
          style={estilos.imagenAcompana}
          pointerEvents="none"
          maskElement={
            <LinearGradient
              // Transparente al 0% y opaco al 46%, igual que la web
              // (`linear-gradient(to right, transparent 0%, #000 46%)`).
              colors={['transparent', '#000']}
              locations={[0, 0.46]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          }
        >
          <Image
            source={{ uri: promo.image }}
            contentFit="cover"
            style={StyleSheet.absoluteFill}
            onError={() => setFallóImagen(true)}
            accessible={false}
          />
        </MaskedView>
      )}

      {aSangre ? (
        <Image
          source={{ uri: promo.image }}
          contentFit="cover"
          style={estilos.imagenCompleta}
          onError={() => setFallóImagen(true)}
          accessibilityLabel={promo.title || promo.promoDescription || 'Promoción'}
        />
      ) : (
        <View style={estilos.contenido}>
          {(!!etiqueta || !!vencimiento) && (
            <View style={estilos.filaSellos}>
              {!!etiqueta && (
                <View style={[estilos.sello, { backgroundColor: colores.acento }]}>
                  <Text style={[estilos.selloTexto, { color: textoSobreAcento }]} numberOfLines={1}>
                    {etiqueta}
                  </Text>
                </View>
              )}

              {/* La urgencia va junto al ahorro: es la mitad del argumento. */}
              {!!vencimiento && (
                <View style={[estilos.vence, { borderColor: colores.acento }]}>
                  <Reloj size={11} color={colores.texto} grosor={1.3} />
                  <Text style={[estilos.venceTexto, { color: colores.texto }]} numberOfLines={1}>
                    {vencimiento}
                  </Text>
                </View>
              )}
            </View>
          )}

          <Text
            style={[estilos.titulo, { color: colores.texto, maxWidth: acompaña ? '62%' : '100%' }]}
            // Tope de dos líneas: un título largo empujaba la descripción fuera
            // de la tarjeta en vez de cortarse.
            numberOfLines={2}
          >
            {promo?.title || 'Su promoción se verá aquí'}
          </Text>

          {!!promo?.promoDescription && (
            <Text
              style={[
                estilos.descripcion,
                { color: colores.texto, maxWidth: acompaña ? '58%' : '78%' },
              ]}
              numberOfLines={2}
            >
              {promo.promoDescription}
            </Text>
          )}
        </View>
      )}

      <View
        style={[
          estilos.flecha,
          { backgroundColor: aSangre ? 'rgba(255,255,255,0.94)' : colores.flecha },
        ]}
      >
        <Flecha size={16} color={aSangre ? '#2A1A0E' : textoSobreAcento} />
      </View>
    </View>
  );
};

const estilos = StyleSheet.create({
  tarjeta: {
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    /*
     * Sombra bajita y en dos intenciones: `elevation` es la de Android y
     * shadow* la de iOS. Una sola mancha fuerte se veía como una alfombra
     * sucia debajo de la tarjeta, sobre todo con varias seguidas.
     */
    elevation: 3,
    shadowColor: '#5A3719',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  /*
   * Pegada a la derecha y centrada en vertical, como en la web. Va con la
   * opacidad puesta en el contenedor y no en el color del icono: así el mismo
   * 17% vale para cualquier acento, sin tener que armar un rgba a mano por
   * cada tema.
   */
  marcaDeAgua: {
    position: 'absolute',
    right: '5%',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    opacity: 0.17,
  },
  imagenAcompana: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '46%',
  },
  imagenCompleta: {
    width: '100%',
    height: '100%',
  },
  contenido: {
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  filaSellos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 9,
    flexWrap: 'wrap',
  },
  sello: {
    paddingVertical: 4,
    paddingHorizontal: 11,
    borderRadius: 999,
  },
  selloTexto: {
    fontWeight: '800',
    fontSize: 12.5,
    letterSpacing: 0.3,
  },
  vence: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 999,
  },
  venceTexto: {
    fontWeight: '600',
    fontSize: 10.5,
    opacity: 0.92,
  },
  titulo: {
    fontWeight: '800',
    fontSize: 20,
    lineHeight: 23,
    letterSpacing: -0.4,
  },
  descripcion: {
    fontSize: 12.5,
    lineHeight: 17,
    marginTop: 5,
    opacity: 0.85,
  },
  flecha: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
  },
});

export default TarjetaPromo;
