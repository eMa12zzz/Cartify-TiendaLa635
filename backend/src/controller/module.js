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
    try {
        console.log("Nombre de la DB actual:", mongoose.connection.name);

        const { name, description, isActive, flujo, icono, orden } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'El nombre del módulo es obligatorio' });
        }

        const existing = await moduleModel.findOne({ name: name.trim() });
        if (existing) {
            return res.status(400).json({ message: 'Ya existe un módulo con ese nombre' });
        }

        const newModule = new moduleModel({
            name: name.trim(),
            description,
            isActive: isActive !== undefined ? isActive : true,
            // Por defecto es un pasillo más de la tienda: se compra como todo lo demás.
            flujo: flujo === 'impresiones' ? 'impresiones' : 'estandar',
            icono: icono || '',
            orden: Number(orden) || 0,
        });
        await newModule.save();
        res.status(201).json({ message: 'Module created successfully' });
    } catch (error) {
        console.log("error" + error);
        res.status(500).json({ message: 'Internal Server Error insertModule' });
    }
};

//Update
moduleController.updateModule = async (req, res) => {
    try {
        //1- Pedimos los datos para actualizar
        let { name, description, isActive, flujo, icono, orden } = req.body;

        //Valores requeridos
        if (!name || !description) {
            return res.status(400).json({ message: 'required fields' });
        }

        const datos = { name, description, isActive };

        /*
         * El flujo solo se pisa si viene en la petición: un módulo viejo que
         * todavía no lo tiene no debe volverse 'estandar' porque alguien le
         * corrigió una tilde a la descripción.
         */
        if (flujo !== undefined) datos.flujo = flujo === 'impresiones' ? 'impresiones' : 'estandar';
        if (icono !== undefined) datos.icono = icono;
        if (orden !== undefined) datos.orden = Number(orden) || 0;

        const updateModule = await moduleModel.findByIdAndUpdate(
            req.params.id,
            datos,
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