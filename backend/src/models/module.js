import { Schema, model } from 'mongoose';

/*
Campos:
    name: String,
    description: String,
    isActive: Boolean (default: true),
*/

const moduleSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    // Boolean nativo (no String) con default true para activar módulos recién creados
    isActive: {
        type: Boolean,
        default: true
    }
},
{
    timestamps: true,
    strict: false
});

export default model('moduleModel', moduleSchema, "Modules");