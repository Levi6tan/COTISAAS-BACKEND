import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/authRoutes.js'
import quotationsRoutes from './routes/quotationsRoutes.js'
import { connectDB, disconnectDB } from './config/configdb.js'

// Prevenir caídas no deseadas del proceso Node
process.on('uncaughtException', (err) => {
    console.error('Error no capturado (uncaughtException):', err)
})
process.on('unhandledRejection', (reason) => {
    console.error('Promesa rechazada no controlada (unhandledRejection):', reason)
})

// Permite cargar el .env correctamente sin importar desde qué carpeta se ejecute node
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const app = express()
const PORT = process.env.PORT || 3000

// Configuración CORS
app.use(
    cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true, // Permite que viaje la cookie hacia el backend
    })
)

app.use(cookieParser()) // recibir las cookies desde el frontend

// middleware para procesar JSON en el req.body
app.use(express.json())

// Logger simple para ver peticiones en consola
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`)
    next()
})

// Rutas API
app.use('/api/auth', authRoutes)
app.use('/api/company', quotationsRoutes)

// Manejador centralizado de errores para Express
app.use((err, req, res, next) => {
    console.error('Error interno en Express:', err)
    if (!res.headersSent) {
        res.status(500).json({
            message: 'Error interno en el servidor',
            error: err.message,
        })
    }
})

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(
                `Servidor levantado en el puerto http://localhost:${PORT}`
            )
        })
    })
    .catch(() => {
        disconnectDB()
    })
