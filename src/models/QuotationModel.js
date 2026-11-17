import mongoose from 'mongoose'

const itemSchema = new mongoose.Schema(
    {
        concept: {
            type: String,
            required: [true, 'La descripción o concepto es obligatorio'],
            trim: true,
        },
        unit: {
            type: String,
            enum: ['Und', 'Mts', 'Glb', 'Servicio', 'Hora'],
            default: 'Und',
        },
        quantity: {
            type: Number,
            required: [true, 'La cantidad es obligatoria'],
            min: [0, 'La cantidad no puede ser negativa'],
            default: 1,
        },
        unitPrice: {
            type: Number,
            required: [true, 'El valor unitario es obligatorio'],
            min: [0, 'El valor unitario no puede ser negativo'],
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
        quoteNumber: {
            type: String,
            required: [true, 'El consecutivo de cotización es obligatorio'],
            trim: true,
            index: true,
        },
        quoterName: {
            type: String,
            trim: true,
            default: '',
        },
        quoterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        clientName: {
            type: String,
            required: [true, 'El nombre o razón social del cliente es obligatorio'],
            trim: true,
        },
        clientDocumentType: {
            type: String,
            enum: ['NIT', 'CC', 'CE'],
            default: 'NIT',
        },
        clientDocument: {
            type: String,
            trim: true,
            default: '',
        },
        clientPhone: {
            type: String,
            trim: true,
            default: '',
        },
        clientEmail: {
            type: String,
            trim: true,
            lowercase: true,
            default: '',
        },
        issueDate: {
            type: Date,
            default: Date.now,
        },
        validUntil: {
            type: Date,
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
        discount: {
            type: Number,
            default: 0,
            min: 0,
        },
        applyIva: {
            type: Boolean,
            default: false,
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
        paymentTerms: {
            type: String,
            trim: true,
            default: '50% Anticipo - 50% Contra entrega',
        },
        deliveryTime: {
            type: String,
            trim: true,
            default: '3 a 5 días hábiles',
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
