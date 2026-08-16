/*
 * Envío de correos con la API de Mailjet, en vez de Nodemailer por SMTP.
 *
 * Render bloquea los puertos 465 y 587 en el plan gratis, para frenar spam
 * masivo — así que Nodemailer funciona en local y se cae mudo apenas se
 * despliega, sin ningún aviso claro de por qué. Mailjet manda el correo por
 * su API sobre HTTPS (puerto 443, siempre abierto), evitando el problema de
 * raíz en vez de parcharlo.
 *
 * Una sola conexión para toda la vida del servidor (no una por correo, como
 * hacían los `transporter` sueltos que había antes en cada controlador).
 */
import Mailjet from "node-mailjet";
import { config } from "../../config.js";

const mailjet = Mailjet.apiConnect(config.mailjet.apiKey, config.mailjet.secretKey);

/*
 * Se reutiliza en cualquier controlador que necesite mandar un correo:
 * recuperación de contraseña, verificación de registro, código de 2FA, etc.
 *
 * No atrapa el error aquí adentro — lo deja subir para que cada controlador
 * decida su propio mensaje y código de estado, como ya hacía con Nodemailer.
 *
 * @param {string} to - correo del destinatario
 * @param {string} subject - asunto del correo
 * @param {string} html - contenido en HTML
 * @param {string} [text] - alternativa en texto plano; un correo que es SOLO
 *   HTML es una de las señales que más pesan para que los filtros de spam lo
 *   dejen fuera de la bandeja principal.
 * @param {Array<{ContentType:string, Filename:string, Base64Content:string}>} [attachments] -
 *   adjuntos ya codificados en base64, tal como los pide el campo
 *   "Attachments" de la API v3.1 de Mailjet.
 */
export const sendEmail = async (to, subject, html, text, attachments) => {
  const result = await mailjet.post("send", { version: "v3.1" }).request({
    Messages: [
      {
        From: {
          Email: config.mailjet.fromEmail,
          Name: config.mailjet.fromName,
        },
        To: [{ Email: to }],
        Subject: subject,
        ...(text ? { TextPart: text } : {}),
        HTMLPart: html,
        ...(attachments ? { Attachments: attachments } : {}),
      },
    ],
  });
  return result.body;
};
