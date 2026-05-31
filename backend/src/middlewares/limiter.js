import rateLimit from "express-rate-limit";

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto    max: 6, //máximo de solicitudes HTTP
    message: {
        status: 429,
        error: "Too many request"
    }
})

export default limiter