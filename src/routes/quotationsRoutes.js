import express from 'express'
import company from '../models/Company.js'

const router = express.Router()

// Consulta la información de la empresa vinculada al usuario logueado
router.get('/', async (req, res) => {
    try {
        res.status(200).json({
            message: 'Información de empresa obtenida con éxito',
        })
    } catch (error) {
        console.error('Error al consultar empresa:', error)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
})

// Registro de la empresa
router.post('/', async (req, res) => {
    try {
        const { companyName, nit, phone, terms } = req.body
        console.log('Datos de empresa recibidos:', { companyName, nit, phone, terms })

        res.status(200).json({
            message: 'Empresa registrada con éxito en el backend',
        })
    } catch (error) {
        console.error('Error al registrar empresa:', error)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
})

// Actualizar datos de la empresa
router.put('/', async (req, res) => {
    try {
        const { companyName, nit, phone, terms } = req.body
        console.log('Actualización de empresa:', { companyName, nit, phone, terms })

        res.status(200).json({
            message: 'Datos actualizados correctamente',
        })
    } catch (error) {
        console.error('Error al actualizar empresa:', error)
        res.status(500).json({ error: 'Error interno del servidor' })
    }
})

export default router
