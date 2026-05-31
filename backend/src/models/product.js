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