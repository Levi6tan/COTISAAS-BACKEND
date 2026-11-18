import express from 'express'
import {
    loginUser,
    logoutUser,
    profile,
    registerUser,
    forgotPassword,
    resetPassword,
} from '../controllers/authControllers.js'

const router = express.Router()

// Verificar si el usuario inició sesión
router.get('/profile', profile)
router.get('/me', profile)

// Autenticación básica
router.post('/login', loginUser)
router.post('/register', registerUser)
router.post('/logout', logoutUser)

// Recuperación de contraseña
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)

export default router
