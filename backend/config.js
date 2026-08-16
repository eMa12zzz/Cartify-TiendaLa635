import dotenv from "dotenv";

//Ejecutamos la libreria dotenv
dotenv.config();

export const config = {
  db: {
    URI: process.env.DB_URI,
  },
  JWT: {
    secret: process.env.JWT_secret_key,
  },
  email:{
    user_email: process.env.USER_EMAIL,
    user_password: process.env.USER_PASSWORD
  },
    cloudinary: {
    cloudinary_name: process.env.CLOUDINARY_CLOUD_NAME,
    cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
    cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET
  },
  wompi:{
    grant_type: process.env.GRANT_TYPE,
    audience: process.env.AUDIENCE,
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET
  },
  // Inicio de sesión con Google (clientes). El CLIENT_ID es el mismo que usa el
  // botón del frontend; el backend lo usa como "audience" para verificar que el
  // token de Google se emitió para ESTA app y no para otra.
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID
  },
  /*
   * Mailjet: manda los correos por su API HTTPS en vez de SMTP (puertos
   * 465/587), que Render bloquea en el plan gratis para frenar spam masivo.
   * Con SMTP el correo funciona en local y se cae mudo en producción; con la
   * API el mismo código sirve en los dos lados. Ver src/utils/sendMailMailjet.js.
   */
  mailjet: {
    apiKey: process.env.apikeymail,
    secretKey: process.env.apisecretmail,
    fromEmail: process.env.MAILJET_FROM_EMAIL,
    fromName: process.env.MAILJET_FROM_NAME
  },
  /*
   * La tienda vista desde afuera. Hace falta para los correos: un aviso de
   * promoción sin un enlace en el que se pueda dar clic es un volante que no
   * lleva a ninguna parte, y el servidor no tiene forma de adivinar en qué
   * dirección la abrió el cliente.
   *
   * TIENDA_URL va SIN barra al final (ej. https://la635.com); si alguien la
   * escribe con barra, la quitamos aquí y no en cada plantilla. En local no
   * hace falta configurarla: el valor por defecto es el puerto de Vite.
   */
  tienda: {
    url: (process.env.TIENDA_URL || "http://localhost:5173").replace(/\/+$/, ""),
    nombre: process.env.TIENDA_NOMBRE || "Tienda la 635"
  }
};
