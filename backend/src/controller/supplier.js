import supplierModel from '../models/supplier.js';
import mongoose from "mongoose";

const supplierController = {};

//Select
supplierController.getSupplier = async (req, res) => {
    try {
        const suppliers = await supplierModel.find();
        res.status(200).json(suppliers);
    } catch (error) {
        console.log("error" + error);
        res.status(500).json({ message: 'Internal Server Error getSuppliers' });
    }
};

//Insert
supplierController.insertSupplier = async (req, res) => {
        // Agrega esto justo después de guardar el admin
    console.log("Nombre de la DB actual:", mongoose.connection.name);
    
    //1- Pedimos los datos para insertar
    const { name, phoneNumber, email, creditDays } = req.body;
    //2- Lleno una instancia de mi Schema
    const newSupplier = new supplierModel({ name, phoneNumber, email, creditDays });
    //3- Guardamos en la base de datos
    await newSupplier.save();
    res.status(201).json({ message: 'Supplier created successfully' });


};

//Update
supplierController.updateSupplier = async (req, res) => {
    try {
        //1- Pedimos los datos para actualizar
        let { name, phoneNumber, email, creditDays } = req.body;

        //Valores requeridos
        if (!name || !phoneNumber || !email || !creditDays) {
            return res.status(400).json({ message: 'required fields' });
        }

        const updateSupplier = await supplierModel.findByIdAndUpdate(
            req.params.id,
            { name, phoneNumber, email, creditDays },
            { new: true }
        );
        
        if (!updateSupplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }
        return res.status(200).json({ message: 'Supplier updated successfully' });

    } catch (error) {
        console.log("error" + error);
        res.status(500).json({ message: 'Internal Server Error updateSupplier' });
    }
};

//Delete
supplierController.deleteSupplier = async (req, res) => {
    try {
        const deleteSupplier = await supplierModel.findByIdAndDelete(req.params.id);
        if (!deleteSupplier) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        return res.status(200).json({ message: 'Supplier deleted successfully' });
    } catch (error) {
        console.log("error" + error);
        res.status(500).json({ message: 'Internal Server Error deleteSupplier' });
    }
};

export default supplierController;