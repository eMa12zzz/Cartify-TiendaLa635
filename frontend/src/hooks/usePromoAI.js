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

    setGenerando(true);
    const aviso = toast.loading('Redactando la promoción…');
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

      // Avisamos de dónde salió el texto: si la IA no estaba disponible el
      // servidor responde con plantillas, y se vale saberlo.
      toast.success(
        copy.origen === 'plantilla'
          ? 'Texto listo (automático, sin IA). Revísalo antes de guardar'
          : '¡Texto listo! Revísalo antes de guardar',
        { id: aviso, duration: 4000 }
      );
      return copy;
    } catch (error) {
      const mensaje = error?.response?.data?.message || 'No se pudo generar el texto';
      toast.error(mensaje, { id: aviso, duration: 5000 });
      return null;
    } finally {
      setGenerando(false);
    }
  };

  return { generando, generarPromo };
};
