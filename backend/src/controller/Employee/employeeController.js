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
        console.log("error" + error);
        res.status(500).json({ message: 'Internal Server Error get Employee' });
    }
};

//Insert
employeeController.insertEmployee = async (req, res) => {
    
    //1- Pedimos los datos para insertar
    const { fullName, dui, phoneNumber, image, email, userName, password } = req.body;
    //2- Lleno una instancia de mi Schema
    const newEmployee = new employeeModel({ fullName, dui, phoneNumber, image: req.file.path, public_id: req.file.filename, email, userName, password });
    //3- Guardamos en la base de datos
    await newEmployee.save();
    res.status(201).json({ message: 'Employee created successfully' });


};

employeeController.updateEmployee = async (req, res) => {
  try {

    let { fullName, dui, phoneNumber, email, userName, password } = req.body;

    email = email?.trim();
    userName = userName?.trim();

    if (!email || !userName || !password || !fullName || !dui || !phoneNumber) {
      return res.status(400).json({
        message: "Required fields"
      });
    }

    const employeeFound = await employeeModel.findById(req.params.id);

    if (!employeeFound) {
      return res.status(404).json({
        message: "Employee not found"
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
      message: "Employee updated successfully"
    });

  } catch (error) {
    console.log("error " + error);

    return res.status(500).json({
      message: "Internal server error update Employee"
    });
  }
};

//Delete
employeeController.deleteEmployee = async (req, res) => {
    try {
        const deleteEmployee = await employeeModel.findByIdAndDelete(req.params.id);
        if (!deleteEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        return res.status(200).json({ message: 'Employee deleted successfully' });
    } catch (error) {
        console.log("error" + error);
        res.status(500).json({ message: 'Internal Server Error deleteAdmin' });
    }
};

export default employeeController;