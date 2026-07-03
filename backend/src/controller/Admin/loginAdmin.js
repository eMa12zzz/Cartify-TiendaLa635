import adminModel from "../../models/admin.js";
import bcryptjs from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import { config } from "../../../config.js";

const loginAdminController = {};

loginAdminController.login = async (req, res) => {
  const { email, password } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Validar email
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({
      message: "Invalid email",
    });
  }

  // Validar contraseña
  if (!password) {
    return res.status(400).json({
      message: "Password required",
    });
  }

  try {
    // Buscar administrador
    const adminFound = await adminModel.findOne({ email });

    if (!adminFound) {
      return res.status(404).json({
        message: "Administrator not found",
      });
    }

    // Verificar si está activo
    if (!adminFound.isActive) {
      return res.status(403).json({
        message: "Account disabled",
      });
    }

    // Verificar si la cuenta está bloqueada
    if (adminFound.timeOut && adminFound.timeOut > Date.now()) {
      return res.status(403).json({
        message: "Account temporarily blocked. Try again later.",
      });
    }

    // Comparar contraseña
    const isMatch = await bcryptjs.compare(
      password,
      adminFound.password
    );

    if (!isMatch) {
      adminFound.loginAttemps = (adminFound.loginAttemps || 0) + 1;

      // Bloquear después de 5 intentos
      if (adminFound.loginAttemps >= 5) {
        adminFound.timeOut = Date.now() + 5 * 60 * 1000; // 5 minutos
        adminFound.loginAttemps = 0;

        await adminFound.save();

        return res.status(403).json({
          message: "Account blocked due to multiple failed login attempts",
        });
      }

      await adminFound.save();

      return res.status(401).json({
        message: "Incorrect password",
      });
    }

    // Reiniciar intentos al iniciar sesión correctamente
    adminFound.loginAttemps = 0;
    adminFound.timeOut = null;

    await adminFound.save();

    // Generar JWT
    const token = jsonwebtoken.sign(
      {
        id: adminFound._id,
        userType: "Admin",
      },
      config.JWT.secret,
      {
        expiresIn: "30d",
      }
    );

    // Guardar cookie
    res.cookie("authCookie", token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      admin: {
        id: adminFound._id,
        email: adminFound.email,
        userName: adminFound.userName,
      },
    });

  } catch (error) {
    console.log("Error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export default loginAdminController;