import { GoogleGenAI } from "@google/genai";

/*
 * Cliente de Gemini (Google) — redacta el texto de las promociones.
 *
 * La llave se saca gratis en https://aistudio.google.com/apikey (sin tarjeta) y
 * va en el .env como GEMINI_API_KEY. Si no está configurada devolvemos null y
 * el controlador cae en las plantillas locales: la tienda nunca se queda sin
 * el botón funcionando.
 */
let cliente = null;

export const getIA = () => {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!cliente) {
    cliente = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return cliente;
};

/*
 * Flash es el modelo rápido y con capa gratuita. Se puede cambiar desde el .env
 * si algún día quieren uno más potente sin tocar código.
 *
 * Va el alias "latest" y no una versión clavada a propósito: estaba fijo en
 * gemini-2.5-flash, Google lo retiró para llaves nuevas y la API empezó a
 * responder 404. Como el controlador cae en las plantillas cuando la IA falla,
 * nadie se enteró: el botón "Generar con IA" seguía funcionando y devolvía
 * texto de reglas. El alias se mueve solo cuando Google jubila una versión.
 */
export const MODELO_IA = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

/*
 * El modelo de respaldo, para cuando el primero está saturado.
 *
 * No es "uno peor por si acaso": es OTRO modelo, con su propia capacidad. La
 * capa gratuita de Google se congestiona POR MODELO, no en conjunto.
 *
 * El orden salió de medirlo, no de suponerlo: en 8 llamadas seguidas,
 * "gemini-flash-latest" fallo con 503 sus tres intentos LAS OCHO VECES, y las
 * ocho las contesto "lite" al primer intento. Asi que lite va de primero y
 * flash de respaldo, no al reves.
 *
 * Si algun dia se da vuelta —la congestion se mueve— se cambia sin tocar
 * codigo, con GEMINI_MODEL y GEMINI_MODEL_RESPALDO en el .env.
 */
export const MODELO_IA_RESPALDO = process.env.GEMINI_MODEL_RESPALDO || "gemini-flash-latest";

/*
 * ============================================================
 * REINTENTOS — el 503 de Google no tiene por qué llegar al cliente
 * ============================================================
 * EL PROBLEMA
 * La capa gratuita de Gemini devuelve 503 UNAVAILABLE ("this model is
 * currently experiencing high demand") de forma intermitente. Medido en esta
 * tienda: 2 de cada 4 llamadas seguidas fallaban, sin que nada estuviera mal
 * configurado. El código se rendía al primer intento y caía a las plantillas,
 * así que el dueño tocaba "Generar con IA" y le salía un texto de reglas una
 * de cada dos veces, sin entender por qué.
 *
 * Un 503 es justamente el error que se reintenta: es temporal, y el siguiente
 * intento suele pasar. Con la mitad de fallos, tres intentos llevan el acierto
 * de ~50% a ~87%, y probar además el otro modelo lo sube más.
 *
 * QUÉ SE REINTENTA Y QUÉ NO
 * Solo lo transitorio: 503 (saturado), 429 (pasó el límite por minuto) y 500
 * (error interno de Google). Una llave inválida (403), un modelo que ya no
 * existe (404) o un prompt mal armado (400) NO se reintentan: no se van a
 * arreglar solos y repetirlos solo hace esperar al que está mirando.
 * ============================================================
 */
const TRANSITORIOS = [429, 500, 503];

/*
 * El código de error de Google viene dentro del mensaje, como JSON. Se lee con
 * cuidado porque no siempre es JSON —a veces es un fallo de red pelado— y aquí
 * reventar sería peor que no saber el código.
 */
const codigoDeError = (error) => {
  if (typeof error?.status === "number") return error.status;
  try {
    return JSON.parse(error.message)?.error?.code ?? null;
  } catch {
    return null;
  }
};

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

/*
 * Llama a la IA aguantando los tropiezos de Google.
 *
 * `peticion` es lo mismo que recibe generateContent, PERO sin `model`: el
 * modelo lo elige esta función, que para eso prueba los dos.
 *
 * `intentos` es por modelo. Se deja configurable porque no todas las llamadas
 * pueden esperar lo mismo: al asistente de voz le habla alguien en la cara y
 * tiene que contestar ya, mientras que redactar una promoción puede tardar
 * unos segundos más si a cambio sale con IA de verdad.
 */
export const generarConIA = async (peticion, { intentos = 3 } = {}) => {
  const ia = getIA();
  if (!ia) throw new Error("La IA no está configurada");

  let ultimoError = null;

  for (const model of [MODELO_IA, MODELO_IA_RESPALDO]) {
    for (let intento = 1; intento <= intentos; intento++) {
      try {
        return await ia.models.generateContent({ ...peticion, model });
      } catch (error) {
        ultimoError = error;
        const codigo = codigoDeError(error);

        // Lo que no se arregla solo: se corta aquí y no se hace esperar a nadie.
        if (codigo != null && !TRANSITORIOS.includes(codigo)) throw error;

        /*
         * La espera crece entre intentos: si el modelo está congestionado,
         * volver a golpearlo al instante lo encuentra igual de congestionado.
         */
        if (intento < intentos) await esperar(400 * intento);
      }
    }
    console.log(`IA: "${model}" no respondió en ${intentos} intentos, probando el siguiente modelo`);
  }

  throw ultimoError;
};
