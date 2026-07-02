import mongoose, { Schema, model } from 'mongoose';

const productTypeSchema = new Schema({
    
    moduleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Module", 
        required: true,
      
    },
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