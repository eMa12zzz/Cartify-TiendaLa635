import { useState } from 'react';
import toast from 'react-hot-toast';
import { aiService } from '../api/aiService';

/*
 * usePromoAI — la IA escribe el TEXTO de la promoción.
 *
 * Antes este hook también armaba el banner en un canvas y lo subía como
 * imagen. Se quitó: quedaba congelado (cambiar una palabra obligaba a
 * regenerar y volver a subir), el texto se veía borroso al escalar, y el
 * resultado era siempre el mismo molde. Ahora la tarjeta se dibuja en la
 * tienda con el tema de colores que elija el empleado, así que se puede
 * ajustar cuando sea sin regenerar nada.
 *
 * La IA hace lo que hace bien: encontrar el gancho y escribirlo.
 */
export const usePromoAI = () => {
  const [generando, setGenerando] = useState(false);

  const generarPromo = async ({ tipo, items, buyQty, payQty }) => {
    if (!items?.length) {
      toast.error('Primero agrega los productos de la promoción');
      return null;
    }

    /*
     * NO se lanza un toast de "redactando".
     *
     * El aviso salia arriba a la derecha, lejos del boton que se acababa de
     * tocar, y se iba solo a los pocos segundos: quien miraba el formulario no
     * tenia como saber si la IA seguia trabajando o si ya habia terminado y no
     * habia pasado nada. Ahora quien avisa es un circulo girando EN EL BOTON,
     * que dura exactamente lo que dura el trabajo. Ver PromotionFormModal.
     *
     * El error si se queda en toast: es una interrupcion, y tiene que
     * interrumpir.
     */
    setGenerando(true);
    try {
      const copy = await aiService.generarCopyPromo({
        type: tipo,
        buyQty: Number(buyQty) || 2,
        payQty: Number(payQty) || 1,
        items: items.map((it) => ({
          productId: it.productId,
          discount: Number(it.discount) || 0,
          fixedPrice: it.fixedPrice === '' || it.fixedPrice == null ? null : Number(it.fixedPrice),
        })),
      });

      /*
       * De donde salio el texto viaja en `copy.origen` y lo pinta el
       * formulario debajo del boton: si la IA no estaba disponible el servidor
       * responde con plantillas, y se vale saberlo. Antes eso era un toast que
       * se iba solo; ahora se queda a la vista mientras se revisa el texto.
       */
      return copy;
    } catch (error) {
      const mensaje = error?.response?.data?.message || 'No se pudo generar el texto';
      toast.error(mensaje, { duration: 5000 });
      return null;
    } finally {
      setGenerando(false);
    }
  };

  return { generando, generarPromo };
};
