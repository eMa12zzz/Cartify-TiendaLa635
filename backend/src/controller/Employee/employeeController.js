import employeeModel from '../../models/employee.js';
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

const employeeController = {};

// Select
employeeController.getEmployees = async (req, res) => {
    try {
        // Soporte para filtros por query params (nombre, estado, rol)
        const filter = {};
        if (req.query.isActive !== undefined) {
            filter.isActive = req.query.isActive === 'true';
        }
        if (req.query.role) {
            filter.role = req.query.role;
        }
        if (req.query.search) {
            // Búsqueda case-insensitive por nombre
            filter.fullName = { $regex: req.query.search, $options: 'i' };
        }

        const employee = await employeeModel.find(filter).select('-password'); // No devolver la contraseña
        res.status(200).json(employee);
    } catch (error) {
        console.log("error " + error);
        res.status(500).json({ message: 'Internal Server Error get Employee' });
    }
};

// Select by ID
employeeController.getEmployeeById = async (req, res) => {
    try {
        const employee = await employeeModel.findById(req.params.id).select('-password');
        if (!employee) return res.status(404).json({ message: 'Employee not found' });
        res.status(200).json(employee);
    } catch (error) {
        console.log("error " + error);
        res.status(500).json({ message: 'Internal Server Error get Employee' });
    }
};

// Insert
employeeController.insertEmployee = async (req, res) => {
    try {
        // 1- Pedimos los datos para insertar
        const { fullName, dui, phoneNumber, email, userName, password, role } = req.body;
        
        // Validación básica
        if (!fullName || !dui || !phoneNumber || !email || !userName || !password || !req.file) {
             return res.status(400).json({ message: "All fields and image are required" });
        }

        // 2- Lleno una instancia de mi Schema. El password se encriptará automáticamente por el hook pre-save.
        const newEmployee = new employeeModel({ 
            fullName, 
            dui, 
            phoneNumber, 
            image: req.file.path, 
            public_id: req.file.filename, 
            email, 
            userName, 
            password,
            role
        });
        
        // 3- Guardamos en la base de datos
        await newEmployee.save();
        res.status(201).json({ message: 'Employee created successfully' });
    } catch (error) {
        console.log("error " + error);
        res.status(500).json({ message: 'Internal Server Error insert Employee' });
    }
};

// Update
employeeController.updateEmployee = async (req, res) => {
  try {
    let { fullName, dui, phoneNumber, email, userName, password, role, isActive } = req.body;

    email = email?.trim();
    userName = userName?.trim();

    if (!email || !userName || !fullName || !dui || !phoneNumber) {
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

    employeeFound.fullName = fullName;
    employeeFound.dui = dui;
    employeeFound.phoneNumber = phoneNumber;
    employeeFound.email = email;
    employeeFound.userName = userName;
    
    if (role) employeeFound.role = role;
    if (isActive !== undefined) employeeFound.isActive = isActive;
    
    // Si viene una contraseña nueva, la actualizamos y el hook pre-save se encarga de hacer el hash.
    if (password) {
        employeeFound.password = password;
    }

    // Si viene una nueva imagen
    if (req.file) {
      if (employeeFound.public_id) {
          await cloudinary.uploader.destroy(employeeFound.public_id);
      }
      employeeFound.image = req.file.path;
      employeeFound.public_id = req.file.filename;
    }

    // Usamos .save() en lugar de findByIdAndUpdate para que se ejecute el hook pre-save del schema
    await employeeFound.save();

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

// Toggle Active
employeeController.toggleActive = async (req, res) => {
    try {
        const employee = await employeeModel.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        
        employee.isActive = !employee.isActive;
        // No necesitamos validar ni hacer nada con el password aquí, .save() no re-hasheará si no se modifica.
        await employee.save();
        
        return res.status(200).json({ message: `Employee status updated to ${employee.isActive ? 'active' : 'inactive'}` });
    } catch (error) {
        console.log("error " + error);
        res.status(500).json({ message: 'Internal Server Error toggle Employee' });
    }
};

// Delete
employeeController.deleteEmployee = async (req, res) => {
    try {
        const employeeFound = await employeeModel.findById(req.params.id);
        if (!employeeFound) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        if (employeeFound.public_id) {
            await cloudinary.uploader.destroy(employeeFound.public_id);
        }

        await employeeModel.findByIdAndDelete(req.params.id);
        
        return res.status(200).json({ message: 'Employee deleted successfully' });
    } catch (error) {
        console.log("error " + error);
        res.status(500).json({ message: 'Internal Server Error delete Employee' });
    }
};

export default employeeController;