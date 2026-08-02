import { Schema, model } from 'mongoose';

/*
 * ============================================================
 * MATERIAL DE IMPRESIÓN — printMaterial.js
 * ============================================================
 * El papel y la tinta con los que se imprime. Es lo que hacía falta para
 * cerrar el hueco más caro del módulo: hasta ahora el cliente elegía "papel
 * fotográfico a color", pagaba, y recién en el mostrador se enteraba de que no
 * había. El sistema no tenía forma de saberlo porque nadie le había contado
 * qué materiales existen.
 *
 * Por qué vive APARTE del inventario de productos: un pliego de papel bond no
 * se vende, se gasta. No tiene precio de venta, ni marca, ni promoción, ni va
 * en el carrito de nadie. Meterlo entre los abarrotes obligaría a llenar media
 * ficha de producto con campos que no significan nada aquí, y lo peor: saldría
 * en la tienda a la par de los quesos.
 *
 *   tipo         'papel' → hojas, pliegos, cartulina
 *                'tinta' → tóner o cartucho
 *   esColor      solo importa en la tinta: separa el tóner de color del negro,
 *                que es lo que decide si el formato puede ofrecer color.
 *   existencia   cuánto queda, en la unidad que diga `unidad`
 *   minimo       a partir de aquí se avisa que va quedando poco. No bloquea
 *                nada: avisar y bloquear son cosas distintas.
 * ============================================================
 */
const printMaterialSchema = new Schema(
  {
    name: { type: String, required: true },
    tipo: { type: String, enum: ['papel', 'tinta'], default: 'papel' },
    // Solo se lee cuando tipo === 'tinta'. En el papel se ignora.
    esColor: { type: Boolean, default: false },
    existencia: { type: Number, default: 0 },
    minimo: { type: Number, default: 0 },
    // Cómo se cuenta: "hojas", "pliegos", "cartuchos". Es solo para mostrar.
    unidad: { type: String, default: 'hojas' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model('printMaterialModel', printMaterialSchema, 'PrintMaterials');
