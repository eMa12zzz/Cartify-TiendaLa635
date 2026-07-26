import printServiceModel from "../models/printService.js";

const printServiceController = {};

printServiceController.getServices = async (req, res) => {
  try {
    const services = await printServiceModel.find();
    return res.status(200).json(services);
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

printServiceController.insertService = async (req, res) => {
  try {
    const { name, widthCm, heightCm, pricePerCopy, allowsColor, colorSurcharge, isActive } = req.body;
    if (!name || pricePerCopy === undefined || pricePerCopy === '') {
      return res.status(400).json({ message: "Nombre y precio por copia son requeridos" });
    }
    const nuevo = new printServiceModel({
      name,
      widthCm: widthCm ? Number(widthCm) : 21.6,
      heightCm: heightCm ? Number(heightCm) : 27.9,
      pricePerCopy: Number(pricePerCopy),
      allowsColor: allowsColor !== undefined ? allowsColor : true,
      colorSurcharge: colorSurcharge ? Number(colorSurcharge) : 0,
      isActive: isActive !== undefined ? isActive : true,
    });
    await nuevo.save();
    return res.status(201).json({ message: "Servicio creado" });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

printServiceController.updateService = async (req, res) => {
  try {
    const { name, widthCm, heightCm, pricePerCopy, allowsColor, colorSurcharge, isActive } = req.body;
    if (!name || pricePerCopy === undefined || pricePerCopy === '') {
      return res.status(400).json({ message: "Nombre y precio por copia son requeridos" });
    }
    const updated = await printServiceModel.findByIdAndUpdate(
      req.params.id,
      {
        name,
        widthCm: widthCm ? Number(widthCm) : 21.6,
        heightCm: heightCm ? Number(heightCm) : 27.9,
        pricePerCopy: Number(pricePerCopy),
        allowsColor,
        colorSurcharge: colorSurcharge ? Number(colorSurcharge) : 0,
        isActive,
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Servicio no encontrado" });
    return res.status(200).json({ message: "Servicio actualizado" });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

printServiceController.deleteService = async (req, res) => {
  try {
    const deleted = await printServiceModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Servicio no encontrado" });
    return res.status(200).json({ message: "Servicio eliminado" });
  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default printServiceController;
