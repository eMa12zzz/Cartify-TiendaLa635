import { Schema, model } from 'mongoose';

const brandSchema = new Schema({

    name: {
        type: String,
        required: true
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

export default model('brandsModel', brandSchema, 'Brands');