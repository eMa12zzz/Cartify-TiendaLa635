import adminModel from "../../models/admin.js";
import bcryptjs from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { config } from "../../../config.js";
import HTML2FAEmail from "../../utils/sendMail2FA.js";

const loginAdminController = {};

/*
 * ============================================================
 * LOGIN DE ADMIN CON DOBLE FACTOR (2FA)
 * ============================================================
 * Saber la contraseña ya no basta para entrar. El ingreso son DOS pasos:
 *
 *   Paso 1 (login):     correo + contraseña. Si están bien, NO se abre la
 *                       sesión: se genera un código, se manda al correo del
 *                       admin y se guarda —firmado— en una cookie corta.
 *   Paso 2 (verify2FA): el admin escribe el código. Si coincide con el de la
 *                       cookie, ahí sí se abre la sesión.
 *
 * El código NO se guarda en la base: viaja dentro de un JWT en cookie (igual
 * que la recuperación de contraseña), así que expira solo y no deja rastro que
 * limpiar. Con esto, aunque alguien tenga la contraseña, sin el correo del
 * dueño no entra.
 * ============================================================
 */

// Emisor de correos, el mismo que usa la recuperación de contraseña.
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.email.user_email,
    pass: config.email.user_password,
  },
});

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── PASO 1: correo + contraseña → manda el código ──
loginAdminController.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ message: "El correo no es válido" });
  }
  if (!password) {
    return res.status(400).json({ message: "Escriba su contraseña" });
  }

  try {
    const adminFound = await adminModel.findOne({ email });

    if (!adminFound) {
      return res.status(404).json({ message: "No se encontró el administrador" });
    }
    if (!adminFound.isActive) {
      return res.status(403).json({ message: "La cuenta está desactivada" });
    }

    // Bloqueo por intentos fallidos (lo de antes, intacto).
    if (adminFound.timeOut && adminFound.timeOut > Date.now()) {
      return res.status(403).json({
        message: "Cuenta bloqueada un rato. Intente de nuevo en unos minutos.",
      });
    }

    const isMatch = await bcryptjs.compare(password, adminFound.password);

    if (!isMatch) {
      adminFound.loginAttemps = (adminFound.loginAttemps || 0) + 1;
      if (adminFound.loginAttemps >= 5) {
        adminFound.timeOut = Date.now() + 5 * 60 * 1000; // 5 minutos
        adminFound.loginAttemps = 0;
        await adminFound.save();
        return res.status(403).json({
          message: "Cuenta bloqueada por varios intentos fallidos. Espere 5 minutos.",
        });
      }
      await adminFound.save();
      return res.status(401).json({ message: "La contraseña es incorrecta" });
    }

    // Contraseña correcta: se reinician los intentos, pero AÚN NO hay sesión.
    adminFound.loginAttemps = 0;
    adminFound.timeOut = null;
    await adminFound.save();

    /*
     * Código de 6 dígitos. Se firma dentro de un JWT junto con el id del admin
     * y viaja en una cookie de 10 minutos; el código no se guarda en la base.
     */
    const code = ("" + Math.floor(100000 + Math.random() * 900000));

    const twofaToken = jsonwebtoken.sign(
      { id: adminFound._id, code, purpose: "admin-2fa" },
      config.JWT.secret,
      { expiresIn: "10m" }
    );

    res.cookie("twofaCookie", twofaToken, {
      httpOnly: true,
      maxAge: 10 * 60 * 1000,
    });

    // El correo se manda, pero un fallo del correo no debe tumbar el login: se
    // reporta y el admin puede reintentar.
    try {
      await transporter.sendMail({
        from: config.email.user_email,
        to: adminFound.email,
        subject: "Código de acceso al panel — Tienda la 635",
        html: HTML2FAEmail(code),
      });
    } catch (mailError) {
      console.log("No se pudo enviar el código 2FA:", mailError.message);
      return res.status(500).json({
        message: "No pudimos enviar el código a su correo. Intente de nuevo.",
      });
    }

    // Se avisa a dónde se mandó, con el correo enmascarado.
    const [nombre, dominio] = adminFound.email.split("@");
    const enmascarado = `${nombre.slice(0, 2)}${"*".repeat(Math.max(1, nombre.length - 2))}@${dominio}`;

    return res.status(200).json({
      needs2FA: true,
      message: "Le enviamos un código a su correo",
      email: enmascarado,
    });
  } catch (error) {
    console.log("Error login admin:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

// ── PASO 2: verifica el código y ABRE la sesión ──
loginAdminController.verify2FA = async (req, res) => {
  const { code } = req.body;
  const twofaToken = req.cookies?.twofaCookie;

  if (!twofaToken) {
    return res.status(400).json({
      message: "El código venció. Vuelva a iniciar sesión.",
    });
  }
  if (!code || !String(code).trim()) {
    return res.status(400).json({ message: "Escriba el código que le llegó" });
  }

  let datos;
  try {
    datos = jsonwebtoken.verify(twofaToken, config.JWT.secret);
  } catch {
    return res.status(400).json({
      message: "El código venció. Vuelva a iniciar sesión.",
    });
  }

  if (datos.purpose !== "admin-2fa") {
    return res.status(400).json({ message: "Código no válido" });
  }

  // Comparación segura, tolerando espacios.
  if (String(code).trim() !== String(datos.code)) {
    return res.status(401).json({ message: "El código no es correcto" });
  }

  try {
    const adminFound = await adminModel.findById(datos.id);
    if (!adminFound || !adminFound.isActive) {
      return res.status(403).json({ message: "La cuenta ya no está disponible" });
    }

    const token = jsonwebtoken.sign(
      { id: adminFound._id, userType: "Admin" },
      config.JWT.secret,
      { expiresIn: "30d" }
    );

    res.cookie("authCookie", token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    // El código ya cumplió: se borra su cookie.
    res.clearCookie("twofaCookie");

    return res.status(200).json({
      message: "Sesión iniciada",
      token,
      admin: {
        id: adminFound._id,
        email: adminFound.email,
        userName: adminFound.userName,
        image: adminFound.image,
      },
    });
  } catch (error) {
    console.log("Error verificando 2FA admin:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

export default loginAdminController;
