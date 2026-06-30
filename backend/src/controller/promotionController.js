import promotionModel from "../models/promotion.js"
import mongoose from "mongoose";

const promotionController = {};

promotionController.getPromotions = async (req, res) => {
  try {
    const promotions = await promotionModel.find()
      .populate("productsId");

    return res.status(200).json(promotions);

  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

promotionController.insertPromotion = async (req, res) => {
  try {
    const {
      productsId,
      promoDescription,
      discount,
      isActive
    } = req.body;

    if (
      !productsId || 
      !promoDescription || 
      discount === undefined || 
      isActive === undefined
    ) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const newPromotion = new promotionModel({
      productsId,
      promoDescription,
      discount,
      isActive
    });

    await newPromotion.save();

    return res.status(201).json({
      message: "Promotion created successfully"
    });

  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

promotionController.updatePromotion = async (req, res) => {
  try {
    const {
      productsId,
      promoDescription,
      discount,
      isActive
    } = req.body;

    if (
      !productsId || 
      !promoDescription || 
      discount === undefined || 
      isActive === undefined
    ) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const promotionFound = await promotionModel.findById(req.params.id);

    if (!promotionFound) {
      return res.status(404).json({
        message: "Promotion not found"
      });
    }

    const updatedData = {
      productsId,
      promoDescription,
      discount,
      isActive
    };

    await promotionModel.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    return res.status(200).json({
      message: "Promotion updated successfully"
    });

  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

promotionController.deletePromotion = async (req, res) => {
  try {
    const promotionFound = await promotionModel.findById(req.params.id);

    if (!promotionFound) {
      return res.status(404).json({
        message: "Promotion not found"
      });
    }

    await promotionModel.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      message: "Promotion deleted successfully"
    });

  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

export default promotionController;