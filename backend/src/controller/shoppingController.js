import shoppingModel from "../models/shoppings.js";

const shoppingController = {};

// SELECT
shoppingController.getShoppings = async (req, res) => {
  try {
    const shoppings = await shoppingModel.find()
      .populate("supplierId") // Popula los datos del proveedor
      .populate("products.productId"); // Popula los datos de cada producto dentro del arreglo

    return res.status(200).json(shoppings);

  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({
      message: "Error interno del servidor"
    });
  }
};

// INSERT
shoppingController.insertShopping = async (req, res) => {
  try {
    const {
      supplierId,
      date,
      total,
      products
    } = req.body;

    // Validación
    // Comprobamos que el arreglo de productos exista y no esté vacío
    if (
      !supplierId || 
      !date || 
      total === undefined || 
      !products || 
      products.length === 0
    ) {
      return res.status(400).json({
        message: "Faltan campos obligatorios: agregue al menos un producto"
      });
    }

    const newShopping = new shoppingModel({
      supplierId,
      date,
      total,
      products
    });

    await newShopping.save();

    return res.status(201).json({
      message: "Compra registrada"
    });

  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({
      message: "Error interno del servidor"
    });
  }
};

// UPDATE
shoppingController.updateShopping = async (req, res) => {
  try {
    const {
      supplierId,
      date,
      total,
      products
    } = req.body;

    // Validación
    if (
      !supplierId || 
      !date || 
      total === undefined || 
      !products || 
      products.length === 0
    ) {
      return res.status(400).json({
        message: "Faltan campos obligatorios"
      });
    }

    const shoppingFound = await shoppingModel.findById(req.params.id);

    if (!shoppingFound) {
      return res.status(404).json({
        message: "No se encontró la compra"
      });
    }

    const updatedData = {
      supplierId,
      date,
      total,
      products
    };

    await shoppingModel.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    return res.status(200).json({
      message: "Compra actualizada"
    });

  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({
      message: "Error interno del servidor"
    });
  }
};

// DELETE
shoppingController.deleteShopping = async (req, res) => {
  try {
    const shoppingFound = await shoppingModel.findById(req.params.id);

    if (!shoppingFound) {
      return res.status(404).json({
        message: "No se encontró la compra"
      });
    }

    await shoppingModel.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      message: "Compra eliminada"
    });

  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({
      message: "Error interno del servidor"
    });
  }
};

export default shoppingController;