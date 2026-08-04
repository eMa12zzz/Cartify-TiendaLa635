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
  },
  { _id: false }
);

const storeSettingsSchema = new Schema(
  {
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

    secciones: { type: [seccionSchema], default: [] },

    temporada: { type: temporadaSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export default model("storeSettingsModel", storeSettingsSchema, "StoreSettings");
