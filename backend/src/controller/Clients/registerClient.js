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
    fullnName, 
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
      return res.status(400).json({ message: "Client already exists with this email" });
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
        fullnName,
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
      from: config.email.user_email,
      to: email,
      subject: "Verificación de cuenta",
      text: "Para verificar tu cuenta, utiliza este código: " + randomNumber + " expira en 15 minutos",
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("error " + error);
        return res.status(500).json({ message: "Error sending email" });
      }
      return res.status(200).json({ message: "Email sent" });
    });
  } catch (error) {
    console.log("error" + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

registerClientController.verifyCode = async (req, res) => {
  try {
    const { verificationCodeRequest } = req.body;
    const token = req.cookies.registrationCookie;

    if (!token) {
      return res.status(400).json({ message: "Verification session expired." });
    }

    const decoded = jsonwebtoken.verify(token, config.JWT.secret);
    
    // 5. Extraemos todo del token, incluyendo la imagen y el public_id
    const {
      randomNumber: storedCode,
      fullnName,
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
      return res.status(400).json({ message: "Invalid code" });
    }

    // 6. Guardamos en la base de datos usando el mismo estilo que tu employeeController
    const newClient = new clientModel({
      fullnName,
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

    return res.status(200).json({message: "Client registered successfully"});

  } catch (error) {
    console.log("error"+error);
    return res.status(500).json({message: "Internal server error or Invalid Token"});
  }
};

export default registerClientController;