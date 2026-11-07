import mongoose from 'mongoose'

// Eventos de conexión para evitar que un fallo de red tumbe el proceso
mongoose.connection.on('error', (error) => {
    console.error('Error en la conexión con MongoDB:', error)
})

mongoose.connection.on('disconnected', () => {
    console.warn('Conexión con MongoDB desconectada')
})

export const connectDB = async () => {
    try {
        const dbURI = process.env.MONGODB_URI
        await mongoose.connect(dbURI)
        console.log('MongoDB conectado correctamente')
    } catch (error) {
        console.error('Error al conectar con MongoDB:', error.message)
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
