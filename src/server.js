import express from 'express'
import authRoutes from './routes/authRoutes.js'
import quatationsRoutes from './routes/quotationsRoutes.js'
import dotenv from 'dotenv' // sirve para poder leer las variables de entorno de .env
import { connectDB, disconnectDB } from './config/configdb.js'

dotenv.config()
const app = express()
const PORT = process.env.PORT || 3001

//midleware use() para procesar JSON en el req.body
app.use(express.json())
app.use('/api/auth', authRoutes)
app.use('/api/company', quatationsRoutes)

connectDB()
    .then(() => {
        //.then para capturar la promesa de connectDB()
        app.listen(PORT, () => {
            console.log(
                `servidor levantado en el puerto http://localhost:${PORT}`
            )
        })
    })
    .catch(() => {
        disconnectDB()
    })
