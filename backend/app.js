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
import promotionRoutes from "./src/routes/promotion.js";
import shoppingRoutes from "./src/routes/shopping.js";
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
app.use("/api/promotion", promotionRoutes);
app.use("/api/shopping", shoppingRoutes);
//enpoint


export default app;