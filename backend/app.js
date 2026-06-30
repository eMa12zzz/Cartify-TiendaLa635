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

export default app;