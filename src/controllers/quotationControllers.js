import mongoose from 'mongoose'
import QuotationModel from '../models/QuotationModel.js'
import {
    createQuotationSchema,
    updateQuotationSchema,
} from '../schemas/quotationSchema.js'

// Función auxiliar para calcular ítems, subtotales y total
const calculateTotals = (items = [], tax = 0) => {
    const calculatedItems = items.map((item) => {
        const concept = item.concept || item.description || 'Sin concepto'
        const quantity = Number(item.quantity) >= 0 ? Number(item.quantity) : 1
        const unitPrice =
            Number(item.unitPrice ?? item.price ?? 0) >= 0
                ? Number(item.unitPrice ?? item.price ?? 0)
                : 0
        const subtotal = Number((quantity * unitPrice).toFixed(2))

        return {
            concept,
            quantity,
            unitPrice,
            subtotal,
        }
    })

    const subtotal = Number(
        calculatedItems.reduce((acc, curr) => acc + curr.subtotal, 0).toFixed(2)
    )
    const taxValue = Number(tax) >= 0 ? Number(Number(tax).toFixed(2)) : 0
    const total = Number((subtotal + taxValue).toFixed(2))

    return {
        items: calculatedItems,
        subtotal,
        tax: taxValue,
        total,
    }
}

// 1. POST /api/quotations - Crear una cotización
export const createQuotation = async (req, res) => {
    try {
        const validatedData = createQuotationSchema.parse(req.body)

        // Calcular automáticamente subtotales de cada concepto y el total
        const { items, subtotal, tax, total } = calculateTotals(
            validatedData.items,
            validatedData.tax
        )

        const newQuotation = await QuotationModel.create({
            userId: req.user.id,
            clientName: validatedData.clientName,
            description: validatedData.description || '',
            items,
            subtotal,
            tax,
            total,
            status: validatedData.status || 'pendiente',
            notes: validatedData.notes || '',
        })

        return res.status(201).json({
            message: 'Cotización creada exitosamente',
            quotation: newQuotation,
        })
    } catch (error) {
        console.error('Error al crear cotización:', error)

        if (error.issues && error.issues.length > 0) {
            return res.status(400).json({
                message: error.issues[0]?.message || 'Datos de cotización inválidos',
                errors: error.issues,
            })
        }

        return res.status(500).json({
            message: 'Error interno al crear la cotización',
            error: error.message,
        })
    }
}

// 2. GET /api/quotations - Listar las cotizaciones propias del usuario autenticado
export const getQuotations = async (req, res) => {
    try {
        const { search, status } = req.query
        const filter = { userId: req.user.id }

        // Búsqueda opcional por nombre del cliente o descripción
        if (search && search.trim() !== '') {
            const regex = new RegExp(search.trim(), 'i')
            filter.$or = [{ clientName: regex }, { description: regex }]
        }

        // Filtro opcional por estado
        if (status && status.trim() !== '') {
            filter.status = status.trim()
        }

        const quotations = await QuotationModel.find(filter).sort({
            createdAt: -1,
        })

        return res.status(200).json({
            total: quotations.length,
            quotations,
        })
    } catch (error) {
        console.error('Error al listar cotizaciones:', error)
        return res.status(500).json({
            message: 'Error al obtener las cotizaciones',
            error: error.message,
        })
    }
}

// 3. GET /api/quotations/:id - Consultar una cotización propia
export const getQuotationById = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'El identificador de cotización no es válido',
            })
        }

        const quotation = await QuotationModel.findOne({
            _id: id,
            userId: req.user.id,
        })

        if (!quotation) {
            return res.status(404).json({
                message: 'Cotización no encontrada',
            })
        }

        return res.status(200).json({
            quotation,
        })
    } catch (error) {
        console.error('Error al consultar cotización:', error)
        return res.status(500).json({
            message: 'Error al consultar la cotización',
            error: error.message,
        })
    }
}

// 4. PATCH /api/quotations/:id - Editar una cotización propia
export const updateQuotation = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'El identificador de cotización no es válido',
            })
        }

        const validatedData = updateQuotationSchema.parse(req.body)

        // Buscar cotización existente garantizando propiedad del usuario
        const existingQuotation = await QuotationModel.findOne({
            _id: id,
            userId: req.user.id,
        })

        if (!existingQuotation) {
            return res.status(404).json({
                message: 'Cotización no encontrada o no pertenece al usuario autenticado',
            })
        }

        // Si se actualizan ítems o impuestos, recalcular subtotales y total
        const itemsToCalculate =
            validatedData.items !== undefined
                ? validatedData.items
                : existingQuotation.items
        const taxToCalculate =
            validatedData.tax !== undefined ? validatedData.tax : existingQuotation.tax

        const { items, subtotal, tax, total } = calculateTotals(
            itemsToCalculate,
            taxToCalculate
        )

        // Actualizar campos
        if (validatedData.clientName !== undefined) {
            existingQuotation.clientName = validatedData.clientName
        }
        if (validatedData.description !== undefined) {
            existingQuotation.description = validatedData.description
        }
        if (validatedData.status !== undefined) {
            existingQuotation.status = validatedData.status
        }
        if (validatedData.notes !== undefined) {
            existingQuotation.notes = validatedData.notes
        }

        existingQuotation.items = items
        existingQuotation.subtotal = subtotal
        existingQuotation.tax = tax
        existingQuotation.total = total

        const updatedQuotation = await existingQuotation.save()

        return res.status(200).json({
            message: 'Cotización actualizada exitosamente',
            quotation: updatedQuotation,
        })
    } catch (error) {
        console.error('Error al actualizar cotización:', error)

        if (error.issues && error.issues.length > 0) {
            return res.status(400).json({
                message: error.issues[0]?.message || 'Datos de actualización inválidos',
                errors: error.issues,
            })
        }

        return res.status(500).json({
            message: 'Error al actualizar la cotización',
            error: error.message,
        })
    }
}

// 5. DELETE /api/quotations/:id - Eliminar una cotización propia
export const deleteQuotation = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'El identificador de cotización no es válido',
            })
        }

        const deletedQuotation = await QuotationModel.findOneAndDelete({
            _id: id,
            userId: req.user.id,
        })

        if (!deletedQuotation) {
            return res.status(404).json({
                message: 'Cotización no encontrada o ya eliminada',
            })
        }

        return res.status(200).json({
            message: 'Cotización eliminada exitosamente',
            id,
        })
    } catch (error) {
        console.error('Error al eliminar cotización:', error)
        return res.status(500).json({
            message: 'Error al eliminar la cotización',
            error: error.message,
        })
    }
}

