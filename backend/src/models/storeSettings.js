/*
 * ============================================================
 * AJUSTES DE LA TIENDA — storeSettings.js
 * ============================================================
 * Cómo se ve la tienda de cara al cliente: su nombre, su logo, qué filas
 * aparecen en la portada y en qué orden, y el tema de temporada.
 *
 * Es un "singleton": hay un solo documento en la colección, igual que
 * loyaltyConfig. La tienda es una, no una lista de tiendas.
 *
 * Por qué existe: el nombre estaba escrito a mano en tres archivos distintos
 * (el encabezado, el pie y el sidebar del panel) y no había forma de cambiarlo
 * sin tocar código. Para una tienda que quiere personalizarse —o para la
 * siguiente que use este mismo sistema— eso es una pared.
 *
 * LO QUE NO ES: un constructor de páginas. Las filas de la portada las sigue
 * armando el sistema con lo que hay en el inventario (ver useSeccionesTienda);
 * aquí solo se decide CUÁLES se muestran y en qué orden. La libertad es
 * acotada a propósito: nadie puede dejar la portada vacía ni inventar una
 * sección que no se sabe llenar.
 * ============================================================
 */

import { Schema, model } from "mongoose";

/*
 * Una fila de la portada. La `clave` es la que conoce el frontend
 * (utils/portada.js); si llega una que no está en ese catálogo, se ignora al
 * pintar. Guardar la lista completa —y no solo las apagadas— es lo que
 * permite reordenarlas.
 */
const seccionSchema = new Schema(
  {
    clave: { type: String, required: true },
    visible: { type: Boolean, default: true },
    orden: { type: Number, default: 0 },
  },
  { _id: false }
);

/*
 * El tema de temporada (Navidad, Halloween...). Ver utils/temporadas.js.
 *
 *   modo 'automatico' → lo elige la fecha; en diciembre se pinta de Navidad
 *                       sin que nadie se acuerde de entrar a cambiarlo.
 *   modo 'manual'     → manda `tema`, pase lo que pase en el calendario.
 *   modo 'ninguno'    → los colores de siempre, todo el año.
 */
const temporadaSchema = new Schema(
  {
    modo: {
      type: String,
      enum: ["automatico", "manual", "ninguno"],
      default: "automatico",
    },
    tema: { type: String, default: "" },
    /*
     * La cinta con el saludo y las figuras cayendo de fondo. Se puede apagar
     * para quedarse solo con los colores — hay tiendas que quieren que se note
     * la fecha y otras que prefieren no distraer.
     */
    decoracion: { type: Boolean, default: true },
  },
  { _id: false }
);

/*
 * La llave que hace que el singleton sea singleton DE VERDAD.
 *
 * Con solo "buscar y si no hay, crear", dos peticiones que llegan a la vez
 * encuentran las dos que no hay nada y crean las dos: quedan dos documentos de
 * ajustes y la tienda se pinta con el que salga primero, que puede cambiar
 * entre cargas. El índice único lo hace imposible en la base, que es el único
 * lugar donde una carrera se puede ganar de verdad.
 */
export const CLAVE_UNICA = "tienda";

/*
 * Una ZONA de envío: un círculo en el mapa (centro + radio) con un precio fijo.
 * Sirve para sobreescribir la fórmula por km donde el dueño quiere un precio
 * puntual: "todo el Centro a $2", "la colonia de arriba a $4 aunque quede cerca".
 * Si una dirección cae dentro de una zona, manda el precio de la zona; si cae en
 * varias, manda la más específica (el radio más chico).
 */
const zonaEnvioSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    radioKm: { type: Number, default: 1, min: 0.05 }, // radio del círculo, en km
    precio: { type: Number, required: true, min: 0 },  // precio fijo dentro de la zona
  },
  { _id: false }
);

const storeSettingsSchema = new Schema(
  {
    clave: { type: String, default: CLAVE_UNICA, unique: true, index: true },
    /*
     * El nombre va en DOS líneas porque así se pinta: apiladas, con el mismo
     * peso y color. "Tienda" no es una etiqueta que acompaña a "la 635", es
     * parte del nombre del negocio. Guardarlo como una sola cadena obligaría
     * a adivinar dónde parte.
     */
    nombreLinea1: { type: String, default: "Tienda", trim: true, maxlength: 24 },
    nombreLinea2: { type: String, default: "la 635", trim: true, maxlength: 24 },

    // URL de Cloudinary. Vacío = se pinta el nombre solo, que es lo de hoy.
    logoUrl: { type: String, default: "" },

    // La frase del pie de página.
    lema: {
      type: String,
      default:
        "La tienda del barrio, ahora también en línea. Pida lo de la casa y se lo llevamos.",
      trim: true,
      maxlength: 160,
    },

    // Dirección física: de aquí salen los repartos.
    direccion: { type: String, default: "Calle Sevilla 635, Col. Providencia", trim: true },

    /*
     * Color base de la marca (hex, ej. "#B46C30"). De él sale toda la escala
     * --marca-* de la tienda. Vacío = el café de siempre que declara index.css.
     * Solo pinta la cara del cliente; el panel usa sus paletas de accesibilidad.
     */
    colorMarca: { type: String, default: "", trim: true },

    /*
     * Costo del envío a domicilio, en dólares. Lo fija el panel y lo cobra el
     * pedido. Antes estaba escrito a mano en el carrito (4.78) y —peor— el
     * backend ni lo sumaba al total: se mostraba pero no se cobraba. Ahora es
     * un solo número, editable, que manda tanto en la pantalla como en la cuenta.
     */
    costoEnvio: { type: Number, default: 4.78, min: 0 },

    /*
     * ENVÍO POR DISTANCIA (+ ajustes por zona).
     *
     * El precio ya no es un solo número plano. Se calcula así, de más específico
     * a más general:
     *   1. Si la dirección cae dentro de una zonaEnvio → precio de esa zona.
     *   2. Si no, y hay ubicacionTienda + coordenadas del cliente →
     *      envioBase + envioPorKm × distancia (redondeado).
     *   3. Si no se puede medir (falta la ubicación de la tienda o del cliente) →
     *      se cae al costoEnvio plano de arriba, que es como funcionaba antes.
     *
     * Así una tienda que no configure nada sigue cobrando su tarifa plana, y la
     * que sí lo haga cobra justo por distancia con los ajustes que quiera.
     */
    ubicacionTienda: {
      lat: { type: Number, default: null }, // de dónde salen los repartos
      lng: { type: Number, default: null },
    },
    // El texto de la dirección que se buscó para fijar el punto, para que el
    // panel la recuerde y no aparezca el buscador vacío la próxima vez.
    ubicacionTiendaTexto: { type: String, default: "", trim: true },
    envioBase: { type: Number, default: 1.0, min: 0 },  // tarifa base fija
    envioPorKm: { type: Number, default: 0.5, min: 0 }, // dólares por cada km
    zonasEnvio: { type: [zonaEnvioSchema], default: [] }, // sobreescriben la fórmula

    /*
     * TARIFA DE SERVICIO. Un cobro extra opcional (empaque, comisión, lo que
     * el dueño decida). Apagada por defecto: nadie cobra de más sin querer.
     *   servicioTipo 'fijo'       → servicioValor es en dólares.
     *   servicioTipo 'porcentaje' → servicioValor es un % del subtotal.
     * Se aplica igual a domicilio y a retiro; es un cobro de la casa, no del
     * reparto.
     */
    servicioActivo: { type: Boolean, default: false },
    servicioTipo: { type: String, enum: ["fijo", "porcentaje"], default: "fijo" },
    servicioValor: { type: Number, default: 0, min: 0 },

    secciones: { type: [seccionSchema], default: [] },

    temporada: { type: temporadaSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export default model("storeSettingsModel", storeSettingsSchema, "StoreSettings");
