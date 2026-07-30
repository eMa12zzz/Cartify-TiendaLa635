/*
Campos:
    name: String,
    image: Array,
    typeId: objectId,
    brandId: objectId,
    expirationDate: Date,
    priceCost: Number,
    salePrice: Number,
    description: String,
    barCode: String,
    stock: Number,
    moduleId: objectId,
    supplierId: objectId,
    isActive: Boolean,

    Campos que no están declarados en el schema (entran por strict:false) pero
    que sí se usan y se guardan:
    familia: String,        clave del estante al que pertenece el producto
                            ("quesos", "bebidas-energizantes"...). La lista
                            cerrada de claves está en src/utils/familias.js.
                            Con ella la tienda arma sus filas temáticas solas.
    familiaOrigen: String,  quién decidió esa familia: 'ia' cuando la resolvió
                            el clasificador de /api/ai/clasificar. Sirve para
                            saber qué se puede revisar o borrar si algún día
                            una clasificación quedó mal.
*/

import{ Schema, model } from 'mongoose';

const productSchema = new Schema({
    name: { type:"String"},
    image: { type:["String"]},
    typeId: { type: Schema.Types.ObjectId, ref: "productTypeModel"},
    brandId: { type: Schema.Types.ObjectId, ref: "brandsModel"},
    expirationDate: { type: Date},
    priceCost: { type: Number},
    salePrice: { type: Number},
    description: { type:"String"},
    barCode: { type:"String"},
    stock: { type: Number},
    moduleId: { type: Schema.Types.ObjectId, ref: "moduleModel"},
    supplierId: { type: Schema.Types.ObjectId, ref: "supplierModel"},
    isActive: { type: Boolean, default: true}
},
{
    timestamps: true,
    strict: false
});

export default model('productModel', productSchema, "Products");