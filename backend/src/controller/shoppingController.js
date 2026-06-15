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
      message: "Internal server error"
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
        message: "All fields are required, including at least one product"
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
      message: "Shopping created successfully"
    });

  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({
      message: "Internal server error"
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
        message: "All fields are required"
      });
    }

    const shoppingFound = await shoppingModel.findById(req.params.id);

    if (!shoppingFound) {
      return res.status(404).json({
        message: "Shopping not found"
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
      message: "Shopping updated successfully"
    });

  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

// DELETE
shoppingController.deleteShopping = async (req, res) => {
  try {
    const shoppingFound = await shoppingModel.findById(req.params.id);

    if (!shoppingFound) {
      return res.status(404).json({
        message: "Shopping not found"
      });
    }

    await shoppingModel.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      message: "Shopping deleted successfully"
    });

  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

export default shoppingController;