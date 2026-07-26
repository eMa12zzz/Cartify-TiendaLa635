import loyaltyConfigModel from "../models/loyaltyConfig.js";

const loyaltyConfigController = {};

// SELECT — Devuelve la config de puntos. Si aún no existe, la crea con defaults.
loyaltyConfigController.getConfig = async (req, res) => {
  try {
    let config = await loyaltyConfigModel.findOne();
    if (!config) {
      config = await loyaltyConfigModel.create({});
    }
    return res.status(200).json(config);

  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// UPDATE — Actualiza la tasa de puntos y/o el vencimiento (desde el admin).
// Usa upsert: si el documento singleton no existe todavía, lo crea.
loyaltyConfigController.updateConfig = async (req, res) => {
  try {
    const { pointsPerDollar, expiryMonths, pointsPerDollarRedeem, minRedeemPoints, isActive } = req.body;

    // Solo tocamos los campos que realmente vengan en la petición.
    const updates = {};
    if (pointsPerDollar !== undefined) updates.pointsPerDollar = pointsPerDollar;
    if (expiryMonths !== undefined) updates.expiryMonths = expiryMonths;
    if (pointsPerDollarRedeem !== undefined) updates.pointsPerDollarRedeem = pointsPerDollarRedeem;
    if (minRedeemPoints !== undefined) updates.minRedeemPoints = minRedeemPoints;
    if (isActive !== undefined) updates.isActive = isActive;

    const config = await loyaltyConfigModel.findOneAndUpdate(
      {},
      updates,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ message: "Configuración actualizada", config });

  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default loyaltyConfigController;
