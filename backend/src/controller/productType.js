import productTypeModel from '../models/productType.js';
import mongoose from "mongoose";

const productTypeController = {};

// SELECT
productTypeController.getProductTypes = async (req, res) => {

    try {

        const productTypes = await productTypeModel.find();

        res.status(200).json(productTypes);

    } catch (error) {

        console.log("error " + error);

        res.status(500).json({
            message: 'Internal Server Error getProductTypes'
        });
    }
};

// INSERT
productTypeController.insertProductType = async (req, res) => {

    try {

        console.log("Nombre de la DB actual:", mongoose.connection.name);

        // 1- Pedimos datos
        const {moduleId, type, subtype } = req.body;

        // Validación
        if (!moduleId || !type || !subtype) {
            return res.status(400).json({
                message: 'Required fields'
            });
        }

        // 2- Creamos instancia
        const newProductType = new productTypeModel({
            moduleId,
            type,
            subtype
        });

        // 3- Guardamos
        await newProductType.save();

        res.status(201).json({
            message: 'Product Type created successfully'
        });

    } catch (error) {

        console.log("error " + error);

        res.status(500).json({
            message: 'Internal Server Error insertProductType'
        });
    }
};

// UPDATE
productTypeController.updateProductType = async (req, res) => {

    try {

        const {moduleId, type, subtype } = req.body;

        // Validación
        if (!moduleId || !type || !subtype) {
            return res.status(400).json({
                message: 'Required fields'
            });
        }

        const updatedProductType = await productTypeModel.findByIdAndUpdate(
            req.params.id,
            {
                moduleId,
                type,
                subtype
            },
            {
                new: true
            }
        );

        if (!updatedProductType) {
            return res.status(404).json({
                message: 'Product Type not found'
            });
        }

        res.status(200).json({
            message: 'Product Type updated successfully'
        });

    } catch (error) {

        console.log("error " + error);

        res.status(500).json({
            message: 'Internal Server Error updateProductType'
        });
    }
};

// DELETE
productTypeController.deleteProductType = async (req, res) => {

    try {

        const deletedProductType = await productTypeModel.findByIdAndDelete(req.params.id);

        if (!deletedProductType) {
            return res.status(404).json({
                message: 'Product Type not found'
            });
        }

        res.status(200).json({
            message: 'Product Type deleted successfully'
        });

    } catch (error) {

        console.log("error " + error);

        res.status(500).json({
            message: 'Internal Server Error deleteProductType'
        });
    }
};

export default productTypeController;