import employeeModel from '../../models/employee.js';
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";


const employeeController = {};

//Select
employeeController.getEmployees = async (req, res) => {
    try {
        const employee = await employeeModel.find();
        res.status(200).json(employee);
    } catch (error) {
        // El nombre de la función se queda en el log, que es donde sirve.
        console.log("error getEmployees: " + error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

//Insert
employeeController.insertEmployee = async (req, res) => {
    
  try {
    //1- Pedimos los datos para insertar
    const { fullName, dui, phoneNumber, email, userName, password } = req.body;

    //2- Lleno una instancia de mi Schema
    /*
     * La foto es opcional: antes esto hacía req.file.path a secas y, si el
     * empleado se registraba sin foto, reventaba con un 500 sin explicar nada.
     * Sin foto, la ficha muestra las iniciales.
     */
    const newEmployee = new employeeModel({
      fullName, dui, phoneNumber, email, userName, password,
      image: req.file ? req.file.path : undefined,
      public_id: req.file ? req.file.filename : undefined,
    });

    //3- Guardamos en la base de datos
    await newEmployee.save();
    res.status(201).json({ message: 'Empleado creado' });
  } catch (error) {
    console.log("error insertEmployee: " + error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }


};

employeeController.updateEmployee = async (req, res) => {
  try {

    let { fullName, dui, phoneNumber, email, userName, password } = req.body;

    email = email?.trim();
    userName = userName?.trim();

    if (!email || !userName || !password || !fullName || !dui || !phoneNumber) {
      return res.status(400).json({
        message: "Faltan campos obligatorios"
      });
    }

    const employeeFound = await employeeModel.findById(req.params.id);

    if (!employeeFound) {
      return res.status(404).json({
        message: "No se encontró el empleado"
      });
    }

    const updatedData = {
      fullName,
      dui,
      phoneNumber,
      email,
      userName,
      password
    };

    //Si viene una nueva imagen
    if (req.file) {

      await cloudinary.uploader.destroy(employeeFound.public_id);

      updatedData.image = req.file.path;
      updatedData.public_id = req.file.filename;
    }

    await employeeModel.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    return res.status(200).json({
      message: "Empleado actualizado"
    });

  } catch (error) {
    console.log("error updateEmployee: " + error);

    return res.status(500).json({
      message: "Error interno del servidor"
    });
  }
};

//Delete
employeeController.deleteEmployee = async (req, res) => {
    try {
        const deleteEmployee = await employeeModel.findByIdAndDelete(req.params.id);
        if (!deleteEmployee) {
            return res.status(404).json({ message: 'No se encontró el empleado' });
        }
        return res.status(200).json({ message: 'Empleado eliminado' });
    } catch (error) {
        // El log decía "deleteAdmin" por copiar y pegar; aquí se borran empleados.
        console.log("error deleteEmployee: " + error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

export default employeeController;