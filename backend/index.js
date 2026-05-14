import app from "./app.js";
import "./database.js";

//Creo una función
// que se encarga de ejecutar el servidor
async function main() {
  app.listen(4000);
  console.log("server on port 4000");
}

main();
