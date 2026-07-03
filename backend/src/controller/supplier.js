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
    try {
        console.log("Nombre de la DB actual:", mongoose.connection.name);

        const { name, phoneNumber, email, creditDays, brandIds, isActive } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'El nombre del proveedor es obligatorio' });
        }
        if (!email || !email.trim()) {
            return res.status(400).json({ message: 'El correo del proveedor es obligatorio' });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'El formato del correo no es válido' });
        }

        const existing = await supplierModel.findOne({ name: name.trim() });
        if (existing) {
            return res.status(400).json({ message: 'Ya existe un proveedor con ese nombre' });
        }

        const newSupplier = new supplierModel({ name: name.trim(), phoneNumber, email: email.trim(), creditDays, brandIds: brandIds || [], isActive: isActive !== undefined ? isActive : true });
        await newSupplier.save();
        res.status(201).json({ message: 'Supplier created successfully' });
    } catch (error) {
        console.log("error" + error);
        res.status(500).json({ message: 'Internal Server Error insertSupplier' });
    }
};

//Update
supplierController.updateSupplier = async (req, res) => {
    try {
        //1- Pedimos los datos para actualizar
        let { name, phoneNumber, email, creditDays, brandIds, isActive } = req.body;

        //Valores requeridos
        if (!name || !phoneNumber || !email || !creditDays) {
            return res.status(400).json({ message: 'required fields' });
        }

        const updateSupplier = await supplierModel.findByIdAndUpdate(
            req.params.id,
            { name, phoneNumber, email, creditDays, brandIds, isActive },
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