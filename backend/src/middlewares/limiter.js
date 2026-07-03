import rateLimit from "express-rate-limit";

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 200, // máximo de solicitudes HTTP
    message: {
        status: 429,
        error: "Too many requests"
    }
});

export default limiter