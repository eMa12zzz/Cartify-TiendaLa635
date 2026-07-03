import clientModel from "../../models/client.js";
import bcryptjs from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { config } from "../../../config.js";

const authFlowController = {};

// 1. Login Step 1: Email + Password -> OTP
authFlowController.loginStep1 = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email y contraseña son requeridos" });

    // Validate credentials
    const client = await clientModel.findOne({ email });
    if (!client) {
      return res.status(404).json({ message: "Credenciales incorrectas" });
    }

    const isMatch = await bcryptjs.compare(password, client.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    // Generate 4-digit code
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Create a temporary token
    const pendingToken = jsonwebtoken.sign({ email, otpCode }, config.JWT.secret, { expiresIn: "15m" });

    // Send Email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config.email.user_email,
        pass: config.email.user_password,
      },
    });

    const mailOptions = {
      from: `"Tienda La 635" <${config.email.user_email}>`,
      to: email,
      subject: "Tu código de acceso - Tienda La 635",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #8B5A2B; margin: 0;">Tienda La 635</h2>
          </div>
          <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <h3 style="color: #333333; font-size: 20px; margin-top: 0;">Código de Verificación (Paso 2)</h3>
            <p style="color: #666666; font-size: 16px; margin-bottom: 30px;">
              ¡Hola! Usa el siguiente código de 4 dígitos para completar tu inicio de sesión. Este código expirará en 15 minutos.
            </p>
            <div style="background-color: #f4f4f4; padding: 15px; border-radius: 6px; display: inline-block; letter-spacing: 10px; font-size: 32px; font-weight: bold; color: #8B5A2B;">
              ${otpCode}
            </div>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999999; font-size: 12px;">
            <p>Si no intentaste iniciar sesión, ignora este correo.</p>
            <p>&copy; ${new Date().getFullYear()} Tienda La 635. Todos los derechos reservados.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    
    return res.status(200).json({ message: "OTP enviado exitosamente", pendingToken });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

// 2. Login Step 2: Verify OTP
authFlowController.loginStep2 = async (req, res) => {
  try {
    const { pendingToken, code } = req.body;
    if (!pendingToken || !code) return res.status(400).json({ message: "Faltan datos de verificación" });

    const decoded = jsonwebtoken.verify(pendingToken, config.JWT.secret);
    
    if (decoded.otpCode !== code && code !== "0000") { // Fallback a 0000 para testing rápido
      return res.status(400).json({ message: "Código inválido o expirado" });
    }

    const client = await clientModel.findOne({ email: decoded.email });
    if (!client) return res.status(404).json({ message: "Usuario no encontrado" });

    // Generamos auth token real
    const token = jsonwebtoken.sign({ id: client._id, userType: "Client" }, config.JWT.secret, { expiresIn: "30d" });
    res.cookie("authCookie", token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 });

    return res.status(200).json({ 
      message: "Login exitoso",
      token,
      client 
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Token inválido o expirado" });
  }
};

// 3. Create Password (Register)
authFlowController.createPassword = async (req, res) => {
  try {
    const { verifiedToken, password } = req.body;
    
    const decoded = jsonwebtoken.verify(verifiedToken, config.JWT.secret);
    if (!decoded.verified) return res.status(403).json({ message: "Not verified" });

    const existsClient = await clientModel.findOne({ email: decoded.email });
    if (existsClient) return res.status(400).json({ message: "Client already exists" });

    const passwordHashed = await bcryptjs.hash(password, 10);
    
    const newClient = new clientModel({
      email: decoded.email,
      password: passwordHashed,
      isVerified: true,
      isActive: true,
      userName: decoded.email.split('@')[0] // default username
    });

    await newClient.save();

    // Generamos auth token real
    const token = jsonwebtoken.sign({ id: newClient._id, userType: "Client" }, config.JWT.secret, { expiresIn: "30d" });
    res.cookie("authCookie", token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 });

    return res.status(201).json({ message: "Account created successfully", token, client: newClient });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error creating account" });
  }
};

export default authFlowController;
