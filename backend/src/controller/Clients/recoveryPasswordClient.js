import jsonwebtoken from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";

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
        message: "Client not found",
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
      subject: "Código de recuperación",
      html: HTMLRecoveryEmail(randomCode),
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.log(error);
        return res.status(500).json({
          message: "Error sending email",
        });
      }
    });

    return res.status(200).json({
      message: "Recovery code sent successfully",
    });

  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({
      message: "Internal server error",
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
        message: "Recovery session expired",
      });
    }

    const decoded = jsonwebtoken.verify(
      token,
      config.JWT.secret
    );

    if (code !== decoded.randomCode) {
      return res.status(400).json({
        message: "Invalid code",
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
      message: "Code verified successfully",
    });

  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Cambiar contraseña
recoveryPasswordClientController.newPassword = async (req, res) => {
  try {
    const { newPassword, confirmNewPassword } = req.body;

    if (!newPassword || !confirmNewPassword) {
      return res.status(400).json({
        message: "Both password fields are required",
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    const token = req.cookies.recoveryCookie;

    if (!token) {
      return res.status(400).json({
        message: "Recovery session expired",
      });
    }

    const decoded = jsonwebtoken.verify(
      token,
      config.JWT.secret
    );

    if (!decoded.verified) {
      return res.status(400).json({
        message: "Code not verified",
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
      message: "Password updated successfully",
    });

  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export default recoveryPasswordClientController;