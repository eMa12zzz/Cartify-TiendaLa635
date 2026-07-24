import promotionModel from "../models/promotion.js";
import { v2 as cloudinary } from "cloudinary";

const promotionController = {};

// items llega como JSON string (FormData): [{ productId, discount, fixedPrice }]
const parseItems = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
};

const parseActivo = (v) => !(v === 'false' || v === false);

promotionController.getPromotions = async (req, res) => {
  try {
    const promotions = await promotionModel.find().populate("items.productId");
    return res.status(200).json(promotions);
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

promotionController.insertPromotion = async (req, res) => {
  try {
    const { title, promoDescription, type, buyQty, payQty, isActive } = req.body;
    const items = parseItems(req.body.items);

    if (!promoDescription) {
      return res.status(400).json({ message: "La descripción es requerida" });
    }
    if (!items.length) {
      return res.status(400).json({ message: "Agrega al menos un producto a la promoción" });
    }

    const newPromotion = new promotionModel({
      title,
      promoDescription,
      type: type || "descuento",
      items,
      buyQty: buyQty ? Number(buyQty) : 2,
      payQty: payQty ? Number(payQty) : 1,
      isActive: parseActivo(isActive),
      image: req.file ? req.file.path : undefined,
      public_id: req.file ? req.file.filename : undefined,
    });

    await newPromotion.save();
    return res.status(201).json({ message: "Promotion created successfully" });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

promotionController.updatePromotion = async (req, res) => {
  try {
    const { title, promoDescription, type, buyQty, payQty, isActive } = req.body;
    const items = parseItems(req.body.items);

    if (!promoDescription) {
      return res.status(400).json({ message: "La descripción es requerida" });
    }
    if (!items.length) {
      return res.status(400).json({ message: "Agrega al menos un producto a la promoción" });
    }

    const found = await promotionModel.findById(req.params.id);
    if (!found) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    const updatedData = {
      title,
      promoDescription,
      type: type || "descuento",
      items,
      buyQty: buyQty ? Number(buyQty) : 2,
      payQty: payQty ? Number(payQty) : 1,
      isActive: parseActivo(isActive),
    };

    if (req.file) {
      if (found.public_id) {
        try { await cloudinary.uploader.destroy(found.public_id); } catch (e) { /* ignore */ }
      }
      updatedData.image = req.file.path;
      updatedData.public_id = req.file.filename;
    }

    await promotionModel.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    return res.status(200).json({ message: "Promotion updated successfully" });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

promotionController.deletePromotion = async (req, res) => {
  try {
    const found = await promotionModel.findById(req.params.id);
    if (!found) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    if (found.public_id) {
      try { await cloudinary.uploader.destroy(found.public_id); } catch (e) { /* ignore */ }
    }

    await promotionModel.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "Promotion deleted successfully" });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default promotionController;
