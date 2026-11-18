import express from 'express'
import {
    createQuotation,
    getQuotations,
    getQuotationById,
    updateQuotation,
    deleteQuotation,
    sendQuotationEmailController,
} from '../controllers/quotationControllers.js'
import { verifyAuth } from '../middleware/authMiddleware.js'

const router = express.Router()

// Todas las rutas de cotizaciones requieren que el usuario esté autenticado mediante JWT
router.use(verifyAuth)

// Endpoints CRUD del Módulo 2
// POST   /api/quotations               - Crear una cotización
router.post('/', createQuotation)

// GET    /api/quotations               - Listar las cotizaciones propias del usuario
router.get('/', getQuotations)

// GET    /api/quotations/:id           - Consultar una cotización propia específica
router.get('/:id', getQuotationById)

// PATCH  /api/quotations/:id           - Editar una cotización propia (actualización parcial)
router.patch('/:id', updateQuotation)

// PUT    /api/quotations/:id           - Editar una cotización propia (soporte completo)
router.put('/:id', updateQuotation)

// DELETE /api/quotations/:id           - Eliminar una cotización propia
router.delete('/:id', deleteQuotation)

// POST   /api/quotations/:id/send-email - Enviar cotización por correo con PDF adjunto
router.post('/:id/send-email', sendQuotationEmailController)

export default router
