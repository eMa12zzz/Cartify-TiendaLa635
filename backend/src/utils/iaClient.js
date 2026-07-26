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

// Flash es el modelo rápido y con capa gratuita. Se puede cambiar desde el .env
// si algún día quieren uno más potente sin tocar código.
export const MODELO_IA = process.env.GEMINI_MODEL || "gemini-2.5-flash";
