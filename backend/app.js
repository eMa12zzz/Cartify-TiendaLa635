import express from "express";
import cors from "cors";
import adminRoutes from "./src/routes/Admin/admin.js";
import cookieParser from "cookie-parser";

const app = express();

app.use(
    cors({
        origin: ["http://localhost:5173", "http://localhost:5174"],
        credentials: true,
    })
);

app.use(cookieParser());

app.use(express.json());

app.use("/api/admin", adminRoutes);

export default app;