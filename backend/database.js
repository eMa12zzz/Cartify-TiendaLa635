import dotenv from 'dotenv';
dotenv.config(); // Forzamos la lectura del .env justo en este instante
import mongoose from "mongoose";

console.log("Conectando a la base...");

mongoose.connect(process.env.DB_URI, {
    family: 4
});

const connection = mongoose.connection;

connection.once("open", () => {
    console.log("DB is connected");
});

connection.on("disconnected", (error) => {
    console.log("DB is disconnected " + error);
});

connection.on("error", (error) => {
    console.log("error found " + error);
});