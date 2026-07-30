import clientModel from "../../models/client.js";
import adminModel from "../../models/admin.js";
import employeeModel from "../../models/employee.js";
import bcryptjs from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import { config } from "../../../config.js";

const loginClientController = {};

/*
 * El personal también entra por aquí.
 *
 * Esta puerta solo miraba la colección de clientes, así que un empleado o un
 * administrador con sus credenciales correctas recibía "el correo o
 * contraseña son incorrectos" — un mensaje que además miente, porque estaban
 * bien. Y sin poder entrar, no llegaban a la pantalla de Reparto, que vive
 * justamente en el área de cliente porque se usa desde el teléfono.
 *
 * Se busca primero en clientes (es lo normal) y solo si no aparece se prueba
 * con el personal.
 */
const buscarPersonal = async (email) => {
  const admin = await adminModel.findOne({ email });
  if (admin) return { doc: admin, tipo: "admin" };

  const empleado = await employeeModel.findOne({ email });
  if (empleado) return { doc: empleado, tipo: "employee" };

  return null;
};

/*
 * Entrada del personal: se comprueba la contraseña y que la cuenta esté
 * activa. No lleva el bloqueo por intentos fallidos de los clientes porque
 * esos campos no existen en sus modelos; el panel administrativo sigue siendo
 * su puerta principal.
 */
const entrarComoPersonal = async (res, { doc, tipo }, password) => {
  if (doc.isActive === false) {
    return res.status(403).json({ message: "Cuenta desactivada" });
  }

  const coincide = await bcryptjs.compare(password, doc.password || "");
  if (!coincide) {
    return res.status(401).json({ message: "El correo o contraseña son incorrectos" });
  }

  const token = jsonwebtoken.sign(
    { id: doc._id, userType: tipo === "admin" ? "Admin" : "Employee" },
    config.JWT.secret,
    { expiresIn: "30d" }
  );

  res.cookie("authCookie", token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 });

  return res.status(200).json({
    message: "Sesión iniciada",
    token,
    userType: tipo,
    client: {
      id: doc._id,
      fullName: doc.fullName || doc.name || "",
      email: doc.email,
      userName: doc.userName || "",
      image: doc.image,
    },
  });
};

loginClientController.login = async (req, res) => {
  const { email, password } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Validar email
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ message: "El correo no es válido" });
  }
  if (!password) {
   return res.status(400).json({
      message:"Escriba su contraseña"
   });
 }

  try {
    // Buscar cliente
    const clientFound = await clientModel.findOne({ email });

    if (!clientFound) {
      // Puede ser alguien del personal entrando a la tienda desde su teléfono.
      const personal = await buscarPersonal(email);
      if (personal) return entrarComoPersonal(res, personal, password);

      return res.status(401).json({ message: "El correo o contraseña son incorrectos" });
    }

    // Verificar si está activo
    if (!clientFound.isActive) {
      return res.status(403).json({ message: "La cuenta está desactivada" });
    }

    // Verificar si está verificado
    if (!clientFound.isVerified) {
      return res.status(403).json({ message: "La cuenta todavía no está verificada" });
    }

    // Verificar bloqueo temporal
    if (clientFound.timeOut && clientFound.timeOut > Date.now()) {
      return res.status(403).json({
        message: "Cuenta bloqueada un rato. Intente de nuevo en unos minutos."
      });
    }

    // Comparar contraseña
    const isMatch = await bcryptjs.compare(
      password,
      clientFound.password
    );

    if (!isMatch) {
      /*
       * Un mismo correo puede tener cuenta de cliente Y de personal, cada una
       * con su contraseña. Si la del cliente no coincide, se prueba la del
       * personal antes de dar el error: quien administra la tienda espera
       * entrar con las credenciales que usa todos los días.
       *
       * Va ANTES de sumar el intento fallido a propósito: entrar con la
       * contraseña de admin no debe ir bloqueando la cuenta de cliente.
       */
      const personal = await buscarPersonal(email);
      if (personal) {
        const comoPersonal = await bcryptjs.compare(password, personal.doc.password || "");
        if (comoPersonal) return entrarComoPersonal(res, personal, password);
      }

      clientFound.loginAttemps = (clientFound.loginAttemps || 0) + 1;

      // Bloquear después de 5 intentos
      if (clientFound.loginAttemps >= 5) {
        clientFound.timeOut = Date.now() + 5 * 60 * 1000; // 5 minutos
        clientFound.loginAttemps = 0;

        await clientFound.save();

        return res.status(403).json({
          message: "Cuenta bloqueada por varios intentos fallidos. Espere 5 minutos."
        });
      }

      await clientFound.save();

      return res.status(401).json({
        message: "La contraseña es incorrecta"
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
      message: "Sesión iniciada",
      token,
      userType: "client",
      client: {
        id: clientFound._id,
        fullName: clientFound.fullName,
        email: clientFound.email,
        userName: clientFound.userName,
        image: clientFound.image,
      },
    });

  } catch (error) {
    console.log("error login cliente: ", error);
    return res.status(500).json({
      message: "Error interno del servidor",
    });
  }
};

export default loginClientController;