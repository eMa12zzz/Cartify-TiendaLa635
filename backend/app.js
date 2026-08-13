//Alex
//bryan
import express from "express";
import cors from "cors";
import adminRoutes from "./src/routes/admin.js";
import cookieParser from "cookie-parser";
import employeeRoutes from "./src/routes/employee.js";
import supplierRoutes from "./src/routes/supplier.js";
import moduleRoutes from "./src/routes/module.js";
import productTypeRoutes from "./src/routes/productType.js";
import limiter from "./src/middlewares/limiter.js";
import brandRoutes from "./src/routes/brand.js";
import productRoutes from "./src/routes/product.js";
import registerClientRoutes from "./src/routes/registerClient.js";
import loginClientRoutes from "./src/routes/loginClient.js";
import logoutClientRoutes from "./src/routes/logoutClient.js";
import recoveryPasswordClientRoutes from "./src/routes/recoveryPasswordClient.js";
import clientRoutes from "./src/routes/client.js";
import promotionRoutes from "./src/routes/promotion.js";
import reviewRoutes from "./src/routes/review.js";
import shoppingRoutes from "./src/routes/shopping.js";
import orderRoutes from "./src/routes/order.js";
import loyaltyConfigRoutes from "./src/routes/loyaltyConfig.js";
import loyaltyRoutes from "./src/routes/loyalty.js";
import printServiceRoutes from "./src/routes/printService.js";
import printMaterialRoutes from "./src/routes/printMaterial.js";
import dashboardRoutes from "./src/routes/dashboard.js";
import aiRoutes from "./src/routes/ai.js";
import kioscoRoutes from "./src/routes/kiosco.js";
import giftCardRoutes from "./src/routes/giftCard.js";
import supplierCreditRoutes from "./src/routes/supplierCredit.js";
import wompiRoutes from "./src/routes/wompi.js"
import storeSettingsRoutes from "./src/routes/storeSettings.js";
import loginAdminRoutes from "./src/routes/loginAdmin.js";
import logoutAdminRoutes from "./src/routes/logoutAdmin.js";
import perfilRoutes from "./src/routes/perfil.js";

//cosas
const app = express();

app.use(
    cors({
        origin: ["http://localhost:5173", "http://localhost:5174"],
        credentials: true,
    })
);

app.use(limiter);

app.use(cookieParser());

app.use(express.json());
//endpoint

app.use("/api/admin", adminRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/supplier", supplierRoutes);
app.use("/api/module", moduleRoutes);
app.use("/api/productType", productTypeRoutes);
app.use("/api/brand", brandRoutes);
app.use("/api/product", productRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/registerClient", registerClientRoutes);
app.use("/api/loginClient", loginClientRoutes);
app.use("/api/logoutClient", logoutClientRoutes);
app.use("/api/recoveryPasswordClient", recoveryPasswordClientRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/promotion", promotionRoutes);
app.use("/api/shopping", shoppingRoutes);
app.use("/api/order", orderRoutes);
// Vincular la compra del kiosco con la cuenta del cliente por QR.
app.use("/api/kiosco", kioscoRoutes);
app.use("/api/loyaltyConfig", loyaltyConfigRoutes);
app.use("/api/loyalty", loyaltyRoutes);
app.use("/api/printService", printServiceRoutes);
// El papel y la tinta con que se imprime. Ver src/models/printMaterial.js.
app.use("/api/printMaterial", printMaterialRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/giftCard", giftCardRoutes);
app.use("/api/credito", supplierCreditRoutes);
// Cómo se ve la tienda: nombre, logo, orden de la portada y temporada.
app.use("/api/storeSettings", storeSettingsRoutes);
app.use("/api/wompi", wompiRoutes);
app.use("/api/loginAdmin", loginAdminRoutes);
app.use("/api/logoutAdmin", logoutAdminRoutes);
// Foto de perfil del personal conectado (admin o empleado).
app.use("/api/perfil", perfilRoutes);

//enpoint

/*
 * ── Manejador de errores ──
 * Sin esto, cualquier error lanzado en un middleware (típicamente la subida de
 * imágenes) devolvía la página HTML por defecto de Express con "[object Object]",
 * y el empleado solo veía "Internal Server Error" sin saber que el problema era
 * su foto. Va al final a propósito: Express reconoce como manejador de errores
 * la función que recibe cuatro argumentos, y solo entra aquí si algo falló.
 */
app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);

    console.log("error no controlado: " + (err?.message || err));

    // Archivo más pesado que el límite de multer.
    if (err?.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
            message: "La imagen pesa demasiado. Use una de menos de 8 MB.",
        });
    }

    // Formato que Cloudinary no acepta (típico: fotos HEIC del iPhone).
    const texto = String(err?.message || "");
    if (texto.includes("not allowed") || texto.includes("Invalid image") || texto.includes("format")) {
        return res.status(400).json({
            message: "Ese archivo no es una imagen válida. Use JPG, PNG o WEBP. " +
                     "Las fotos del iPhone suelen venir en HEIC: conviértalas antes de subirlas.",
        });
    }

    return res.status(500).json({ message: "Ocurrió un error inesperado en el servidor" });
});

export default app;

