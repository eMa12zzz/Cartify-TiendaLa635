import { Type } from "@google/genai";
import productModel from "../models/product.js";
import { getIA, MODELO_IA } from "../utils/iaClient.js";
import { generarCopyPlantilla } from "../utils/plantillasPromo.js";

const aiController = {};

/*
 * Esquema de lo que le pedimos a Gemini. Con responseSchema la respuesta SIEMPRE
 * llega como JSON válido con estos campos — nada de andar parseando texto suelto
 * ni rezando para que no salga con un "¡Claro! Aquí tienes:".
 */
const ESQUEMA_COPY = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Título corto y llamativo, máximo 40 caracteres" },
    promoDescription: { type: Type.STRING, description: "Descripción de la promo, máximo 95 caracteres" },
    bannerHeadline: { type: Type.STRING, description: "Frase grande del banner, máximo 22 caracteres" },
    bannerSubtitle: { type: Type.STRING, description: "Frase de apoyo del banner, máximo 40 caracteres" },
    badge: { type: Type.STRING, description: "Sello corto del ahorro. Ej: -25%, 2x1, $1.50" },
  },
  required: ["title", "promoDescription", "bannerHeadline", "bannerSubtitle", "badge"],
};

/*
 * La "voz" de la tienda. Va como systemInstruction (aparte del pedido) para que
 * el modelo la trate como su forma de ser, no como parte del encargo del día.
 *
 * Los ejemplos son la parte que más pesa: mostrarle 4 promos bien escritas le
 * enseña el tono mucho mejor que cualquier lista de reglas. Si algún texto sale
 * feo, lo más efectivo es agregar aquí un ejemplo del estilo que sí se quiere.
 */
const VOZ_DE_LA_TIENDA = [
  "Eres el encargado de marketing de Tienda La 635, una tienda de abarrotes de barrio en El Salvador.",
  "Escribes los anuncios de las promociones de la tienda en línea. Tu trabajo es que a la gente",
  "se le antoje y entre a ver, no solo informarle que hay descuento.",
  "",
  "Cómo escribes:",
  "- Buscas el gancho, no el dato. Antes de escribir, pensá qué hace especial a ESE producto:",
  "  a qué sabe, para qué momento del día sirve, qué se cocina con él, a quién le alegra el día.",
  "  'Queso fresco 25% menos' informa; 'El queso de los desayunos, hoy más barato' antoja.",
  "- El título es el gancho. La descripción aterriza la oferta con el precio real.",
  "- Español salvadoreño de la calle, cálido y con chispa. Nada de inglés ni palabras rebuscadas.",
  "- Tratás al cliente de usted. Sin emojis.",
  "- Entre los clientes hay personas mayores: por creativo que sea, se entiende de una leída.",
  "- Nombrás el producto. Nunca decís 'este producto' ni 'estos artículos'.",
  "- Nunca inventás precios, fechas, marcas, sabores ni productos que no estén en la oferta.",
  "- Variá los arranques: no empecés siempre igual ni repitas la fórmula de los ejemplos.",
  "- El badge es el ahorro real y bien corto: -25%, 2x1, $1.50. En un anuncio sin descuento,",
  "  el badge es una palabra que dé ganas: Nuevo, Recién llegado, De la casa, Recomendado.",
  "- Respetás los límites de caracteres de cada campo.",
  "",
  "NADA DE NEUTRAL. Un cartel que dice 'Promoción de quesos seleccionados' no lo lee nadie:",
  "es el mismo cartel de cualquier tienda del país. Escribí como el dueño que sabe por qué",
  "vale la pena ese producto y quiere contarlo. Poné energía según lo que se está anunciando:",
  "un 2x1 se grita, un producto nuevo se presenta con orgullo, un vencimiento cercano se",
  "cuenta con urgencia honesta. Si el texto podría servir para cualquier otro producto,",
  "está mal escrito: volvelo a hacer.",
  "",
  "Ejemplos del tono que buscamos:",
  "",
  'Oferta: Queso Fresco (Lácteos, marca La Salud): 25% de descuento, precio normal $3.50',
  '{"title":"El queso de los desayunos, más barato","promoDescription":"El queso fresco La Salud baja a $2.63 esta semana. Antes $3.50.","bannerHeadline":"25% MENOS","bannerSubtitle":"Queso fresco La Salud","badge":"-25%"}',
  "",
  'Oferta: Pan Francés (Panadería): de $2.00 a $1.25',
  '{"title":"Pan calientito a $1.25","promoDescription":"El pan francés del día, recién salido, a $1.25. Antes costaba $2.00.","bannerHeadline":"A SOLO $1.25","bannerSubtitle":"Pan francés del día","badge":"$1.25"}',
  "",
  'Oferta: Gaseosa 1.5L (Bebidas, marca Coca-Cola): compra 2 y paga 1',
  '{"title":"La segunda gaseosa va por la casa","promoDescription":"Lleve dos gaseosas de 1.5 litros y pague una sola. Alcanza para toda la mesa.","bannerHeadline":"2x1","bannerSubtitle":"Gaseosa 1.5 litros","badge":"2x1"}',
  "",
  'Oferta: Jabón de baño (Higiene): 15% | Detergente (Limpieza): 20% | Cloro (Limpieza): 10%',
  '{"title":"Surta la casa gastando menos","promoDescription":"Jabón, detergente y cloro con hasta 20% de descuento. Todo en un solo viaje.","bannerHeadline":"HASTA 20% MENOS","bannerSubtitle":"Jabón, detergente y cloro","badge":"-20%"}',
  "",
  "Anuncio sin descuento: Café de altura (Bebidas, marca El Volcán), precio $4.25",
  '{"title":"Ya llegó el café de altura","promoDescription":"El Volcán de altura, molido del dia, a $4.25. El que despierta la casa.","bannerHeadline":"YA LLEGO","bannerSubtitle":"Cafe El Volcan de altura","badge":"Nuevo"}',
  "",
  "Anuncio sin descuento: toda la categoría Panadería",
  '{"title":"El pan sale calientito todos los dias","promoDescription":"Pan frances, semita y quesadilla, horneados aqui mismo desde temprano.","bannerHeadline":"RECIEN HORNEADO","bannerSubtitle":"Toda la panaderia","badge":"De la casa"}',
].join("\n");

// Describe un producto con todo lo que sabemos de él: mientras más contexto,
// menos genérico escribe. "el queso fresco La Salud" en vez de "este producto".
const describirProducto = (it) => {
  const etiquetas = [it.category, it.brand].filter(Boolean).join(", ");
  return etiquetas ? `${it.name} (${etiquetas})` : it.name;
};

// Arma la frase que describe el gancho según el tipo de promoción.
const describirOferta = (tipo, items, buyQty, payQty) => {
  /*
   * Un anuncio no tiene ahorro que contar: el gancho es el producto mismo.
   * Sin este caso, la IA recibía "0% de descuento" y escribía sobre una
   * rebaja que no existe.
   */
  if (tipo === "anuncio") {
    return items.map((it) => `${describirProducto(it)}, precio $${it.salePrice}`).join(" | ");
  }
  if (tipo === "nxm") {
    return `${items.map(describirProducto).join(" | ")}: compra ${buyQty} y paga ${payQty}`;
  }
  if (tipo === "precio_fijo") {
    return items
      .map((it) => `${describirProducto(it)}: de $${it.salePrice} a $${it.fixedPrice}`)
      .join(" | ");
  }
  return items
    .map((it) => `${describirProducto(it)}: ${it.discount}% de descuento, precio normal $${it.salePrice}`)
    .join(" | ");
};

const armarPrompt = (type, items, buyQty, payQty) =>
  type === "anuncio"
    ? `Anuncio sin descuento: ${describirOferta(type, items, buyQty, payQty)}`
    : `Oferta: ${describirOferta(type, items, buyQty, payQty)}`;

/*
 * POST /api/ai/promo-copy
 * Recibe el tipo de promo y los productos seleccionados del inventario, y
 * devuelve el texto listo para el formulario y para pintar el banner.
 *
 * Si la IA no está configurada o se cae, responde igual con las plantillas
 * locales y avisa de dónde salió el texto (campo `origen`).
 */
aiController.generarCopyPromo = async (req, res) => {
  try {
    const { type = "descuento", buyQty = 2, payQty = 1 } = req.body;
    const enviados = Array.isArray(req.body.items) ? req.body.items : [];

    if (!enviados.length) {
      return res
        .status(400)
        .json({ message: "Selecciona al menos un producto del inventario" });
    }

    // Traemos los productos reales de la base: el nombre y el precio salen de
    // aquí, no de lo que mande el navegador.
    const ids = enviados.map((it) => it.productId).filter(Boolean);
    // Traemos también categoría y marca: con ese contexto la IA deja de escribir
    // genérico y puede decir "el queso fresco La Salud".
    const productos = await productModel
      .find({ _id: { $in: ids } })
      .populate("typeId", "type")
      .populate("brandId", "name");
    const porId = Object.fromEntries(productos.map((p) => [String(p._id), p]));

    const items = enviados
      .filter((it) => porId[String(it.productId)])
      .map((it) => {
        const p = porId[String(it.productId)];
        return {
          name: p.name,
          category: p.typeId?.type || null,
          brand: p.brandId?.name || null,
          salePrice: Number(p.salePrice) || 0,
          discount: Number(it.discount) || 0,
          fixedPrice: it.fixedPrice != null ? Number(it.fixedPrice) : null,
        };
      });

    if (!items.length) {
      return res
        .status(400)
        .json({ message: "No se encontraron esos productos en el inventario" });
    }

    // Plan B listo desde ya: si la IA falla, esto es lo que devolvemos.
    const respaldo = generarCopyPlantilla({ type, items, buyQty, payQty });

    const ia = getIA();
    if (!ia) {
      return res.status(200).json({ ...respaldo, origen: "plantilla" });
    }

    try {
      const respuesta = await ia.models.generateContent({
        model: MODELO_IA,
        contents: armarPrompt(type, items, buyQty, payQty),
        config: {
          systemInstruction: VOZ_DE_LA_TIENDA,
          responseMimeType: "application/json",
          responseSchema: ESQUEMA_COPY,
          temperature: 0.9, // un poco de chispa para que no salga siempre igual
        },
      });

      const texto = respuesta.text;
      if (!texto) throw new Error("La IA no devolvió texto");

      const copy = JSON.parse(texto);
      return res.status(200).json({ ...copy, origen: "ia" });
    } catch (errorIA) {
      // Llave inválida, cuota agotada, sin internet... da igual: la tienda
      // sigue trabajando con las plantillas.
      console.log("IA no disponible, usando plantillas: " + errorIA.message);
      return res.status(200).json({ ...respaldo, origen: "plantilla" });
    }
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default aiController;
