import productModel from "../models/product.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";

const productController = {};

// SELECT
productController.getProduct = async (req, res) => {

  try {

    const products = await productModel.find()
      .populate("typeId")
      .populate("brandId")
      .populate("moduleId")
      .populate("supplierId");

    return res.status(200).json(products);

  } catch (error) {

    console.log("error " + error);

    return res.status(500).json({
      message: "Error interno del servidor"
    });
  }
};

// INSERT
productController.insertProduct = async (req, res) => {

  try {

    console.log("Nombre de la DB actual:", mongoose.connection.name);

    // Solicito datos
    const {
      name,
      typeId,
      brandId,
      expirationDate,
      priceCost,
      salePrice,
      description,
      barCode,
      stock,
      moduleId,
      supplierId
    } = req.body;

    // Validación
    if (
      !name ||
      !typeId ||
      !brandId ||
      !priceCost ||
      !salePrice ||
      !description ||
      !barCode ||
      !stock ||
      !moduleId ||
      !supplierId ||
      !req.file
    ) {
      return res.status(400).json({
        message: "Faltan campos obligatorios"
      });
    }

    const existingProduct = await productModel.findOne({ barCode });
    if (existingProduct) {
      return res.status(400).json({
        message: "El código de barras ya está en uso."
      });
    }

    const newProduct = new productModel({
      name,
      image: req.file.path,
      public_id: req.file.filename,
      typeId,
      brandId,
      expirationDate,
      priceCost,
      salePrice,
      description,
      barCode,
      stock,
      maxQuantity: stock,
      moduleId,
      supplierId
    });

    await newProduct.save();

    return res.status(201).json({
      message: "Producto creado"
    });

  } catch (error) {

    console.log("error " + error);

    return res.status(500).json({
      message: "Error interno del servidor"
    });
  }
};

// UPDATE
productController.updateProduct = async (req, res) => {

  try {

    const {
      name,
      typeId,
      brandId,
      expirationDate,
      priceCost,
      salePrice,
      description,
      barCode,
      stock,
      moduleId,
      supplierId
    } = req.body;

    // Validación
    if (
      !name ||
      !typeId ||
      !brandId ||
      !priceCost ||
      !salePrice ||
      !description ||
      !barCode ||
      !stock ||
      !moduleId ||
      !supplierId
    ) {
      return res.status(400).json({
        message: "Faltan campos obligatorios"
      });
    }

    const existingProduct = await productModel.findOne({ barCode, _id: { $ne: req.params.id } });
    if (existingProduct) {
      return res.status(400).json({
        message: "El código de barras ya está en uso por otro producto."
      });
    }

    const productFound = await productModel.findById(req.params.id);

    if (!productFound) {
      return res.status(404).json({
        message: "No se encontró el producto"
      });
    }

    const updatedData = {
      name,
      typeId,
      brandId,
      expirationDate,
      priceCost,
      salePrice,
      description,
      barCode,
      stock,
      maxQuantity: Math.max(stock, productFound.maxQuantity || stock),
      moduleId,
      supplierId
    };

    // Si viene nueva imagen
    if (req.file) {

      // Elimino imagen anterior
      await cloudinary.uploader.destroy(productFound.public_id);

      // Guardo nueva imagen
      updatedData.image = req.file.path;
      updatedData.public_id = req.file.filename;
    }

    await productModel.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    return res.status(200).json({
      message: "Producto actualizado"
    });

  } catch (error) {

    console.log("error " + error);

    return res.status(500).json({
      message: "Error interno del servidor"
    });
  }
};

// DELETE
productController.deleteProduct = async (req, res) => {

  try {

    const productFound = await productModel.findById(req.params.id);

    if (!productFound) {
      return res.status(404).json({
        message: "No se encontró el producto"
      });
    }

    // Eliminar imagen de Cloudinary
    await cloudinary.uploader.destroy(productFound.public_id);

    // Eliminar producto
    await productModel.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      message: "Producto eliminado"
    });

  } catch (error) {

    console.log("error " + error);

    return res.status(500).json({
      message: "Error interno del servidor"
    });
  }
};

export default productController;