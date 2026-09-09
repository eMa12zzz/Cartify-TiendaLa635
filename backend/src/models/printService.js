/**
 * @swagger
 * components:
 *   schemas:
 *     PrintService:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 68932f1a2b3c4d5e6f7a8bc0
 *         name:
 *           type: string
 *           example: Carta
 *         widthCm:
 *           type: number
 *           default: 21.6
 *         heightCm:
 *           type: number
 *           default: 27.9
 *         pricePerCopy:
 *           type: number
 *           example: 0.15
 *         allowsColor:
 *           type: boolean
 *           default: true
 *         colorSurcharge:
 *           type: number
 *           default: 0
 *         isActive:
 *           type: boolean
 *           default: true
 *       required:
 *         - name
 *         - pricePerCopy
 *     PrintServiceInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         widthCm:
 *           type: number
 *         heightCm:
 *           type: number
 *         pricePerCopy:
 *           type: number
 *         allowsColor:
 *           type: boolean
 *         colorSurcharge:
 *           type: number
 *         isActive:
 *           type: boolean
 *       required:
 *         - name
 *         - pricePerCopy
 */

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
   materialId:     en qué papel se imprime este formato. Es lo que permite
                   apagar el formato solo cuando ese papel se acaba, en vez de
                   dejar que el cliente pague y se entere en el mostrador.
                   Puede quedar vacío: un formato sin material declarado se
                   comporta como antes (siempre disponible), para no romper los
                   que ya estaban cargados.
   esBase:         formato de arranque (Carta, Oficio, DUI...) sembrado por
                   scripts/seedFormatosBaseImpresion.js, para que el panel no
                   empiece vacío. Solo separa la tabla del admin en "Formatos
                   base" y "Tus formatos" — no cambia en nada cómo se usan ni
                   se cobran. No se edita desde el formulario: nace así al
                   sembrarse y se queda así, aunque el admin edite el resto.
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
    materialId: { type: Schema.Types.ObjectId, ref: 'printMaterialModel', default: null },
    esBase: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default model('printServiceModel', printServiceSchema, 'PrintServices');
