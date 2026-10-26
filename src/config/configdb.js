import mongoose from 'mongoose'
//se exporta una funcion que permitira conectar con la bd

export const connectDB = async () => {
    try {
        const dbURI = process.env.MONGODB_URI
        await mongoose.connect(dbURI)
        console.log('MongoDB conectado correctamente')
    } catch (error) {
        console.error('Error al conectar con MongoDB', error)
        process.exit(1)
    }
}

export const disconnectDB = async () => {
    try {
        await mongoose.disconnect()
        console.log('Base de datos MongoDB desconectada')
    } catch (error) {
        console.error('Error al desconectar desde MongoDB:', error)
    }
}
