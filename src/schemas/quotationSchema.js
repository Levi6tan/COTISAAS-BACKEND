import { z } from 'zod'

export const itemSchema = z.object({
    concept: z.string().trim().optional(),
    description: z.string().trim().optional(),
    unit: z
        .enum(['Und', 'Mts', 'Glb', 'Servicio', 'Hora'])
        .optional()
        .default('Und'),
    quantity: z.coerce
        .number()
        .min(0, 'La cantidad no puede ser negativa')
        .default(1),
    unitPrice: z.coerce
        .number()
        .min(0, 'El valor unitario no puede ser negativo')
        .default(0),
    price: z.coerce.number().min(0).optional(),
    subtotal: z.coerce.number().min(0).optional(),
})

export const createQuotationSchema = z.object({
    quoteNumber: z.string().trim().optional(),
    quoterName: z.string().trim().optional(),
    clientName: z
        .string({
            required_error: 'El nombre del cliente es obligatorio',
        })
        .trim()
        .min(2, 'El nombre del cliente debe tener al menos 2 caracteres'),
    clientDocumentType: z.enum(['NIT', 'CC', 'CE']).optional().default('NIT'),
    clientDocument: z.string().trim().optional().default(''),
    clientPhone: z.string().trim().optional().default(''),
    clientEmail: z
        .string()
        .trim()
        .optional()
        .or(z.literal(''))
        .default(''),
    issueDate: z.coerce.date().optional(),
    validUntil: z.coerce.date().optional(),
    description: z.string().trim().optional().default(''),
    items: z.array(itemSchema).optional().default([]),
    subtotal: z.coerce.number().min(0).optional(),
    discount: z.coerce.number().min(0).optional().default(0),
    applyIva: z.coerce.boolean().optional().default(false),
    tax: z.coerce.number().min(0).optional().default(0),
    total: z.coerce.number().min(0).optional(),
    paymentTerms: z
        .string()
        .trim()
        .optional()
        .default('50% Anticipo - 50% Contra entrega'),
    deliveryTime: z.string().trim().optional().default('3 a 5 días hábiles'),
    status: z
        .enum(['borrador', 'pendiente', 'aprobada', 'rechazada'])
        .optional()
        .default('pendiente'),
    notes: z.string().trim().optional().default(''),
})

// Esquema de actualización parcial sin valores por defecto: con
// createQuotationSchema.partial() los .default() se siguen aplicando y un
// PATCH que solo envía { status } borraría items, descuento, IVA, etc.
export const updateQuotationSchema = z
    .object({
        quoteNumber: z.string().trim(),
        quoterName: z.string().trim(),
        clientName: z
            .string()
            .trim()
            .min(2, 'El nombre del cliente debe tener al menos 2 caracteres'),
        clientDocumentType: z.enum(['NIT', 'CC', 'CE']),
        clientDocument: z.string().trim(),
        clientPhone: z.string().trim(),
        clientEmail: z.string().trim().or(z.literal('')),
        issueDate: z.coerce.date(),
        validUntil: z.coerce.date(),
        description: z.string().trim(),
        items: z.array(itemSchema),
        subtotal: z.coerce.number().min(0),
        discount: z.coerce.number().min(0),
        applyIva: z.coerce.boolean(),
        tax: z.coerce.number().min(0),
        total: z.coerce.number().min(0),
        paymentTerms: z.string().trim(),
        deliveryTime: z.string().trim(),
        status: z.enum(['borrador', 'pendiente', 'aprobada', 'rechazada']),
        notes: z.string().trim(),
    })
    .partial()
