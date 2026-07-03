import brandsModel from '../models/brand.js';
import mongoose from "mongoose";

const brandController = {};

//Select
brandController.getBrand = async (req, res) => {
    try {
        const brands = await brandsModel.find();
        res.status(200).json(brands);
    } catch (error) {
        console.log("error" + error);
        res.status(500).json({ message: 'Internal Server Error getBrands' });
    }
};

//Insert
brandController.insertBrand = async (req, res) => {
    try {
        console.log("Nombre de la DB actual:", mongoose.connection.name);

        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'El nombre de la marca es obligatorio' });
        }

        const existing = await brandsModel.findOne({ name: name.trim() });
        if (existing) {
            return res.status(400).json({ message: 'Ya existe una marca con ese nombre' });
        }

        const newBrand = new brandsModel({ name: name.trim() });
        await newBrand.save();
        res.status(201).json({ message: 'Brand created successfully' });
    } catch (error) {
        console.log("error" + error);
        res.status(500).json({ message: 'Internal Server Error insertBrand' });
    }
};

//Update
brandController.updateBrand = async (req, res) => {
    try {
        //1- Pedimos los datos para actualizar
        let { name } = req.body;

        //Valores requeridos
        if (!name) {
            return res.status(400).json({ message: 'required fields' });
        }

        const updateBrand = await brandsModel.findByIdAndUpdate(
            req.params.id,
            { name },
            { new: true }
        );
        
        if (!updateBrand) {
            return res.status(404).json({ message: 'Brand not found' });
        }
        return res.status(200).json({ message: 'Brand updated successfully' });

    } catch (error) {
        console.log("error" + error);
        res.status(500).json({ message: 'Internal Server Error updateBrand' });
    }
};

//Delete
brandController.deleteBrand = async (req, res) => {
    try {
        const deleteBrand = await brandsModel.findByIdAndDelete(req.params.id);
        if (!deleteBrand) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        return res.status(200).json({ message: 'Brand deleted successfully' });
    } catch (error) {
        console.log("error" + error);
        res.status(500).json({ message: 'Internal Server Error deleteBrand' });
    }
};

export default brandController;