import express from 'express'
import UserModel from '../models/UserModel.js'
import { registerUser } from '../controllers/authControllers.js'
const router = express.Router() //envia las rutas al server.js

// Enpoints [/api/auth/me, /api/auth/login, /api/auth/register]

// HTTP Request Methods| GET and POST

// GET|Solicitar o obtener un recurso

// Verficar si el usuario inicio sesion
router.get('/profile', (req, res) => {
    console.log('Vista del perfil')
    res.send('Petición GET exitosa a /api/auth/me')
})

// POST|Crear un recurso, como json pero se debe pasar a un objeto de js

// Iniciar sesion
router.post('/login', async (req, res) => {
    try {
        const { user, password } = req.body
        const usuario = await User.findOne()
        const savedUsuario = await usuario.save()

        if (savedUsuario) {
            res.status(201).json({
                message: 'Inicio de sesion exitoso',
                usuario: savedUsuario,
            })
        }
    } catch (error) {
        console.error('Error al inciar sesion', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

// Registra un usuario
router.post('/register', registerUser)

// Desloguear el usuario
router.post('/logout', (req, res) => {
    const { name, email, user, password } = req.body
    console.log(req.body)
    console.log(name, user, email, password)

    res.status(201).json({
        mensaje: 'Usuario registrado con éxito en el backend',
        usuario: { name, email, user },
    })
})

export default router
