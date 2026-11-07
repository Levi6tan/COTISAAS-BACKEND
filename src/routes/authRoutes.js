import express from 'express'
import {
    loginUser,
    logoutUser,
    profile,
    registerUser,
} from '../controllers/authControllers.js'

const router = express.Router() // envia las rutas al server.js

// Endpoints [/api/auth/profile, /api/auth/login, /api/auth/register, /api/auth/logout]

// Verificar si el usuario inicio sesion
router.get('/profile', profile)
router.get('/me', profile)

// Iniciar sesion
router.post('/login', loginUser)

// Registrar un usuario
router.post('/register', registerUser)

// Cerrar sesion
router.post('/logout', logoutUser)

export default router
