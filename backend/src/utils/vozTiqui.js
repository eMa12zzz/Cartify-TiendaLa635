/*
 * ============================================================
 * LA VOZ DE TIQUI — vozTiqui.js
 * ============================================================
 * El asistente de voz habla con la voz de Tiqui, la mascota: la misma del
 * video de presentación. Sale de ElevenLabs, que la va entregando mientras
 * la genera (streaming): la primera parte del audio llega en menos de medio
 * segundo, y el navegador empieza a sonar sin esperar el archivo completo.
 *
 * Por qué ElevenLabs y no HeyGen (donde se grabó el video): HeyGen tardaba
 * ~5 s por frase y entrega el archivo entero al final. Para una conversación
 * eso es una eternidad.
 *
 * La llave vive SOLO aquí, en el servidor (ELEVENLABS_API_KEY). El navegador
 * y la app piden el audio a /api/ai/voz y nunca la ven. Sin llave, la ruta
 * contesta 503 y los clientes hablan con la voz del sistema, como antes.
 *
 * Variables:
 *   ELEVENLABS_API_KEY   la llave (solo con permiso de Text to Speech)
 *   ELEVENLABS_VOICE_ID  la voz; por defecto la de Tiqui (ver abajo)
 *   ELEVENLABS_MODEL     por defecto eleven_flash_v2_5, el más rápido y barato
 *
 * La voz de Tiqui es una voz de la cuenta de ElevenLabs de la tienda (elegida
 * el 2026-09-23). NO es la del primer video: esa era de HeyGen, generada con
 * el plan gratis, que no permite uso comercial ni clonarla.
 * ============================================================
 */

const VOZ_POR_DEFECTO = "p5EUznrYaWnafKvUkNiR";
const MODELO_POR_DEFECTO = "eleven_flash_v2_5";

export const vozDisponible = () => Boolean(process.env.ELEVENLABS_API_KEY);

/*
 * Lo que se escribe no siempre es lo que se dice.
 *
 *   - La tienda se llama "la seis tres cinco", NUNCA "seiscientos treinta y
 *     cinco" (lo pidió la tienda para el video y vale igual aquí).
 *   - Los precios se escriben "$2.50" y se dicen "2 dólares con 50 centavos":
 *     leído tal cual, el signo y el punto salen raros o en inglés.
 *   - Las promos "2x1" se dicen "2 por 1", no "dos equis uno".
 */
export const paraDecir = (texto) =>
  String(texto || "")
    .replace(/\b635\b/g, "seis tres cinco")
    .replace(/\b(\d+)\s?[xX×]\s?(\d+)\b/g, "$1 por $2")
    .replace(/\$\s?(\d+)(?:[.,](\d{1,2}))?/g, (_, enteros, decimales = "") => {
      const d = Number(enteros);
      const c = decimales ? Number(decimales.padEnd(2, "0")) : 0;
      const dolares = d === 1 ? "1 dólar" : `${d} dólares`;
      if (!c) return dolares;
      if (!d) return `${c} centavos`;
      return `${dolares} con ${c}`;
    })
    .replace(/\s+/g, " ")
    .trim();

/*
 * Las frases que se repiten ("¿Algo más?", "Vacié tu carrito…") se guardan
 * ya generadas: suenan al instante y no se pagan dos veces. Solo en memoria
 * — si el servidor se reinicia, se vuelven a pedir y listo.
 */
const MAX_FRASES = 300;
const MAX_BYTES_FRASE = 400 * 1024;
const frases = new Map();

export const frasePrevia = (texto) => {
  const audio = frases.get(texto);
  if (!audio) return null;
  // La más usada se queda: se mueve al final para que no la saque la limpieza.
  frases.delete(texto);
  frases.set(texto, audio);
  return audio;
};

export const guardarFrase = (texto, audio) => {
  if (!audio?.length || audio.length > MAX_BYTES_FRASE) return;
  frases.set(texto, audio);
  while (frases.size > MAX_FRASES) frases.delete(frases.keys().next().value);
};

/*
 * Pide el audio a ElevenLabs y devuelve la respuesta tal cual, para que la
 * ruta la vaya pasando al cliente mientras llega. `signal` corta el pedido
 * si el cliente se va (lo interrumpieron, cerró el asistente).
 */
export const pedirVoz = async (texto, { signal } = {}) => {
  const voz = process.env.ELEVENLABS_VOICE_ID || VOZ_POR_DEFECTO;
  const url =
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voz)}/stream` +
    "?output_format=mp3_44100_64";

  const respuesta = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: texto,
      model_id: process.env.ELEVENLABS_MODEL || MODELO_POR_DEFECTO,
      language_code: "es",
    }),
    signal,
  });

  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => "");
    throw new Error(`ElevenLabs ${respuesta.status}: ${detalle.slice(0, 200)}`);
  }
  return respuesta;
};
