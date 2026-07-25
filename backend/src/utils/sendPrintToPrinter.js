import nodemailer from "nodemailer";
import { config } from "../../config.js";

/*
 * Envía el archivo del cliente al correo enlazado a la impresora (email-to-print).
 * Si no hay PRINTER_EMAIL configurado en el .env, no hace nada y devuelve
 * emailed:false — en ese caso el archivo igual quedó guardado en Cloudinary y
 * el empleado lo abre/imprime desde su pantalla (las 2 opciones que pediste).
 */
export const sendPrintToPrinter = async ({ fileUrl, fileName, options }) => {
  const printerEmail = process.env.PRINTER_EMAIL;
  if (!printerEmail) return { emailed: false, reason: "no_printer_email" };

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: config.email.user_email,
      pass: config.email.user_password,
    },
  });

  await transporter.sendMail({
    from: config.email.user_email,
    to: printerEmail,
    subject: `Impresión: ${fileName || "documento"}`,
    text: `Nuevo trabajo de impresión.\nOpciones: ${JSON.stringify(options || {})}`,
    attachments: [{ filename: fileName || "documento", path: fileUrl }],
  });

  return { emailed: true };
};
