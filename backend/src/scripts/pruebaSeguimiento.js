/*
 * Prueba del seguimiento en vivo, sin tener que salir a la calle.
 *
 * Crea un pedido a domicilio CON punto en el mapa (los que hay en la base
 * traen solo la dirección escrita, y sin coordenadas no hay nada que seguir)
 * y después simula al repartidor saliendo de la tienda hacia esa casa.
 *
 * El pedido se inserta directo con mongoose y no por el controller a
 * propósito: así no descuenta stock real ni reparte puntos de fidelidad.
 *
 * Cómo correrlo, desde backend/:
 *   node src/scripts/pruebaSeguimiento.js crear [correo]  -> crea el pedido
 *   node src/scripts/pruebaSeguimiento.js simular         -> mueve el puntito 3 min
 *   node src/scripts/pruebaSeguimiento.js borrar          -> limpia lo que creó
 *
 * El correo es opcional: sirve para que el pedido quede a nombre de la cuenta
 * con la que va a entrar a la tienda, y así le salga a usted la burbuja de
 * seguimiento. Sin correo, agarra el primer cliente que encuentre.
 */
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";

import orderModel from "../models/order.js";
import clientModel from "../models/client.js";

// Marca para reconocer lo que crea este script y poder borrarlo después.
const MARCA = "PRUEBA-SEGUIMIENTO";

// La tienda: Colonia Providencia, Calle Sevilla 635. De aquí sale el reparto.
const TIENDA = { lat: 13.68514, lng: -89.19836 };
// La casa del pedido, como a kilómetro y medio.
const CASA = { lat: 13.69350, lng: -89.20950 };

const PASOS = 18;          // cuántas posiciones manda en el trayecto
const ESPERA_MS = 10000;   // cada cuánto, igual que el teléfono de verdad

const api = "http://localhost:4000/api/order";

const crear = async (correo) => {
  const cliente = correo
    ? await clientModel.findOne({ email: correo })
    : await clientModel.findOne({ isActive: true });

  if (!cliente) {
    console.log(correo
      ? `No hay ningún cliente con el correo ${correo}.`
      : "No hay clientes en la base; cree uno primero.");
    return;
  }

  // Un solo pedido de prueba a la vez: si ya había uno, se reemplaza en vez
  // de ir dejando pedidos fantasma acumulados en la base.
  await orderModel.deleteMany({ deliveryReference: MARCA });

  const pedido = await orderModel.create({
    clientId: cliente._id,
    items: [{ name: "Pedido de prueba", price: 3.5, amount: 2 }],
    subtotal: 7,
    total: 7,
    status: "preparando",
    paymentMethod: "efectivo",
    deliveryType: "delivery",
    deliveryAddress: "Colonia Escalón, Calle de prueba #100",
    deliveryReference: MARCA,
    deliveryLat: CASA.lat,
    deliveryLng: CASA.lng,
    preparedAt: new Date(),
    preparedBy: "Prueba",
    pointsEarned: 0,
  });

  console.log("Pedido de prueba creado.");
  console.log("  id:      ", String(pedido._id));
  console.log("  cliente: ", cliente.fullName, "-", cliente.email);
  console.log("  destino: ", CASA.lat, CASA.lng);
};

/*
 * El repartidor saliendo de la tienda. Va en línea recta porque lo que se
 * está probando es el seguimiento, no la ruta: al cliente le llega la misma
 * información que le llegaría de un teléfono real.
 */
const simular = async () => {
  const pedido = await orderModel.findOne({ deliveryReference: MARCA });
  if (!pedido) {
    console.log("No hay pedido de prueba. Corra primero: node src/scripts/pruebaSeguimiento.js crear");
    return;
  }

  console.log("Saliendo de la tienda hacia la casa...");

  for (let i = 0; i <= PASOS; i++) {
    const avance = i / PASOS;
    const lat = TIENDA.lat + (CASA.lat - TIENDA.lat) * avance;
    const lng = TIENDA.lng + (CASA.lng - TIENDA.lng) * avance;

    /*
     * Si un envío se cae, se sigue con el siguiente. Un teléfono en la calle
     * pierde señal todo el tiempo y el seguimiento tiene que aguantarlo: si
     * el script reventara aquí estaría probando algo más fácil que la
     * realidad.
     */
    let estado;
    try {
      const r = await fetch(`${api}/${pedido._id}/courier`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng, quien: "Repartidor de prueba" }),
      });
      estado = r.status;
    } catch {
      estado = "sin señal";
    }

    console.log(`  ${i}/${PASOS} → ${lat.toFixed(5)}, ${lng.toFixed(5)}  (${estado})`);
    if (i < PASOS) await new Promise((res) => setTimeout(res, ESPERA_MS));
  }

  console.log("Llegó. El puntito queda encendido hasta que se marque entregado.");
};

const borrar = async () => {
  const r = await orderModel.deleteMany({ deliveryReference: MARCA });
  console.log("Pedidos de prueba borrados:", r.deletedCount);
};

const run = async () => {
  await mongoose.connect(process.env.DB_URI, { family: 4 });

  const que = process.argv[2] || "crear";
  if (que === "crear") await crear(process.argv[3]);
  else if (que === "simular") await simular();
  else if (que === "borrar") await borrar();
  else console.log("Use: crear | simular | borrar");

  await mongoose.disconnect();
};

run();
