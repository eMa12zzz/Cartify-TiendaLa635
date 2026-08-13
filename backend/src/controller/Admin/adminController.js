import adminModel from "../../models/admin.js";
import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

const adminController = {};

// Traer todos los admins
adminController.getAdmins = async (req, res) => {
  try {

    // Sin el `-password` esto devolvía el hash del ADMINISTRADOR de la tienda,
    // que es la llave del panel entero. Mismo arreglo que en clientes.
    const admins = await adminModel.find().select("-password");

    return res.status(200).json(admins);

  } catch (error) {
    // El nombre de la función se queda en el log, que es donde sirve.
    console.log("Error getAdmins:", error);

    return res.status(500).json({
      message: "Error interno del servidor",
    });
  }
};

// Crear un admin
adminController.insertAdmin = async (req, res) => {
  try {

    console.log("Nombre de la DB actual:", mongoose.connection.name);

    // Sacamos los datos que manda el front
    let { email, userName, password } = req.body;

    email = email?.trim();
    userName = userName?.trim();

    // Que no venga nada vacío
    if (!email || !userName || !password) {
      return res.status(400).json({
        message: "Todos los campos son obligatorios",
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "El formato del correo no es válido",
      });
    }

    // Revisamos que no exista otro admin con ese correo
    const adminExists = await adminModel.findOne({ email });

    if (adminExists) {
      return res.status(400).json({
        message: "Ya existe un administrador con ese correo",
      });
    }

    // Encriptamos la contraseña antes de guardarla
    const passwordHashed = await bcryptjs.hash(password, 10);

    // Creamos el admin
    const newAdmin = new adminModel({
      email,
      userName,
      password: passwordHashed,
      isActive: true,
    });

    await newAdmin.save();

    return res.status(201).json({
      message: "Administrador creado",
    });

  } catch (error) {
    console.log("Error insertAdmin:", error);

    return res.status(500).json({
      message: "Error interno del servidor",
    });
  }
};

// Editar un admin
adminController.updateAdmin = async (req, res) => {
  try {

    let { email, userName, password } = req.body;

    email = email?.trim();
    userName = userName?.trim();

    // Solo estos son obligatorios
    if (!email || !userName) {
      return res.status(400).json({
        message: "El email y nombre de usuario son obligatorios",
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "El formato del correo no es válido",
      });
    }

    // Buscamos el admin
    const adminFound = await adminModel.findById(req.params.id);

    if (!adminFound) {
      return res.status(404).json({
        message: "No se encontró el administrador",
      });
    }

    // Lo que siempre se puede editar
    const updatedData = {
      email,
      userName,
    };

    // Si escribió una contraseña nueva, la encriptamos
    if (password && password.trim() !== "") {
      updatedData.password = await bcryptjs.hash(password, 10);
    }

    await adminModel.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    return res.status(200).json({
      message: "Administrador actualizado",
    });

  } catch (error) {
    console.log("Error updateAdmin:", error);

    return res.status(500).json({
      message: "Error interno del servidor",
    });
  }
};

// Borrar un admin
adminController.deleteAdmin = async (req, res) => {
  try {

    const deleteAdmin = await adminModel.findByIdAndDelete(req.params.id);

    if (!deleteAdmin) {
      return res.status(404).json({
        message: "No se encontró el administrador",
      });
    }

    return res.status(200).json({
      message: "Administrador eliminado",
    });

  } catch (error) {
    console.log("Error deleteAdmin:", error);

    return res.status(500).json({
      message: "Error interno del servidor",
    });
  }
};

export default adminController;