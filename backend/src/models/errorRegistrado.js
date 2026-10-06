import { Schema, model } from "mongoose";

/*
 * ============================================================
 * ERRORES REGISTRADOS — errorRegistrado.js
 * ============================================================
 * Lo que falló en la web, la app o el servidor, para que alguien se entere.
 * Antes la pantalla de error decía "ya quedó anotado" y no se anotaba en
 * ningún lado: el fallo moría en la consola del navegador de un cliente.
 *
 * Un documento por TIPO de error, no por cada vez que pasa: la `huella` junta
 * los que son el mismo (ver utils/registroErrores.js) y `veces` los cuenta.
 * Cien clientes con el mismo problema son un renglón con "100 veces", no cien
 * renglones iguales.
 *
 * Sin datos de la persona: ni nombre, ni correo, ni dirección. Solo qué
 * falló, dónde, en qué versión y en qué tipo de dispositivo.
 *
 * Se borran solos 60 días después de la ÚLTIMA vez que pasaron (índice TTL
 * sobre ultimaVez): lo que dejó de fallar no se acumula para siempre.
 * ============================================================
 */
const errorRegistradoSchema = new Schema(
  {
    huella: { type: String, required: true, unique: true },
    origen: { type: String, enum: ["web", "app", "servidor"], required: true },
    mensaje: { type: String, default: "", maxlength: 500 },
    pila: { type: String, default: "", maxlength: 4000 },
    // La pantalla (web y app) o la ruta (servidor) donde pasó.
    donde: { type: String, default: "", maxlength: 300 },
    version: { type: String, default: "", maxlength: 80 },
    // Navegador y sistema, resumidos ("Chrome 126 · Android"), no el user-agent completo.
    dispositivo: { type: String, default: "", maxlength: 120 },
    veces: { type: Number, default: 1 },
    primeraVez: { type: Date, default: Date.now },
    ultimaVez: { type: Date, default: Date.now, expires: "60d" },
    resuelto: { type: Boolean, default: false },
  },
  { versionKey: false }
);

export default model("ErrorRegistrado", errorRegistradoSchema, "ErroresRegistrados");
