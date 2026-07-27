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

/*
 * La fecha llega como "2026-08-03" desde un <input type="date">. Se guarda al
 * FINAL de ese día: si el gerente escribe "vence el 3", la promo tiene que
 * servir todo el 3 y no apagarse a la medianoche en que empieza.
 * Vacío significa "sin vencimiento", y hay que guardarlo como null explícito
 * para poder quitarle la fecha a una promo que ya la tenía.
 */
const parseVencimiento = (valor) => {
  if (!valor || valor === 'null' || valor === 'undefined') return null;
  const soloFecha = /^\d{4}-\d{2}-\d{2}$/.test(valor);
  const fecha = new Date(soloFecha ? `${valor}T23:59:59.999` : valor);
  return isNaN(fecha.getTime()) ? null : fecha;
};

/*
 * Apaga las promociones que ya vencieron. Corre cuando alguien pide la lista
 * (vencimiento perezoso, igual que los puntos de fidelidad) en vez de con una
 * tarea programada: no hace falta un servidor despierto a medianoche, y la
 * tienda nunca alcanza a mostrar una promo vencida porque el filtro del
 * frontend ya la descarta por fecha.
 *
 * El $type es obligatorio, no adorno: en Mongo el null ordena ANTES que
 * cualquier fecha, así que un $lt suelto también agarraría las promos sin
 * vencimiento y las apagaría a todas.
 */
const desactivarVencidas = async () => {
  try {
    await promotionModel.updateMany(
      { isActive: true, endsAt: { $type: "date", $lt: new Date() } },
      { $set: { isActive: false } }
    );
  } catch (error) {
    // Que no se caiga la lista por esto: peor es no devolver las promos.
    console.log("no se pudieron desactivar las promos vencidas: " + error);
  }
};

promotionController.getPromotions = async (req, res) => {
  try {
    await desactivarVencidas();
    const promotions = await promotionModel.find().populate("items.productId");
    return res.status(200).json(promotions);
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

promotionController.insertPromotion = async (req, res) => {
  try {
    const { title, promoDescription, type, buyQty, payQty, isActive, showBanner, tema, colorFondo, colorFondo2, colorTexto, colorAcento, colorFlecha, icono, imagenCompleta, endsAt } = req.body;
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
      showBanner: parseActivo(showBanner),
      // Diseño del banner: se usa cuando no hay imagen propia.
      tema: tema || "cafe",
      colorFondo, colorFondo2, colorTexto, colorAcento, colorFlecha,
      icono: icono || "",
      imagenCompleta: imagenCompleta === 'true' || imagenCompleta === true,
      endsAt: parseVencimiento(endsAt),
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
    const { title, promoDescription, type, buyQty, payQty, isActive, showBanner, tema, colorFondo, colorFondo2, colorTexto, colorAcento, colorFlecha, icono, imagenCompleta, endsAt } = req.body;
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
      showBanner: parseActivo(showBanner),
      // Diseño del banner: se usa cuando no hay imagen propia.
      tema: tema || "cafe",
      colorFondo, colorFondo2, colorTexto, colorAcento, colorFlecha,
      icono: icono || "",
      imagenCompleta: imagenCompleta === 'true' || imagenCompleta === true,
      endsAt: parseVencimiento(endsAt),
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
