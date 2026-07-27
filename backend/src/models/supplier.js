/*
Campos:
    name: String,
    phoneNumber: String,
    email: String,
    creditDays: String,
 */

import{ Schema, model } from 'mongoose';

const supplierSchema = new Schema({
    name: { type:"String"},
    phoneNumber: { type:"String"},
    email: { type:"String"},
    // Plazo que da el proveedor para pagar (en días). Viene como texto de datos
    // viejos, por eso se convierte con Number() antes de usarlo.
    creditDays: { type:"String"},
    /*
     * Techo de crédito que el proveedor le otorgó a la tienda. El crédito
     * DISPONIBLE no se guarda: se calcula restándole la deuda actual, que a su
     * vez sale de los movimientos. Guardar un "disponible" sería tener el mismo
     * dato en dos lugares, y tarde o temprano uno de los dos queda mal.
     */
    creditLimit: { type: Number, default: 0 },
},
{
    timestamps: true,
    strict: false
}
);

export default model('supplierModel', supplierSchema, "Suppliers");