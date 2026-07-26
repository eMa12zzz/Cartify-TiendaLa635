import { useState } from 'react';
import toast from 'react-hot-toast';
import { aiService } from '../api/aiService';

/*
 * usePromoAI — el ayudante de promociones.
 *
 * Dos pasos y ya está el anuncio listo:
 *   1) La IA (Gemini) escribe el título, la descripción y el texto del banner
 *      viendo los productos elegidos del inventario y el tipo de promo. Si no
 *      hay llave configurada, el servidor responde con plantillas locales.
 *   2) El banner se ARMA aquí mismo en un canvas: foto del producto + ese
 *      texto + los colores de la tienda. Sale un PNG que se sube como
 *      cualquier imagen, así que nada cambia del lado del servidor.
 */

// Paleta del diseño (la misma que los tokens de index.css).
const CAFE_OSCURO = '#8A5222';
const CAFE = '#B46C30';
const CAFE_CLARO = '#D8A860';
const CREMA = '#FBF6F0';

const ANCHO = 1200;
const ALTO = 480; // mismo formato que la tarjeta del carrusel (2.5:1)

// Carga una imagen para el canvas. Cloudinary permite CORS, pero si algo falla
// devolvemos null y el banner sale solo con el fondo de la tienda.
const cargarImagen = (url) =>
  new Promise((resolve) => {
    if (!url) { resolve(null); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });

// Dibuja la imagen recortada tipo "object-fit: cover" dentro de un rectángulo.
const dibujarCover = (ctx, img, x, y, w, h) => {
  const escala = Math.max(w / img.width, h / img.height);
  const anchoFinal = img.width * escala;
  const altoFinal = img.height * escala;
  ctx.drawImage(img, x + (w - anchoFinal) / 2, y + (h - altoFinal) / 2, anchoFinal, altoFinal);
};

// Parte un texto en varias líneas para que no se salga del ancho dado.
const partirLineas = (ctx, texto, anchoMax, maxLineas) => {
  const palabras = String(texto || '').split(' ');
  const lineas = [];
  let actual = '';
  palabras.forEach((palabra) => {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (ctx.measureText(prueba).width > anchoMax && actual) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = prueba;
    }
  });
  if (actual) lineas.push(actual);
  return lineas.slice(0, maxLineas);
};

export const usePromoAI = () => {
  const [generando, setGenerando] = useState(false);

  /* ---------- 1. El texto lo escribe Claude ---------- */
  const generarTexto = async ({ tipo, items, buyQty, payQty }) => {
    const payload = {
      type: tipo,
      buyQty: Number(buyQty) || 2,
      payQty: Number(payQty) || 1,
      items: items.map((it) => ({
        productId: it.productId,
        discount: Number(it.discount) || 0,
        fixedPrice: it.fixedPrice === '' || it.fixedPrice == null ? null : Number(it.fixedPrice),
      })),
    };
    return aiService.generarCopyPromo(payload);
  };

  /* ---------- 2. El banner se pinta aquí ---------- */
  const pintarBanner = async ({ headline, subtitle, badge, imagenProducto }) => {
    const canvas = document.createElement('canvas');
    canvas.width = ANCHO;
    canvas.height = ALTO;
    const ctx = canvas.getContext('2d');

    // Fondo café de la tienda, con un degradado para que no se vea plano.
    const fondo = ctx.createLinearGradient(0, 0, ANCHO, ALTO);
    fondo.addColorStop(0, CAFE_OSCURO);
    fondo.addColorStop(1, CAFE);
    ctx.fillStyle = fondo;
    ctx.fillRect(0, 0, ANCHO, ALTO);

    // La foto del producto ocupa la mitad derecha y se funde con el fondo.
    const foto = await cargarImagen(imagenProducto);
    const inicioFoto = ANCHO * 0.46;
    if (foto) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(inicioFoto, 0, ANCHO - inicioFoto, ALTO);
      ctx.clip();
      dibujarCover(ctx, foto, inicioFoto, 0, ANCHO - inicioFoto, ALTO);
      ctx.restore();

      // Velo que va del café sólido a transparente: así el texto siempre se lee.
      const velo = ctx.createLinearGradient(inicioFoto - 40, 0, ANCHO * 0.88, 0);
      velo.addColorStop(0, CAFE_OSCURO);
      velo.addColorStop(0.55, 'rgba(107,68,35,0.55)');
      velo.addColorStop(1, 'rgba(107,68,35,0.1)');
      ctx.fillStyle = velo;
      ctx.fillRect(inicioFoto - 40, 0, ANCHO - inicioFoto + 40, ALTO);
    }

    /*
     * Aquí había una franja clara de 10px abajo como "detalle de marca".
     * Se quitó: dentro de la tarjeta redondeada no se leía como adorno sino
     * como si la foto estuviera mal recortada.
     */

    const margen = 64;
    const anchoTexto = ANCHO * 0.5;

    // Sello del ahorro (-25%, 2x1, $1.50).
    if (badge) {
      ctx.font = '800 34px Georgia, serif';
      const anchoBadge = ctx.measureText(badge).width + 44;
      ctx.fillStyle = CAFE_CLARO;
      ctx.beginPath();
      // roundRect no existe en navegadores viejitos: ahí va el rectángulo normal.
      if (ctx.roundRect) ctx.roundRect(margen, 58, anchoBadge, 56, 28);
      else ctx.rect(margen, 58, anchoBadge, 56);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.textBaseline = 'middle';
      ctx.fillText(badge, margen + 22, 88);
    }

    // Frase principal.
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 62px Georgia, serif';
    const lineas = partirLineas(ctx, headline, anchoTexto, 2);
    let y = badge ? 214 : 190;
    lineas.forEach((linea) => {
      ctx.fillText(linea, margen, y);
      y += 70;
    });

    // Apoyo.
    ctx.fillStyle = CREMA;
    ctx.font = '400 28px Georgia, serif';
    partirLineas(ctx, subtitle, anchoTexto, 2).forEach((linea) => {
      y += 14;
      ctx.fillText(linea, margen, y);
      y += 24;
    });

    // Firma de la tienda.
    ctx.fillStyle = 'rgba(250,249,246,0.7)';
    ctx.font = '600 20px Georgia, serif';
    ctx.fillText('Tienda La 635', margen, ALTO - 44);

    // Lo convertimos en archivo para subirlo igual que una imagen normal.
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 0.95));
    if (!blob) throw new Error('No se pudo crear el banner');
    return new File([blob], `promo-${Date.now()}.png`, { type: 'image/png' });
  };

  /*
   * Todo junto: pide el texto, pinta el banner y devuelve ambas cosas para que
   * el formulario solo tenga que acomodarlas en sus campos.
   */
  const generarPromo = async ({ tipo, items, buyQty, payQty, imagenProducto }) => {
    if (!items?.length) {
      toast.error('Primero agrega los productos de la promoción');
      return null;
    }

    setGenerando(true);
    const aviso = toast.loading('Redactando la promoción…');
    try {
      const copy = await generarTexto({ tipo, items, buyQty, payQty });

      let banner = null;
      try {
        toast.loading('Armando el banner…', { id: aviso });
        banner = await pintarBanner({
          headline: copy.bannerHeadline || copy.title,
          subtitle: copy.bannerSubtitle || copy.promoDescription,
          badge: copy.badge,
          imagenProducto,
        });
      } catch {
        // Si el banner falla, el texto igual sirve: no perdemos el trabajo.
        toast.error('El texto quedó listo, pero no se pudo armar el banner');
      }

      // Avisamos de dónde salió el texto: si la IA no estaba disponible el
      // servidor responde con plantillas, y se vale saberlo.
      toast.success(
        copy.origen === 'plantilla'
          ? 'Promoción lista (texto automático, sin IA). Revísala antes de guardar'
          : '¡Promoción lista! Revísala antes de guardar',
        { id: aviso, duration: 4000 }
      );
      return { ...copy, banner };
    } catch (error) {
      const mensaje = error?.response?.data?.message || 'No se pudo generar la promoción';
      toast.error(mensaje, { id: aviso, duration: 5000 });
      return null;
    } finally {
      setGenerando(false);
    }
  };

  return { generando, generarPromo, pintarBanner };
};
