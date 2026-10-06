import app from "./app.js";
import "./database.js";
import { registrarError } from "./src/utils/registroErrores.js";

/*
 * Lo que se escapa de todo: una promesa rechazada que nadie esperaba, o un
 * error fuera de cualquier petición. Se anota (ver utils/registroErrores.js).
 *
 * La promesa rechazada no tumba el servidor: se anota y se sigue atendiendo.
 * El error no atrapado sí lo deja caer, como siempre (Render lo levanta solo),
 * pero un segundo después, para que alcance a quedar anotado.
 */
process.on("unhandledRejection", (motivo) => {
  console.log("promesa rechazada sin atender: " + (motivo?.message || motivo));
  registrarError({
    origen: "servidor",
    mensaje: String(motivo?.message || motivo || "Promesa rechazada"),
    pila: String(motivo?.stack || ""),
    donde: "proceso",
  });
});

process.on("uncaughtException", (error) => {
  console.log("error no atrapado: " + (error?.message || error));
  registrarError({ origen: "servidor", mensaje: String(error?.message || error), pila: String(error?.stack || ""), donde: "proceso" })
    .finally(() => setTimeout(() => process.exit(1), 1000));
});

/*
 * EL PUERTO LO MANDA EL ENTORNO, no lo elegimos nosotros.
 *
 * Aquí había un 4000 clavado. Render —y cualquier servicio parecido— asigna el
 * puerto por la variable PORT y espera que la app escuche justo ahí. Con un
 * número fijo el proceso arranca igual, pero el servicio no encuentra ningún
 * puerto abierto donde busca y da el despliegue por fallido con un "No open
 * ports detected" que no dice qué hacer.
 *
 * En local no existe PORT, así que se queda con el 4000 de siempre y no cambia
 * nada de cómo se trabaja.
 */
const PUERTO = process.env.PORT || 4000;

// Creo una función que se encarga de ejecutar el servidor
async function main() {
  app.listen(PUERTO, () => console.log("server on port " + PUERTO));
}

main();
