import clientModel from "../../models/client.js";
import bcryptjs from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import { config } from "../../../config.js";

const loginClientController = {};

loginClientController.login = async (req, res) => {
  const { email, password } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Validar email
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email" });
  }

  try {
    // Buscar cliente
    const clientFound = await clientModel.findOne({ email });

    if (!clientFound) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Verificar si está activo
    if (!clientFound.isActive) {
      return res.status(403).json({ message: "Account disabled" });
    }

    // Verificar si está verificado
    if (!clientFound.isVerified) {
      return res.status(403).json({ message: "Account not verified" });
    }

    // Verificar bloqueo temporal
    if (clientFound.timeOut && clientFound.timeOut > Date.now()) {
      return res.status(403).json({
        message: "Account temporarily blocked. Try again later."
      });
    }

    // Comparar contraseña
    const isMatch = await bcryptjs.compare(
      password,
      clientFound.password
    );

    if (!isMatch) {
      clientFound.loginAttemps = (clientFound.loginAttemps || 0) + 1;

      // Bloquear después de 5 intentos
      if (clientFound.loginAttemps >= 5) {
        clientFound.timeOut = Date.now() + 5 * 60 * 1000; // 5 minutos
        clientFound.loginAttemps = 0;

        await clientFound.save();

        return res.status(403).json({
          message: "Account blocked due to multiple failed login attempts"
        });
      }

      await clientFound.save();

      return res.status(401).json({
        message: "Incorrect password"
      });
    }

    // Reiniciar intentos
    clientFound.loginAttemps = 0;
    clientFound.timeOut = null;

    await clientFound.save();

    // Generar JWT
    const token = jsonwebtoken.sign(
      {
        id: clientFound._id,
        userType: "Client",
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
      client: {
        id: clientFound._id,
        fullnName: clientFound.fullnName,
        email: clientFound.email,
        userName: clientFound.userName,
        image: clientFound.image,
      },
    });

  } catch (error) {
    console.log("error: ", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export default loginClientController;