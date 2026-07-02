/*
Campos:
    name: String,
    description: String,
    isActive: Boolean,
 */

    import{ Schema, model } from 'mongoose';
    
    const moduleSchema = new Schema({
        name: { type:"String"},
        description: { type:"String"},
        isActive: { type:"Boolean"}
    },
    {
        timestamps: true,
        strict: false
    }
    );
    
    export default model('moduleModel', moduleSchema, "Modules");