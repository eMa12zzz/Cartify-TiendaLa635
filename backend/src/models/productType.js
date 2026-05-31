import { Schema, model } from 'mongoose';

const productTypeSchema = new Schema({

    type: {
        type: String,
        required: true
    },

    subtype: {
        type: [String],
        default: []
    },

    isActive: {
        type: Boolean,
        default: true
    }

},
{
    timestamps: true,
    strict: false
});

export default model('productTypeModel', productTypeSchema, 'ProductTypes');