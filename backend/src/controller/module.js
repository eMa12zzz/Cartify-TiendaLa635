import moduleModel from '../models/module.js';
import mongoose from "mongoose";

const moduleController = {};

//Select
moduleController.getModule = async (req, res) => {
    try {
        const modules = await moduleModel.find();
        res.status(200).json(modules);
    } catch (error) {
        console.log("error" + error);
        res.status(500).json({ message: 'Internal Server Error getModules' });
    }
};

//Insert
moduleController.insertModule = async (req, res) => {
        // Agrega esto justo después de guardar el admin
    console.log("Nombre de la DB actual:", mongoose.connection.name);
    
    //1- Pedimos los datos para insertar
    const { name, description } = req.body;
    //2- Lleno una instancia de mi Schema
    const newModule = new moduleModel({ name, description });
    //3- Guardamos en la base de datos
    await newModule.save();
    res.status(201).json({ message: 'Module created successfully' });


};

//Update
moduleController.updateModule = async (req, res) => {
    try {
        //1- Pedimos los datos para actualizar
        let { name, description } = req.body;

        //Valores requeridos
        if (!name || !description) {
            return res.status(400).json({ message: 'required fields' });
        }

        const updateModule = await moduleModel.findByIdAndUpdate(
            req.params.id,
            { name, description },
            { new: true }
        );
        
        if (!updateModule) {
            return res.status(404).json({ message: 'Module not found' });
        }
        return res.status(200).json({ message: 'Module updated successfully' });

    } catch (error) {
        console.log("error" + error);
        res.status(500).json({ message: 'Internal Server Error updateModule' });
    }
};

//Delete
moduleController.deleteModule = async (req, res) => {
    try {
        const deleteModule = await moduleModel.findByIdAndDelete(req.params.id);
        if (!deleteModule) {
            return res.status(404).json({ message: 'Module not found' });
        }
        return res.status(200).json({ message: 'Module deleted successfully' });
    } catch (error) {
        console.log("error" + error);
        res.status(500).json({ message: 'Internal Server Error deleteModule' });
    }
};

export default moduleController;