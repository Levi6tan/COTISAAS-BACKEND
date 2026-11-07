import { z } from 'zod'

export const itemSchema = z.object({
    concept: z.string().trim().optional(),
    description: z.string().trim().optional(),
    quantity: z.coerce.number().min(0, 'La cantidad no puede ser negativa').default(1),
    unitPrice: z.coerce.number().min(0, 'El precio no puede ser negativo').default(0),
    price: z.coerce.number().min(0).optional(),
    subtotal: z.coerce.number().min(0).optional(),
})

export const createQuotationSchema = z.object({
    clientName: z
        .string({
            required_error: 'El nombre del cliente es obligatorio',
        })
        .trim()
        .min(2, 'El nombre del cliente debe tener al menos 2 caracteres'),
    description: z.string().trim().optional().default(''),
    items: z.array(itemSchema).optional().default([]),
    subtotal: z.coerce.number().min(0).optional(),
    tax: z.coerce.number().min(0).optional().default(0),
    total: z.coerce.number().min(0).optional(),
    status: z
        .enum(['borrador', 'pendiente', 'aprobada', 'rechazada'])
        .optional()
        .default('pendiente'),
    notes: z.string().trim().optional().default(''),
})

export const updateQuotationSchema = createQuotationSchema.partial()

