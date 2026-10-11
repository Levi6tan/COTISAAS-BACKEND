import express from "express"
import authRoutes from "./routes/authRoutes.js"
import companyRoutes from "./routes/companyRoutes.js"
import dotenv from "dotenv" // trae las variables de entorno de .env
import {connectDB} from "./config/db.js"


dotenv.config()
const app = express()
const PORT = process.env.PORT || 3001

//midleware use() para procesar JSON en el req.body
app.use(express.json())
app.use("/api/auth", authRoutes)
app.use("/api/company", companyRoutes)

connectDB()
.then( ()=>{
    app.listen(PORT, ()=>{
    console.log(`servidor levantado en el puerto http://localhost:${PORT}`)
    })
})


