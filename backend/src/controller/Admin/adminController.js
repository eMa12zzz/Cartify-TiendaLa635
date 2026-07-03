import adminModel from "../../models/admin.js";
import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

const adminController = {};

// Traer todos los admins
adminController.getAdmins = async (req, res) => {
  try {

    const admins = await adminModel.find();

    return res.status(200).json(admins);

  } catch (error) {
    console.log("Error:", error);

    return res.status(500).json({
      message: "Internal Server Error getAdmins",
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
        message: "Administrator already exists",
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
      message: "Admin created successfully",
    });

  } catch (error) {
    console.log("Error:", error);

    return res.status(500).json({
      message: "Internal Server Error insertAdmin",
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
        message: "Admin not found",
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
      message: "Admin updated successfully",
    });

  } catch (error) {
    console.log("Error:", error);

    return res.status(500).json({
      message: "Internal Server Error updateAdmin",
    });
  }
};

// Borrar un admin
adminController.deleteAdmin = async (req, res) => {
  try {

    const deleteAdmin = await adminModel.findByIdAndDelete(req.params.id);

    if (!deleteAdmin) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      message: "Admin deleted successfully",
    });

  } catch (error) {
    console.log("Error:", error);

    return res.status(500).json({
      message: "Internal Server Error deleteAdmin",
    });
  }
};

export default adminController;