import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { loginSchema, registerSchema } from '../schemas/authSchema.js'
import UserModel from '../models/UserModel.js'

export const loginUser = async (req, res) => {
    try {
        const JWT_SECRET = process.env.JWT_SECRET || 'secret'
        const { email, username, password } = loginSchema.parse(req.body)

        const user = await UserModel.findOne({
            $or: [{ email: email ?? '' }, { username: username ?? '' }],
        })

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Credenciales inválidas' })
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
            expiresIn: '7d',
        })

        res.cookie('accessToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })
            .status(200)
            .json({
                message: 'Inicio de sesión exitoso',
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    isAdmin: user.isAdmin,
                },
            })
    } catch (error) {
        console.error('Error al iniciar sesión:', error)
        if (error.issues) {
            return res.status(400).json({
                message: error.issues[0]?.message || 'Datos de inicio de sesión inválidos',
            })
        }
        return res.status(400).json({
            message: 'Datos incorrectos o faltantes',
        })
    }
}

export const registerUser = async (req, res) => {
    try {
        console.log('--- Petición de registro recibida ---')
        console.log('Body:', { ...req.body, password: '***' })

        // Traer la clave secreta de JWT
        const JWT_SECRET = process.env.JWT_SECRET || 'miClaveSecreta_0987'

        // Extraer y validar los datos del usuario
        const { username, email, password } = registerSchema.parse(req.body)

        // Comprobar si ya existe el usuario por email
        const existingUser = await UserModel.findOne({ email })
        if (existingUser) {
            return res.status(400).json({ message: 'El usuario ya existe con este correo' })
        }

        // Encriptar la contraseña
        const hashedPassword = await bcrypt.hash(password, 10)

        // Comprobar si es el primer usuario (será admin)
        const isFirstUser = (await UserModel.countDocuments()) === 0

        // Crear el usuario y guardar en la base de datos
        const newUser = await UserModel.create({
            username,
            email,
            password: hashedPassword,
            isAdmin: isFirstUser,
        })

        // Generar token JWT
        const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, {
            expiresIn: '7d',
        })

        // Enviar cookie y respuesta de éxito
        res.cookie('accessToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })
            .status(201)
            .json({
                message: 'Usuario registrado con éxito',
                token,
                newUser: {
                    id: newUser._id,
                    username: newUser.username,
                    email: newUser.email,
                    isAdmin: newUser.isAdmin,
                },
            })
    } catch (error) {
        console.error('Error al registrar usuario:', error)

        // Error de validación Zod
        if (error.issues && error.issues.length > 0) {
            const firstError = error.issues[0]
            return res.status(400).json({
                message: `${firstError.path.join('.')}: ${firstError.message}`,
            })
        }

        // Error de clave duplicada en Mongo (código 11000)
        if (error.code === 11000) {
            return res.status(400).json({
                message: 'Ya existe un usuario con esos datos registrados',
            })
        }

        // Error de validación de Mongoose
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: error.message,
            })
        }

        // Error de timeout / conexión con MongoDB
        if (error.name === 'MongooseError') {
            return res.status(503).json({
                message: 'Error al conectar con la base de datos',
            })
        }

        return res.status(400).json({
            message: error.message || 'Los datos enviados no son válidos',
        })
    }
}

export const profile = async (req, res) => {
    const token = req.cookies?.accessToken
    if (!token) {
        return res.status(200).json(null)
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'miClaveSecreta_0987')
        const user = await UserModel.findById(decoded.userId)

        if (!user) {
            return res.status(200).json(null)
        }

        res.status(200).json({
            id: user._id,
            email: user.email,
            isAdmin: user.isAdmin,
            username: user.username,
        })
    } catch {
        return res.status(200).json(null)
    }
}

export const logoutUser = (req, res) => {
    res.clearCookie('accessToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    })
        .status(200)
        .json({ message: 'Sesión cerrada exitosamente' })
}
