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
import shoppingRoutes from "./src/routes/shopping.js";
import orderRoutes from "./src/routes/order.js";
import loyaltyConfigRoutes from "./src/routes/loyaltyConfig.js";
import loyaltyRoutes from "./src/routes/loyalty.js";
import printServiceRoutes from "./src/routes/printService.js";
import dashboardRoutes from "./src/routes/dashboard.js";
import aiRoutes from "./src/routes/ai.js";
import giftCardRoutes from "./src/routes/giftCard.js";
import supplierCreditRoutes from "./src/routes/supplierCredit.js";
import wompiRoutes from "./src/routes/wompi.js"
import loginAdminRoutes from "./src/routes/loginAdmin.js";
import logoutAdminRoutes from "./src/routes/logoutAdmin.js";

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
app.use("/api/registerClient", registerClientRoutes);
app.use("/api/loginClient", loginClientRoutes);
app.use("/api/logoutClient", logoutClientRoutes);
app.use("/api/recoveryPasswordClient", recoveryPasswordClientRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/promotion", promotionRoutes);
app.use("/api/shopping", shoppingRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/loyaltyConfig", loyaltyConfigRoutes);
app.use("/api/loyalty", loyaltyRoutes);
app.use("/api/printService", printServiceRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/giftCard", giftCardRoutes);
app.use("/api/credito", supplierCreditRoutes);
app.use("/api/wompi", wompiRoutes);
app.use("/api/loginAdmin", loginAdminRoutes);
app.use("/api/logoutAdmin", logoutAdminRoutes);

//enpoint


export default app;