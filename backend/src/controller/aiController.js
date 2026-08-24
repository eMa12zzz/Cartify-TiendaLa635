import { Type } from "@google/genai";
import productModel from "../models/product.js";
import { getIA, generarConIA } from "../utils/iaClient.js";
import { generarCopyPlantilla } from "../utils/plantillasPromo.js";
import { esFamiliaValida, LISTA_PARA_IA } from "../utils/familias.js";

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
  "- Español claro y natural, cálido y cercano pero NEUTRO. Sin diminutivos ni jerga:",
  "  nada de 'pancito', 'heladitos', 'cafecito', 'fresquitas', 'ricos', 'sabrosito'.",
  "  Se dice 'pan', 'helado', 'café', 'fresas'. Nada de inglés ni palabras rebuscadas.",
  "- Tratás al cliente de usted. Sin emojis.",
  "- Entre los clientes hay personas mayores: por creativo que sea, se entiende de una leída.",
  "- Nombrás el producto. Nunca decís 'este producto' ni 'estos artículos'.",
  "- Nunca inventás precios, fechas, marcas, sabores ni productos que no estén en la oferta.",
  "- Variá los arranques: no empecés siempre igual ni repitas la fórmula de los ejemplos.",
  "- El badge es el ahorro real y bien corto: -25%, 2x1, $1.50. En un anuncio sin descuento,",
  "  el badge es una palabra que dé ganas: Nuevo, Recién llegado, De la casa, Recomendado.",
  "- Respetás los límites de caracteres de cada campo.",
  "",
  "NADA DE GENÉRICO. Un cartel que dice 'Promoción de quesos seleccionados' no lo lee nadie:",
  "es el mismo cartel de cualquier tienda del país. Escribí como el dueño que sabe por qué",
  "vale la pena ese producto y quiere contarlo. Cálido no es lo mismo que payaso: se puede",
  "antojar sin diminutivos ni gritos. Poné el ánimo justo según lo que se anuncia: un 2x1 se",
  "anuncia con ganas, un producto nuevo se presenta con orgullo, un vencimiento cercano se",
  "cuenta con urgencia honesta. Si el texto podría servir para cualquier otro producto,",
  "está mal escrito: volvelo a hacer.",
  "",
  "Ejemplos del tono que buscamos:",
  "",
  'Oferta: Queso Fresco (Lácteos, marca La Salud): 25% de descuento, precio normal $3.50',
  '{"title":"El queso de los desayunos, más barato","promoDescription":"El queso fresco La Salud baja a $2.63 esta semana. Antes $3.50.","bannerHeadline":"25% MENOS","bannerSubtitle":"Queso fresco La Salud","badge":"-25%"}',
  "",
  'Oferta: Pan Francés (Panadería): de $2.00 a $1.25',
  '{"title":"Pan francés recién hecho a $1.25","promoDescription":"El pan francés del día, recién salido del horno, a $1.25. Antes costaba $2.00.","bannerHeadline":"A SOLO $1.25","bannerSubtitle":"Pan francés del día","badge":"$1.25"}',
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
      /*
       * Tres intentos por modelo: aquí hay alguien mirando un círculo girar y
       * esperando un texto. Un par de segundos de más valen la pena si a
       * cambio sale escrito por la IA y no por una plantilla.
       */
      const respuesta = await generarConIA({
        contents: armarPrompt(type, items, buyQty, payQty),
        config: {
          systemInstruction: VOZ_DE_LA_TIENDA,
          responseMimeType: "application/json",
          responseSchema: ESQUEMA_COPY,
          temperature: 0.9, // un poco de chispa para que no salga siempre igual
        },
      }, { intentos: 3 });

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
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

/*
 * ============================================================
 * ENTENDER LO QUE PIDIÓ EL CLIENTE (asistente de voz)
 * ============================================================
 * El asistente entiende por reglas: normaliza la frase, expande sinónimos y
 * busca el producto. Eso responde al instante, es gratis y funciona sin
 * internet — pero se rompe con "¿tiene algo para la fiebre?" o "deme lo de
 * siempre para el desayuno".
 *
 * Esta ruta es el PLAN B, no el plan A: solo se llama cuando las reglas ya
 * se dieron por vencidas. Así el caso común ("quiero dos manzanas") sigue
 * siendo instantáneo y la IA se gasta únicamente en lo que hoy no funciona.
 *
 * Reglas de la casa para el modelo:
 *   - Solo puede elegir productos de la lista que se le manda. Nada de
 *     inventar un jarabe que la tienda no vende.
 *   - Si no hay nada parecido, lo dice; no ofrece otra cosa por rellenar.
 *   - Frases cortas: esto se lee EN VOZ ALTA, no se lee en pantalla.
 */
const ESQUEMA_INTENCION = {
  type: Type.OBJECT,
  properties: {
    accion: {
      type: Type.STRING,
      description: "Una de: agregar, quitar, vaciar, total, comprar, ninguna",
    },
    producto: {
      type: Type.STRING,
      description: "Nombre EXACTO tal como viene en la lista de productos. Vacío si no aplica.",
    },
    cantidad: { type: Type.NUMBER, description: "Cuántas unidades. 1 si no lo dijo." },
    respuesta: {
      type: Type.STRING,
      description: "Lo que el asistente dice en voz alta. Una o dos frases, máximo 140 caracteres.",
    },
  },
  required: ["accion", "respuesta"],
};

const MODO_ASISTENTE = [
  "Eres el asistente de voz de Tienda La 635, una tienda de barrio en El Salvador.",
  "Un cliente te habló y las reglas del sistema no entendieron qué quería. Tu trabajo es",
  "descifrarlo y decir qué hacer con el carrito.",
  "",
  "Cómo trabajas:",
  "- SOLO puedes elegir productos de la lista que te paso. Si lo que pide no está en esa",
  "  lista, la acción es 'ninguna' y se lo decís con amabilidad. Nunca inventes productos.",
  "- Si pide algo por su uso ('algo para la tos', 'para el desayuno'), buscá en la lista",
  "  qué le sirve y ofrecelo por su nombre.",
  "- Tu respuesta se ESCUCHA, no se lee: frases cortas, sin listas, sin emojis.",
  "- Hablás en español claro, cálido y cercano pero NEUTRO: al cliente de usted,",
  "  sin diminutivos ni jerga (nada de 'pancito', 'heladitos', 'cafecito').",
  "- Entre los clientes hay personas mayores: se entiende de una sola escuchada.",
  "",
  "SI LA PREGUNTA NO ES DE PRODUCTOS NI DEL CARRITO (el horario, la dirección,",
  "si aceptan tarjeta, cómo es la entrega, o cualquier charla que no sea comprar):",
  "no inventes la respuesta —no tenés esos datos— pero TAMPOCO digas 'no entendí'",
  "ni le pidas que repita, porque sí la entendiste, solo no es algo que puedas",
  "resolver vos. Decile con dos frases que eso no lo manejás vos, y ofrecele algo",
  "que sí podés: 'Eso no lo sé decir, mejor pregúntele a alguien de la tienda por",
  "WhatsApp. ¿Le ayudo a armar su pedido mientras tanto?'. La acción sigue siendo",
  "'ninguna', pero la respuesta tiene que sonar a que la escuchaste, no a que la",
  "ignoraste.",
  "",
  "Reservá el 'no entendí, repítalo' para cuando la frase de verdad no se entiende",
  "—se cortó, quedó a medias, o no tiene sentido ninguno—, que es distinto de una",
  "pregunta clara sobre algo que no es tu trabajo.",
].join("\n");

aiController.entenderPedido = async (req, res) => {
  try {
    const { frase, productos = [], carrito = [] } = req.body;

    if (!frase || !String(frase).trim()) {
      return res.status(400).json({ message: "Hace falta la frase" });
    }

    const ia = getIA();
    // Sin llave configurada no hay plan B: se responde que no entendió, que
    // es exactamente lo que el asistente hacía antes de existir esta ruta.
    if (!ia) {
      return res.status(200).json({ accion: "ninguna", entendido: false, origen: "sin-ia" });
    }

    /*
     * Se manda solo nombre y precio, y como mucho 120 productos. El catálogo
     * entero en cada pregunta gastaría la cuota gratis en dos días y haría la
     * respuesta más lenta, que es justo lo que no se puede permitir cuando
     * alguien está parado esperando que le contesten.
     */
    const catalogo = productos
      .slice(0, 120)
      .map((p) => `${p.nombre}${p.precio != null ? ` ($${p.precio})` : ""}`)
      .join("\n");

    const enCarrito = carrito.length
      ? carrito.map((i) => `${i.cantidad} ${i.nombre}`).join(", ")
      : "vacío";

    const contents = [
      `El cliente dijo: "${frase}"`,
      "",
      `En su carrito lleva: ${enCarrito}`,
      "",
      "Productos que la tienda tiene hoy:",
      catalogo,
    ].join("\n");

    try {
      /*
       * UN solo reintento: acá hay alguien hablándole al teléfono y esperando
       * respuesta. Callar tres segundos para contestar con IA es peor que
       * contestar ya con las reglas de siempre.
       */
      const respuesta = await generarConIA({
        contents,
        config: {
          systemInstruction: MODO_ASISTENTE,
          responseMimeType: "application/json",
          responseSchema: ESQUEMA_INTENCION,
          // Baja a propósito: aquí no se quiere creatividad, se quiere que
          // entienda bien y elija de la lista.
          temperature: 0.2,
        },
      }, { intentos: 1 });

      const texto = respuesta.text;
      if (!texto) throw new Error("La IA no devolvió texto");

      const idea = JSON.parse(texto);

      /*
       * No se confía en que el modelo copió bien el nombre: se verifica
       * contra la lista real. Si se lo inventó, se ignora el producto y queda
       * solo la respuesta hablada.
       */
      const nombreReal = productos.find(
        (p) => (p.nombre || "").toLowerCase() === String(idea.producto || "").toLowerCase()
      )?.nombre || "";

      /*
       * Sin frase que decir, no hay respuesta que dar.
       *
       * Pasa de vez en cuando: el modelo devuelve el JSON con la respuesta
       * vacía. Si eso se dejara pasar, el asistente contestaría "Listo, ¿algo
       * más?" sin haber hecho nada — peor que admitir que no entendió.
       */
      const dice = String(idea.respuesta || "").trim();
      if (!dice) {
        return res.status(200).json({ accion: "ninguna", entendido: false, origen: "vacia" });
      }

      return res.status(200).json({
        accion: idea.accion || "ninguna",
        producto: nombreReal,
        cantidad: Number(idea.cantidad) > 0 ? Math.round(Number(idea.cantidad)) : 1,
        respuesta: dice,
        entendido: true,
        origen: "ia",
      });
    } catch (errorIA) {
      // Cuota agotada, sin internet, llave mala... el asistente sigue vivo:
      // simplemente vuelve a decir que no entendió.
      console.log("IA no disponible para el asistente: " + errorIA.message);
      return res.status(200).json({ accion: "ninguna", entendido: false, origen: "error" });
    }
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

/*
 * ============================================================
 * ACOMODAR EL PRODUCTO EN SU ESTANTE (clasificador de familias)
 * ============================================================
 * La portada de la tienda arma sus filas temáticas por FAMILIA. El 90% del
 * catálogo lo resuelve el frontend con puras reglas ("queso" -> quesos), gratis
 * y al instante. Esta ruta atiende solo lo que las reglas no supieron: nombres
 * de marca que no dicen qué son ("Volt", "Ricitos"), productos nuevos, cosas
 * que a nadie se le ocurrió meter en el léxico.
 *
 * Igual que el asistente de voz, esta es la ayuda de última hora, no el plan
 * principal. Y con dos candados que son lo importante de todo esto:
 *
 *   1. Lo que se resuelve SE GUARDA en el producto (familia + familiaOrigen).
 *      Cada producto se clasifica una vez en la vida, no en cada visita. Sin
 *      esto la cuota gratis se acaba en dos días.
 *   2. Antes de molestar al modelo se revisa la base: si el producto ya tiene
 *      familia guardada, se devuelve esa y la IA ni se entera. Hace falta
 *      porque el navegador no siempre sabe lo que ya está guardado, y sin esta
 *      revisión se estaría preguntando lo mismo en cada carga de la página.
 * ============================================================
 */
const ESQUEMA_CLASIFICACION = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: "El id del producto, tal cual venía en la lista" },
      familia: {
        type: Type.STRING,
        description: "Clave EXACTA de la lista de familias. Vacío si no encaja en ninguna.",
      },
    },
    required: ["id", "familia"],
  },
};

// Marca de "ya se preguntó y no encajó en ningún estante". Va en familiaOrigen.
const SIN_FAMILIA = "ia-sin-familia";

const MODO_ESTANTES = [
  "Eres el encargado de acomodar los estantes de Tienda La 635, una tienda de abarrotes",
  "de barrio en El Salvador. Te pasan una lista de productos y decís en qué estante va cada uno.",
  "",
  "Cómo trabajas:",
  "- SOLO podés usar las claves de familia de la lista cerrada que te paso. Ni una más.",
  "- Si un producto no encaja en ninguna, devolvés la familia vacía. NUNCA te inventes",
  "  un estante nuevo ni lo metás a la fuerza donde no va: dejarlo sin estante es correcto.",
  "- Vas por el producto, no por la marca: 'Volt' es una bebida energizante, 'Ricitos' es",
  "  una fritura, 'Musún' es café. Si la marca no te dice nada, dejalo vacío.",
  "- Conocés las marcas y los nombres que se usan en El Salvador.",
  "- Devolvés TODOS los ids que te mandaron, ninguno de más, ninguno de menos.",
].join("\n");

/*
 * POST /api/ai/clasificar
 * Recibe { productos: [{ id, nombre }] } y devuelve { familias: [{ id, familia }] }.
 *
 * Nunca responde 500 por culpa de la IA: sin llave, sin cuota o sin internet
 * contesta 200 con la lista vacía. Del otro lado hay un cliente mirando la
 * tienda, y que la portada tenga una fila menos no es un error que valga la
 * pena contarle a nadie.
 */
aiController.clasificarProductos = async (req, res) => {
  try {
    const enviados = Array.isArray(req.body.productos) ? req.body.productos : [];
    if (!enviados.length) {
      return res.status(200).json({ familias: [], origen: "sin-productos" });
    }

    /*
     * Máximo 60 por tanda: es lo que cabe en una petición sin volverla lenta ni
     * arriesgar que el modelo se coma la mitad de la lista. Los ids se filtran
     * con la forma de un ObjectId — un id mal formado haría que la consulta
     * reventara y devolviera un 500 por una tontería.
     */
    const pedidos = enviados
      .filter((p) => /^[a-f\d]{24}$/i.test(String(p?.id || "")))
      .slice(0, 60);

    if (!pedidos.length) {
      return res.status(200).json({ familias: [], origen: "sin-productos" });
    }

    const ids = pedidos.map((p) => String(p.id));
    const guardados = await productModel.find({ _id: { $in: ids } }, "name familia familiaOrigen");

    const yaSabidas = [];
    const porResolver = [];
    guardados.forEach((p) => {
      const idProducto = String(p._id);
      if (esFamiliaValida(p.familia)) {
        yaSabidas.push({ id: idProducto, familia: p.familia });
        return;
      }
      /*
       * Ya se preguntó por este y la IA dijo que no encaja en ningún estante.
       * "No sé" también es una respuesta y también se guarda: si no, cada
       * visita se volvería a gastar cuota preguntando por el mismo servicio de
       * impresión que nunca va a ser un abarrote.
       */
      if (p.familiaOrigen === SIN_FAMILIA) return;

      // El nombre sale de la base, no de lo que mandó el navegador: es el mismo
      // cuidado que se tiene en el resto del archivo.
      porResolver.push({ id: idProducto, nombre: p.name || "" });
    });

    // Todo estaba guardado: se contesta al instante y la IA ni se enteró.
    if (!porResolver.length) {
      return res.status(200).json({ familias: yaSabidas, origen: "guardado" });
    }

    const ia = getIA();
    // Sin llave configurada no hay plan B, y no hace falta: la tienda arma sus
    // filas con lo que las reglas sí resolvieron, exactamente como antes.
    if (!ia) {
      return res.status(200).json({ familias: yaSabidas, origen: "sin-ia" });
    }

    const contents = [
      "Familias disponibles (usá la clave de la izquierda):",
      LISTA_PARA_IA,
      "",
      "Productos que hay que acomodar:",
      porResolver.map((p) => `${p.id} | ${p.nombre}`).join("\n"),
    ].join("\n");

    try {
      /*
       * Tres intentos: esto corre de fondo mientras el dueño mira su tienda,
       * así que puede tomarse su tiempo. Lo que resuelve queda guardado en el
       * producto, y lo que no se reintenta la próxima vez.
       */
      const respuesta = await generarConIA({
        contents,
        config: {
          systemInstruction: MODO_ESTANTES,
          responseMimeType: "application/json",
          responseSchema: ESQUEMA_CLASIFICACION,
          // Aquí no se quiere creatividad de ningún tipo: se quiere que acierte
          // y que mañana conteste lo mismo que hoy.
          temperature: 0.1,
        },
      });

      const texto = respuesta.text;
      if (!texto) throw new Error("La IA no devolvió texto");

      const clasificadas = JSON.parse(texto);
      if (!Array.isArray(clasificadas)) throw new Error("La IA no devolvió una lista");

      /*
       * Desconfianza sana, la misma que con los nombres del asistente de voz:
       *   - el id tiene que ser uno de los que preguntamos (no uno que se sacó
       *     de la manga ni uno que ya estaba resuelto),
       *   - la familia tiene que estar en la lista cerrada.
       * Lo que no cumpla se descarta sin decir nada: ese producto simplemente
       * se queda sin estante, que es un resultado válido.
       */
      const preguntados = new Set(porResolver.map((p) => p.id));
      const aceptadas = [];
      const vistos = new Set();

      clasificadas.forEach((item) => {
        const idProducto = String(item?.id || "");
        const familia = String(item?.familia || "");
        if (!preguntados.has(idProducto) || vistos.has(idProducto)) return;
        if (!esFamiliaValida(familia)) return;
        vistos.add(idProducto);
        aceptadas.push({ id: idProducto, familia });
      });

      /*
       * Se guarda para no volver a preguntar nunca por estos productos.
       * `familiaOrigen` deja el rastro de quién lo decidió: si algún día hay
       * que revisar o borrar lo que puso la IA, se sabe cuál fue.
       * El modelo usa strict:false, así que estos dos campos entran sin tocar
       * el schema (están documentados arriba del modelo).
       */
      const escrituras = aceptadas.map((f) => ({
        updateOne: {
          filter: { _id: f.id },
          update: { $set: { familia: f.familia, familiaOrigen: "ia" } },
        },
      }));

      // Los que quedaron sin estante se marcan como preguntados, para no
      // volver a gastar cuota en ellos nunca más.
      porResolver
        .filter((p) => !vistos.has(p.id))
        .forEach((p) => {
          escrituras.push({
            updateOne: {
              filter: { _id: p.id },
              update: { $set: { familiaOrigen: SIN_FAMILIA } },
            },
          });
        });

      if (escrituras.length) {
        try {
          await productModel.bulkWrite(escrituras);
        } catch (errorGuardado) {
          // Si no se pudo guardar, la respuesta igual sirve para esta visita:
          // la próxima vez se volverá a preguntar y ya.
          console.log("No se pudo guardar la clasificación: " + errorGuardado.message);
        }
      }

      return res.status(200).json({ familias: [...yaSabidas, ...aceptadas], origen: "ia" });
    } catch (errorIA) {
      // Cuota agotada, sin internet, llave mala... se devuelve lo que ya se
      // sabía y la portada se arma con eso. Nadie ve un error.
      console.log("IA no disponible para clasificar: " + errorIA.message);
      return res.status(200).json({ familias: yaSabidas, origen: "error" });
    }
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

export default aiController;
