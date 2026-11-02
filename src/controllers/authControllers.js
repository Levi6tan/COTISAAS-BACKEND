import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { registerSchema } from '../schemas/authSchema.js'
import UserModel from '../models/UserModel.js'

export const registerUser = async (req, res) => {
    try {
        //traer la clave secreta de JWT
        const JWT_SECRET = process.env.JWT_SECRET

        //Extraer los datos del usuario
        const { username, email, password } = registerSchema.parse(req.body)

        // Comprobar si ya existe el usuario
        const existingUser = await UserModel.findOne({ email })
        if (existingUser) {
            return res.status(400).json({ message: 'El usuario ya existe' })
        }

        // Encriptar la contraseña
        const hashedPassword = await bcrypt.hash(password, 10)

        // Comprobar el usuario admin
        const isFirsUser = (await UserModel.countDocuments()) === 0

        // crear el usuario y guardar en la DB
        const newUser = await UserModel.create({
            username,
            email,
            password: hashedPassword,
            isAdmin: isFirsUser,
        })

        // Generar unn token con JWT
        //objeto payload donde se guarda info
        const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, {
            expiresIn: '1h',
        })
        console.log('TOKEN:', token)
        // header .payload.signature
        //Enviar el token como una cookie hacia el frontend/navegador
        res.cookie('accessToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // true
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 60 * 60 * 1000,
        })
            .status(201)
            .json({ message: 'Usuario registrado con exito', newUser: newUser })

        console.log(newUser)
    } catch (error) {
        console.error('Error al registrarse', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}
