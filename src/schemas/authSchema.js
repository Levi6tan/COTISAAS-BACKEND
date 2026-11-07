// validacion de datos usando la libreria zod
import { z } from 'zod'

export const registerSchema = z.object({
    username: z.string().trim().min(15).max(75),
    email: z.string().email().min(6).max(254),
    password: z.string().min(6).max(254),
})

export const loginSchema = z
    .object({
        email: z.string().email().min(6).max(254).optional(),
        username: z.string().trim().min(3).max(75).optional(),
        password: z.string().min(6).max(254),
    })
    .refine((data) => data.email || data.username, {
        message: 'Debes enviar un email o un username',
        path: ['email'],
    })
