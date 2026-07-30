import productTypeModel from '../models/productType.js';
import mongoose from "mongoose";

const productTypeController = {};

// SELECT
productTypeController.getProductTypes = async (req, res) => {

    try {

        const productTypes = await productTypeModel.find();

        res.status(200).json(productTypes);

    } catch (error) {

        // El nombre de la función se queda en el log, que es donde sirve.
        console.log("error getProductTypes: " + error);

        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
};

// INSERT
productTypeController.insertProductType = async (req, res) => {

    try {

        console.log("Nombre de la DB actual:", mongoose.connection.name);

        // 1- Pedimos datos
        const {moduleId, type, subtype, supplierIds, isActive } = req.body;

        // Validación
        if (!moduleId || !type || !subtype) {
            return res.status(400).json({
                message: 'Faltan campos obligatorios'
            });
        }

        // 2- Creamos instancia
        const newProductType = new productTypeModel({
            moduleId,
            type,
            subtype,
            supplierIds: supplierIds || [],
            isActive: isActive !== undefined ? isActive : true
        });

        // 3- Guardamos
        await newProductType.save();

        res.status(201).json({
            message: 'Categoría creada'
        });

    } catch (error) {

        console.log("error insertProductType: " + error);

        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
};

// UPDATE
productTypeController.updateProductType = async (req, res) => {

    try {

        const {moduleId, type, subtype, supplierIds, isActive } = req.body;

        // Validación
        if (!moduleId || !type || !subtype) {
            return res.status(400).json({
                message: 'Faltan campos obligatorios'
            });
        }

        const updatedProductType = await productTypeModel.findByIdAndUpdate(
            req.params.id,
            {
                moduleId,
                type,
                subtype,
                supplierIds,
                isActive
            },
            {
                new: true
            }
        );

        if (!updatedProductType) {
            return res.status(404).json({
                message: 'No se encontró la categoría'
            });
        }

        res.status(200).json({
            message: 'Categoría actualizada'
        });

    } catch (error) {

        console.log("error updateProductType: " + error);

        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
};

// DELETE
productTypeController.deleteProductType = async (req, res) => {

    try {

        const deletedProductType = await productTypeModel.findByIdAndDelete(req.params.id);

        if (!deletedProductType) {
            return res.status(404).json({
                message: 'No se encontró la categoría'
            });
        }

        res.status(200).json({
            message: 'Categoría eliminada'
        });

    } catch (error) {

        console.log("error deleteProductType: " + error);

        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
};

export default productTypeController;