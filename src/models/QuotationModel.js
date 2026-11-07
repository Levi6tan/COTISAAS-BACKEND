import mongoose from 'mongoose'

const itemSchema = new mongoose.Schema(
    {
        concept: {
            type: String,
            required: [true, 'El concepto es obligatorio'],
            trim: true,
        },
        quantity: {
            type: Number,
            required: [true, 'La cantidad es obligatoria'],
            min: [0, 'La cantidad no puede ser negativa'],
            default: 1,
        },
        unitPrice: {
            type: Number,
            required: [true, 'El precio unitario es obligatorio'],
            min: [0, 'El precio no puede ser negativo'],
            default: 0,
        },
        subtotal: {
            type: Number,
            default: 0,
            min: [0, 'El subtotal no puede ser negativo'],
        },
    },
    { _id: false }
)

const quotationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'El ID del usuario creador es obligatorio'],
            index: true,
        },
        clientName: {
            type: String,
            required: [true, 'El nombre del cliente es obligatorio'],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: '',
        },
        items: {
            type: [itemSchema],
            default: [],
        },
        subtotal: {
            type: Number,
            default: 0,
            min: 0,
        },
        tax: {
            type: Number,
            default: 0,
            min: 0,
        },
        total: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        status: {
            type: String,
            enum: {
                values: ['borrador', 'pendiente', 'aprobada', 'rechazada'],
                message: '{VALUE} no es un estado válido',
            },
            default: 'pendiente',
        },
        notes: {
            type: String,
            trim: true,
            default: '',
        },
    },
    { timestamps: true }
)

const QuotationModel =
    mongoose.models.Quotation || mongoose.model('Quotation', quotationSchema)

export default QuotationModel

