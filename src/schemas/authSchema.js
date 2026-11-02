//validacion de datos usando la libreria zod
import { z } from 'zod'

export const registerSchema = z.object({
    username: z.string().min(15).max(75),
    email: z.email().min(6).max(254),
    password: z.string().min(6).max(254),
})
