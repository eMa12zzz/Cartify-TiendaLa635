import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Cartify - TiendaLa635 API",
      version: "1.0.0",
      description:
        "Documentación de la API REST de Cartify. Incluye gestión de productos, marcas, proveedores, empleados, clientes, promociones, pedidos, fidelidad e impresión.",
    },
    servers: [
      {
        url: "http://localhost:4000/api",
        description: "Servidor local de desarrollo",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
          description: "Autenticación por cookie httpOnly (JWT) emitida en el login.",
        },
      },
    },
  },
  // Rutas donde swagger-jsdoc buscará los comentarios @swagger (paths y schemas)
  apis: ["./src/routes/*.js", "./src/models/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
