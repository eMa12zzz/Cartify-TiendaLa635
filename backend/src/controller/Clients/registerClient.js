import nodemailer from "nodemailer";
import crypto from "crypto";
import jsonwebtoken from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import clientModel from "../../models/client.js";
import { config } from "../../../config.js";

const registerClientController = {};

registerClientController.register = async (req, res) => {
  // 1. Extraer los datos de texto del body 
  const { 
    fullName, 
    dui, 
    phoneNumber, 
    ClientAddress, 
    email, 
    userName, 
    password 
  } = req.body;

  try {
    const existsClient = await clientModel.findOne({ email });
    if (existsClient) {
      return res.status(400).json({ message: "Ya existe una cuenta con ese correo" });
    }

    // 2. Extraer la imagen directamente de req.file (Igual que en tu CRUD de empleados)
    // Usamos el operador ternario (?) por si el cliente decide registrarse sin foto
    const image = req.file ? req.file.path : "";
    const public_id = req.file ? req.file.filename : "";

    const passwordHashed = await bcryptjs.hash(password, 10);
    const randomNumber = crypto.randomBytes(3).toString("hex");

    // 3. Guardar TODO en el token (incluyendo la imagen y el public_id que vienen de req.file)
    const token = jsonwebtoken.sign(
      {
        randomNumber,
        fullName,
        dui,
        phoneNumber,
        ClientAddress,
        image,      // <-- Guardamos la URL de la imagen
        public_id,  // <-- Guardamos el ID de la imagen
        email,
        userName,
        password: passwordHashed
      },
      config.JWT.secret,
      { expiresIn: "15m" }
    );

    res.cookie("registrationCookie", token, { maxAge: 15 * 60 * 1000 });

    // 4. Enviar el correo con el código
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config.email.user_email,
        pass: config.email.user_password,
      },
    });

    const mailOptions = {
      from: `"Tienda la 635" <${config.email.user_email}>`,
      to: email,
      subject: "Verificación de cuenta — Tienda la 635",
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Verificación de cuenta</title>
        </head>
        <body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                  <!-- HEADER -->
                  <tr>
                    <td style="background:#8B5A2B;padding:32px 40px;text-align:center;">
                      <p style="margin:0;font-size:12px;color:#f5dfc0;letter-spacing:2px;text-transform:uppercase;">Tienda</p>
                      <h1 style="margin:4px 0 0;font-size:30px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">la 635</h1>
                    </td>
                  </tr>
                  <!-- BODY -->
                  <tr>
                    <td style="padding:40px 40px 32px;">
                      <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#1a1a1a;">Verifica tu cuenta</h2>
                      <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.6;">
                        Gracias por registrarte. Usa el siguiente código de 6 caracteres para confirmar tu correo electrónico. <strong>Expira en 15 minutos.</strong>
                      </p>
                      <!-- CÓDIGO -->
                      <div style="background:#fdf6ee;border:2px dashed #d4a96a;border-radius:10px;padding:24px;text-align:center;margin-bottom:28px;">
                        <p style="margin:0 0 8px;font-size:12px;color:#888;letter-spacing:1px;text-transform:uppercase;">Tu código de verificación</p>
                        <span style="font-size:36px;font-weight:800;color:#8B5A2B;letter-spacing:10px;">${randomNumber}</span>
                      </div>
                      <p style="margin:0;font-size:13px;color:#999;line-height:1.6;">
                        Si no solicitaste esta verificación, puedes ignorar este correo con seguridad. Nadie ha accedido a tu cuenta.
                      </p>
                    </td>
                  </tr>
                  <!-- FOOTER -->
                  <tr>
                    <td style="background:#f9f9f9;padding:20px 40px;border-top:1px solid #eeeeee;text-align:center;">
                      <p style="margin:0;font-size:12px;color:#bbb;">© ${new Date().getFullYear()} Tienda la 635. Todos los derechos reservados.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("error enviando correo de verificación: " + error);
        return res.status(500).json({ message: "No se pudo enviar el correo" });
      }
      return res.status(200).json({ message: "Le enviamos el código a su correo" });
    });
  } catch (error) {
    console.log("error register cliente: " + error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

registerClientController.verifyCode = async (req, res) => {
  try {
    const { verificationCodeRequest } = req.body;
    const token = req.cookies.registrationCookie;

    if (!token) {
      return res.status(400).json({ message: "El registro venció. Vuelva a empezar." });
    }

    const decoded = jsonwebtoken.verify(token, config.JWT.secret);
    
    // 5. Extraemos todo del token, incluyendo la imagen y el public_id
    const {
      randomNumber: storedCode,
      fullName,
      dui,
      phoneNumber,
      ClientAddress,
      image,
      public_id,
      email,
      userName,
      password
    } = decoded;

    if (verificationCodeRequest !== storedCode) {
      return res.status(400).json({ message: "El código no es válido" });
    }

    // 6. Guardamos en la base de datos usando el mismo estilo que tu employeeController
    const newClient = new clientModel({
      fullName,
      dui,
      phoneNumber,
      ClientAddress,
      image,
      public_id,
      email,
      userName,
      password,
      isVerified: true, 
      isActive: true    
    });

    await newClient.save();
    res.clearCookie("registrationCookie");

    return res.status(200).json({message: "Cuenta creada"});

  } catch (error) {
    // El token vencido o manipulado cae aquí; el detalle va al log.
    console.log("error verifyCode: "+error);
    return res.status(500).json({message: "Error interno del servidor"});
  }
};
registerClientController.getAll = async (req, res) => {
  try {
    const clients = await clientModel.find();
    return res.status(200).json(clients);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "No se pudo cargar la lista de clientes" });
  }
};

export default registerClientController;