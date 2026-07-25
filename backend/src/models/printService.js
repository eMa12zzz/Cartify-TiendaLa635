import { Schema, model } from 'mongoose';

/*
 Servicio de Impresión — un formato del catálogo de impresiones (módulo Impresiones).
   name:           ej. "Carta", "A4", "Póster", "DUI"
   widthCm/heightCm: medidas reales de la plantilla — la hoja del editor y el
                   archivo exportado se ajustan a esta proporción.
   pricePerCopy:   precio por copia
   allowsColor:    si se puede imprimir a color
   colorSurcharge: recargo por copia cuando es a color
   isActive:       si se ofrece en la tienda
*/
const printServiceSchema = new Schema(
  {
    name: { type: String, required: true },
    widthCm: { type: Number, default: 21.6 },   // Carta por defecto
    heightCm: { type: Number, default: 27.9 },
    pricePerCopy: { type: Number, required: true },
    allowsColor: { type: Boolean, default: true },
    colorSurcharge: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model('printServiceModel', printServiceSchema, 'PrintServices');
