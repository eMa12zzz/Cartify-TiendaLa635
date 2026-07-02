import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';

/*
Campos:
    fullName: String,
    dui: String,
    phoneNumber: String,
    image: String,
    email: String,
    userName: String,
    password: String,
    role: String,
    isActive: Boolean,
*/

const employeeSchema = new Schema({
    fullName: { type: String, required: true },
    dui: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    image: { type: String },
    public_id: { type: String },
    email: { type: String, required: true, unique: true },
    userName: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['Vendedor', 'Cajero', 'Gerente', 'Admin'], default: 'Vendedor' },
    isActive: { type: Boolean, default: true }
},
{
    timestamps: true,
    strict: false
});

// Middleware para encriptar la contraseña antes de guardar
employeeSchema.pre('save', async function(next) {
    // Solo hashear la contraseña si ha sido modificada (o es nueva)
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Método para comparar contraseñas (útil para el login)
employeeSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

export default model('employeeModel', employeeSchema, "Employees");