import clientModel from "../../models/client.js";
import { v2 as cloudinary } from "cloudinary";
import bcryptjs from "bcryptjs";


const clientController = {};

// GET ALL CLIENTS
clientController.getClients = async (req, res) => {
  try {
    const clients = await clientModel.find();

    return res.status(200).json(clients);

  } catch (error) {
    console.log("error " + error);

    return res.status(500).json({
      message: "Internal Server Error get Clients",
    });
  }
};

// GET ONE CLIENT (por id) — para el área "Mi Cuenta" del cliente.
// Excluimos la contraseña con .select('-password') para no exponer el hash.
clientController.getClientById = async (req, res) => {
  try {
    const client = await clientModel.findById(req.params.id).select("-password");

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    return res.status(200).json(client);

  } catch (error) {
    console.log("error " + error);

    return res.status(500).json({
      message: "Internal Server Error get Client",
    });
  }
};

// UPDATE CLIENT
clientController.updateClient = async (req, res) => {
  try {
    let {
      fullName,
      dui,
      phoneNumber,
      ClientAddress,
      email,
      userName,
      password,
    } = req.body;

    email = email?.trim();
    userName = userName?.trim();

    // La contraseña ya NO es obligatoria
    if (
      !fullName ||
      !dui ||
      !phoneNumber ||
      !ClientAddress ||
      !email ||
      !userName
    ) {
      return res.status(400).json({
        message: "Required fields",
      });
    }

    const clientFound = await clientModel.findById(req.params.id);

    if (!clientFound) {
      return res.status(404).json({
        message: "Client not found",
      });
    }

    const updatedData = {
      fullName,
      dui,
      phoneNumber,
      ClientAddress,
      email,
      userName,
    };

    // Solo actualizar la contraseña si viene una nueva
    if (password && password.trim() !== "") {
      updatedData.password = await bcryptjs.hash(password, 10);
    }

    // Si viene una nueva imagen
    if (req.file) {

      // Eliminar la imagen anterior
      if (clientFound.public_id) {
        await cloudinary.uploader.destroy(clientFound.public_id);
      }

      updatedData.image = req.file.path;
      updatedData.public_id = req.file.filename;
    }

    const updatedClient = await clientModel.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    return res.status(200).json({
      message: "Client updated successfully",
      client: updatedClient,
    });

  } catch (error) {
    console.log("error:", error);

    return res.status(500).json({
      message: "Internal Server Error update Client",
    });
  }
};

// DELETE CLIENT
clientController.deleteClient = async (req, res) => {
  try {

    const clientFound = await clientModel.findById(req.params.id);

    if (!clientFound) {
      return res.status(404).json({
        message: "Client not found",
      });
    }

    // Eliminar imagen de Cloudinary
    if (clientFound.public_id) {
      await cloudinary.uploader.destroy(clientFound.public_id);
    }

    await clientModel.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      message: "Client deleted successfully",
    });

  } catch (error) {
    console.log("error " + error);

    return res.status(500).json({
      message: "Internal Server Error delete Client",
    });
  }
};

// UPDATE PROFILE (self) — el cliente edita SUS datos básicos desde "Mi Cuenta".
// A diferencia de updateClient (admin, con imagen/multipart y todos los campos
// obligatorios), este acepta JSON y solo toca los campos que vengan.
clientController.updateClientProfile = async (req, res) => {
  try {
    const { fullName, userName, email, phoneNumber } = req.body;

    const updates = {};
    if (fullName !== undefined) updates.fullName = fullName;
    if (userName !== undefined) updates.userName = userName;
    if (email !== undefined) updates.email = email?.trim();
    if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber;

    const updated = await clientModel
      .findByIdAndUpdate(req.params.id, updates, { new: true })
      .select("-password");

    if (!updated) {
      return res.status(404).json({ message: "Client not found" });
    }

    return res.status(200).json({ message: "Perfil actualizado", client: updated });

  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({
      message: "Internal Server Error update profile",
    });
  }
};

// El cliente reemplaza su lista de direcciones de entrega (área "Mi Cuenta").
// clientAddress es un arreglo de strings; aquí lo sobrescribimos completo.
clientController.updateAddresses = async (req, res) => {
  try {
    const { addresses } = req.body;

    if (!Array.isArray(addresses)) {
      return res.status(400).json({ message: "addresses debe ser un arreglo" });
    }

    const updated = await clientModel
      .findByIdAndUpdate(req.params.id, { clientAddress: addresses }, { new: true })
      .select("-password");

    if (!updated) {
      return res.status(404).json({ message: "Client not found" });
    }

    return res.status(200).json({ message: "Direcciones actualizadas", client: updated });

  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({
      message: "Internal Server Error update addresses",
    });
  }
};

// El cliente reemplaza su lista de métodos de pago (datos no sensibles).
clientController.updatePaymentMethods = async (req, res) => {
  try {
    const { paymentMethods } = req.body;

    if (!Array.isArray(paymentMethods)) {
      return res.status(400).json({ message: "paymentMethods debe ser un arreglo" });
    }

    // Blindaje: guardamos SOLO campos no sensibles, aunque el front mande de más.
    const limpios = paymentMethods.map((m) => ({
      type: m.type || "tarjeta",
      alias: m.alias || "",
      last4: (m.last4 || "").toString().slice(-4),
    }));

    const updated = await clientModel
      .findByIdAndUpdate(req.params.id, { paymentMethods: limpios }, { new: true })
      .select("-password");

    if (!updated) {
      return res.status(404).json({ message: "Client not found" });
    }

    return res.status(200).json({ message: "Métodos de pago actualizados", client: updated });

  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({
      message: "Internal Server Error update payment methods",
    });
  }
};

// El cliente actualiza sus preferencias de notificación (interruptores).
clientController.updateNotifications = async (req, res) => {
  try {
    const { promociones, nuevosProductos, pedidoCerca } = req.body;

    // Usamos notación de punto para tocar solo la sub-preferencia que cambió.
    const prefs = {};
    if (promociones !== undefined) prefs["notificationPrefs.promociones"] = promociones;
    if (nuevosProductos !== undefined) prefs["notificationPrefs.nuevosProductos"] = nuevosProductos;
    if (pedidoCerca !== undefined) prefs["notificationPrefs.pedidoCerca"] = pedidoCerca;

    const updated = await clientModel
      .findByIdAndUpdate(req.params.id, { $set: prefs }, { new: true })
      .select("-password");

    if (!updated) {
      return res.status(404).json({ message: "Client not found" });
    }

    return res.status(200).json({ message: "Preferencias actualizadas", client: updated });

  } catch (error) {
    console.log("error " + error);
    return res.status(500).json({
      message: "Internal Server Error update notifications",
    });
  }
};

export default clientController;