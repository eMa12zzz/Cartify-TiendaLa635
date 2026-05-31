import adminModel from '../../models/admin.js';
import mongoose from "mongoose";

const adminController = {};

//Select
adminController.getAdmins = async (req, res) => {
    try {
        const admins = await adminModel.find();
        res.status(200).json(admins);
    } catch (error) {
        console.log("error" + error);
        res.status(500).json({ message: 'Internal Server Error getAdmins' });
    }
};

//Insert
adminController.insertAdmin = async (req, res) => {
        // Agrega esto justo después de guardar el admin
console.log("Nombre de la DB actual:", mongoose.connection.name);
    
    //1- Pedimos los datos para insertar
    const { email, userName, password } = req.body;
    //2- Lleno una instancia de mi Schema
    const newAdmin = new adminModel({ email, userName, password });
    //3- Guardamos en la base de datos
    await newAdmin.save();
    res.status(201).json({ message: 'Admin created successfully' });


};

//Update
adminController.updateAdmin = async (req, res) => {
    try {
        //1- Pedimos los datos para actualizar
        let { email, userName, password } = req.body;

        //Validaciones
        email = email?.trim();
        userName = userName?.trim();

        //Valores requeridos
        if (!email || !userName || !password) {
            return res.status(400).json({ message: 'required fields' });
        }

        const updateAdmin = await adminModel.findByIdAndUpdate(
            req.params.id,
            { email, userName, password },
            { new: true }
        );
        
        if (!updateAdmin) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        return res.status(200).json({ message: 'Admin updated successfully' });

    } catch (error) {
        console.log("error" + error);
        res.status(500).json({ message: 'Internal Server Error updateAdmin' });
    }
};

//Delete
adminController.deleteAdmin = async (req, res) => {
    try {
        const deleteAdmin = await adminModel.findByIdAndDelete(req.params.id);
        if (!deleteAdmin) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        return res.status(200).json({ message: 'Admin deleted successfully' });
    } catch (error) {
        console.log("error" + error);
        res.status(500).json({ message: 'Internal Server Error deleteAdmin' });
    }
};

export default adminController;