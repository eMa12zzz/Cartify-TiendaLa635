import storeSettingsModel from "../models/storeSettings.js";

/*
 * ============================================================
 * AJUSTES DE LA TIENDA — storeSettingsController.js
 * ============================================================
 * Un solo documento para toda la tienda. Ver src/models/storeSettings.js.
 *
 * La lectura es PÚBLICA a propósito: la tienda se ve sin cuenta, y el nombre,
 * el logo y el orden de la portada son parte de lo primero que se pinta. Si
 * esto exigiera sesión, quien entra por un enlace de WhatsApp vería la tienda
 * sin nombre hasta que iniciara sesión.
 * ============================================================
 */

const storeSettingsController = {};

/*
 * Los campos que el panel puede cambiar. Ir por lista blanca y no por
 * `{...req.body}` es lo que evita que alguien mande `_id`, `createdAt` o un
 * campo inventado y lo guardemos sin darnos cuenta.
 */
const CAMPOS_DE_TEXTO = ["nombreLinea1", "nombreLinea2", "logoUrl", "lema", "direccion"];

const MODOS_DE_TEMPORADA = ["automatico", "manual", "ninguno"];

// SELECT — Los ajustes actuales. Si no existen todavía, se crean con los
// valores por defecto para que el frontend siempre reciba la misma forma.
storeSettingsController.getSettings = async (req, res) => {
  try {
    let ajustes = await storeSettingsModel.findOne();
    if (!ajustes) {
      ajustes = await storeSettingsModel.create({});
    }
    return res.status(200).json(ajustes);
  } catch (error) {
    console.log("error ajustes de tienda: " + error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

// UPDATE — Guarda lo que venga, campo por campo.
storeSettingsController.updateSettings = async (req, res) => {
  try {
    const cambios = {};

    /*
     * Texto. Se recorta y se comprueba que el nombre no quede en blanco: una
     * tienda sin nombre en el encabezado se ve como si la página se hubiera
     * cargado a medias.
     */
    CAMPOS_DE_TEXTO.forEach((campo) => {
      if (req.body[campo] === undefined) return;
      cambios[campo] = String(req.body[campo]).trim();
    });

    if (cambios.nombreLinea1 !== undefined && !cambios.nombreLinea1) {
      return res.status(400).json({ message: "La primera línea del nombre no puede quedar vacía" });
    }

    /*
     * Secciones de la portada. Solo se guardan la clave, si se ve y en qué
     * posición: el título y el contenido de cada fila los pone el frontend,
     * que es quien sabe armarlas.
     */
    if (Array.isArray(req.body.secciones)) {
      cambios.secciones = req.body.secciones
        .filter((s) => s && typeof s.clave === "string" && s.clave.trim())
        .map((s, i) => ({
          clave: s.clave.trim(),
          visible: s.visible !== false,
          // Si no mandan orden, manda la posición en el arreglo: es lo que el
          // panel acaba de dejar al arrastrar.
          orden: Number.isFinite(Number(s.orden)) ? Number(s.orden) : i,
        }));
    }

    /*
     * Temporada, campo por campo y con NOTACIÓN DE PUNTOS.
     *
     * Ojo con esto, que no es un capricho de estilo: `temporada` es un
     * subesquema, y si se le pasa el objeto entero a findOneAndUpdate,
     * Mongoose lo castea a un subdocumento nuevo —rellenando con los valores
     * por defecto las rutas que no vinieron— y hace $set del subdocumento
     * COMPLETO. O sea que mandar solo `tema` devolvía `modo` a 'automatico', y
     * mandar solo `modo` borraba el tema. Silenciosamente, sin error.
     *
     * Con "temporada.modo" / "temporada.tema" Mongoose emite un $set por ruta
     * y deja en paz a la hermana, que es lo que prometen los guardas de abajo.
     */
    if (req.body.temporada && typeof req.body.temporada === "object") {
      const { modo, tema } = req.body.temporada;

      if (modo !== undefined) {
        if (!MODOS_DE_TEMPORADA.includes(modo)) {
          return res.status(400).json({ message: "Ese modo de temporada no existe" });
        }
        cambios["temporada.modo"] = modo;
      }
      if (tema !== undefined) cambios["temporada.tema"] = String(tema).trim();
    }

    const ajustes = await storeSettingsModel.findOneAndUpdate(
      {},
      cambios,
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );

    return res.status(200).json({ message: "Ajustes guardados", ajustes });
  } catch (error) {
    console.log("error guardando ajustes de tienda: " + error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

/*
 * El logo, subido como archivo.
 *
 * Va por su propia puerta y no dentro de updateSettings porque cambiar el
 * logo es una acción sola: no tiene por qué obligar a reenviar el nombre, el
 * lema y la portada entera. Multer ya dejó la imagen en Cloudinary y nos pasa
 * la URL en req.file.path.
 */
storeSettingsController.updateLogo = async (req, res) => {
  try {
    if (!req.file?.path) {
      return res.status(400).json({ message: "No llegó ninguna imagen" });
    }

    const ajustes = await storeSettingsModel.findOneAndUpdate(
      {},
      { logoUrl: req.file.path },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ message: "Logo actualizado", ajustes });
  } catch (error) {
    console.log("error subiendo el logo: " + error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Quitar el logo y volver al nombre escrito, sin tener que subir otra imagen.
storeSettingsController.deleteLogo = async (req, res) => {
  try {
    const ajustes = await storeSettingsModel.findOneAndUpdate(
      {},
      { logoUrl: "" },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return res.status(200).json({ message: "Logo quitado", ajustes });
  } catch (error) {
    console.log("error quitando el logo: " + error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

export default storeSettingsController;
