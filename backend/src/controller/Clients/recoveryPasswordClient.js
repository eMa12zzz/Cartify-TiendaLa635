import jsonwebtoken from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import crypto from "crypto";

import { sendEmail } from "../../utils/sendMailMailjet.js";
import HTMLRecoveryEmail from "../../utils/sendMailRecovery.js";
import clientModel from "../../models/client.js";

import { config } from "../../../config.js";

const recoveryPasswordClientController = {};

// Solicitar código de recuperación
recoveryPasswordClientController.requestCode = async (req, res) => {
  try {
    const { email } = req.body;

    const clientFound = await clientModel.findOne({ email });

    if (!clientFound) {
      return res.status(404).json({
        message: "No hay ninguna cuenta con ese correo",
      });
    }

    const randomCode = crypto.randomBytes(3).toString("hex");

    const token = jsonwebtoken.sign(
      {
        email,
        randomCode,
        userType: "client",
        verified: false,
      },
      config.JWT.secret,
      {
        expiresIn: "15m",
      }
    );

    res.cookie("recoveryCookie", token, {
      maxAge: 15 * 60 * 1000,
      httpOnly: true,
    });

    try {
      await sendEmail(
        email,
        "Código de recuperación — Tienda la 635",
        HTMLRecoveryEmail(randomCode),
        `Recibimos una solicitud para restablecer su contraseña en Tienda la 635. Su código es: ${randomCode}. Vale por 15 minutos. Si usted no lo pidió, ignore este correo.`
      );
    } catch (mailError) {
      console.log("No se pudo enviar el código de recuperación:", mailError.message);
      return res.status(500).json({
        message: "No se pudo enviar el correo",
      });
    }

    return res.status(200).json({
      message: "Le enviamos el código a su correo",
    });

  } catch (error) {
    console.log("error recuperación de contraseña: " + error);
    return res.status(500).json({
      message: "Error interno del servidor",
    });
  }
};

// Verificar código
recoveryPasswordClientController.verifyCode = async (req, res) => {
  try {
    const { code } = req.body;

    const token = req.cookies.recoveryCookie;

    if (!token) {
      return res.status(400).json({
        message: "La recuperación venció. Pida un código nuevo.",
      });
    }

    const decoded = jsonwebtoken.verify(
      token,
      config.JWT.secret
    );

    if (code !== decoded.randomCode) {
      return res.status(400).json({
        message: "El código no es válido",
      });
    }

    const newToken = jsonwebtoken.sign(
      {
        email: decoded.email,
        userType: "client",
        verified: true,
      },
      config.JWT.secret,
      {
        expiresIn: "15m",
      }
    );

    res.cookie("recoveryCookie", newToken, {
      maxAge: 15 * 60 * 1000,
      httpOnly: true,
    });

    return res.status(200).json({
      message: "Código verificado",
    });

  } catch (error) {
    console.log("error recuperación de contraseña: " + error);
    return res.status(500).json({
      message: "Error interno del servidor",
    });
  }
};

// Cambiar contraseña
recoveryPasswordClientController.newPassword = async (req, res) => {
  try {
    const { newPassword, confirmNewPassword } = req.body;

    if (!newPassword || !confirmNewPassword) {
      return res.status(400).json({
        message: "Escriba la contraseña nueva y su confirmación",
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        message: "Las contraseñas no coinciden",
      });
    }

    const token = req.cookies.recoveryCookie;

    if (!token) {
      return res.status(400).json({
        message: "La recuperación venció. Pida un código nuevo.",
      });
    }

    const decoded = jsonwebtoken.verify(
      token,
      config.JWT.secret
    );

    if (!decoded.verified) {
      return res.status(400).json({
        message: "Primero verifique el código",
      });
    }

    const passwordHashed = await bcryptjs.hash(
      newPassword,
      10
    );

    await clientModel.findOneAndUpdate(
      {
        email: decoded.email,
      },
      {
        password: passwordHashed,
      },
      {
        new: true,
      }
    );

    res.clearCookie("recoveryCookie");

    return res.status(200).json({
      message: "Contraseña actualizada",
    });

  } catch (error) {
    console.log("error recuperación de contraseña: " + error);
    return res.status(500).json({
      message: "Error interno del servidor",
    });
  }
};

export default recoveryPasswordClientController;