import mongoose from 'mongoose'
import QuotationModel from '../models/QuotationModel.js'
import UserModel from '../models/UserModel.js'
import {
    createQuotationSchema,
    updateQuotationSchema,
} from '../schemas/quotationSchema.js'
import { generateQuotationPDF } from '../services/pdfService.js'
import { sendQuotationEmail } from '../services/emailService.js'

// Función auxiliar del Motor de Cálculo Financiero (Estándar Colombia / DIAN)
const calculateTotals = (items = [], discount = 0, applyIva = false) => {
    const calculatedItems = items.map((item) => {
        const concept = item.concept || item.description || 'Sin concepto'
        const unit = item.unit || 'Und'
        const quantity = Number(item.quantity) >= 0 ? Number(item.quantity) : 1
        const unitPrice =
            Number(item.unitPrice ?? item.price ?? 0) >= 0
                ? Number(item.unitPrice ?? item.price ?? 0)
                : 0
        const subtotal = Number((quantity * unitPrice).toFixed(2))

        return {
            concept,
            unit,
            quantity,
            unitPrice,
            subtotal,
        }
    })

    // 1. Subtotal general (suma de conceptos)
    const subtotal = Number(
        calculatedItems.reduce((acc, curr) => acc + curr.subtotal, 0).toFixed(2)
    )

    // 2. Descuento comercial
    const rawDiscount = Number(discount) >= 0 ? Number(discount) : 0
    const discountValue = Number(Math.min(subtotal, rawDiscount).toFixed(2))

    // 3. Base gravable
    const taxableBase = Math.max(0, subtotal - discountValue)

    // 4. IVA Colombia (19%)
    const ivaRate = 0.19
    const tax = applyIva ? Number((taxableBase * ivaRate).toFixed(2)) : 0

    // 5. Total final a pagar (COP)
    const total = Number((taxableBase + tax).toFixed(2))

    return {
        items: calculatedItems,
        subtotal,
        discount: discountValue,
        applyIva: Boolean(applyIva),
        tax,
        total,
    }
}

// 1. POST /api/quotations - Crear una cotización
export const createQuotation = async (req, res) => {
    try {
        const validatedData = createQuotationSchema.parse(req.body)

        // Traer datos del usuario creador para asignar el cotizador
        const user = await UserModel.findById(req.user.id).select('username email')
        const quoterName = validatedData.quoterName || user?.username || 'Asesor Comercial'

        // Generar consecutivo tipo COT-2026-001 automáticamente si no viene
        let quoteNumber = validatedData.quoteNumber
        if (!quoteNumber) {
            const currentYear = new Date().getFullYear()
            const count = await QuotationModel.countDocuments({
                userId: req.user.id,
                quoteNumber: new RegExp(`^COT-${currentYear}-`),
            })
            quoteNumber = `COT-${currentYear}-${String(count + 1).padStart(3, '0')}`
        }

        // Fechas de emisión y validez (por defecto 15 días calendario)
        const issueDate = validatedData.issueDate || new Date()
        let validUntil = validatedData.validUntil
        if (!validUntil) {
            const defaultValid = new Date(issueDate)
            defaultValid.setDate(defaultValid.getDate() + 15)
            validUntil = defaultValid
        }

        // Motor de cálculo financiero con IVA y descuentos
        const { items, subtotal, discount, applyIva, tax, total } = calculateTotals(
            validatedData.items,
            validatedData.discount,
            validatedData.applyIva
        )

        const newQuotation = await QuotationModel.create({
            userId: req.user.id,
            quoteNumber,
            quoterName,
            quoterId: req.user.id,
            clientName: validatedData.clientName,
            clientDocumentType: validatedData.clientDocumentType || 'NIT',
            clientDocument: validatedData.clientDocument || '',
            clientPhone: validatedData.clientPhone || '',
            clientEmail: validatedData.clientEmail || '',
            issueDate,
            validUntil,
            description: validatedData.description || '',
            items,
            subtotal,
            discount,
            applyIva,
            tax,
            total,
            paymentTerms: validatedData.paymentTerms || '50% Anticipo - 50% Contra entrega',
            deliveryTime: validatedData.deliveryTime || '3 a 5 días hábiles',
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

        // Búsqueda opcional por cliente, descripción, consecutivo o documento
        if (search && search.trim() !== '') {
            const regex = new RegExp(search.trim(), 'i')
            filter.$or = [
                { clientName: regex },
                { description: regex },
                { quoteNumber: regex },
                { clientDocument: regex },
            ]
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

// 4. PATCH / PUT /api/quotations/:id - Editar una cotización propia
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

        // Recalcular subtotales, IVA y total si se actualizan conceptos, descuento o IVA
        const itemsToCalculate =
            validatedData.items !== undefined
                ? validatedData.items
                : existingQuotation.items
        const discountToCalculate =
            validatedData.discount !== undefined
                ? validatedData.discount
                : existingQuotation.discount
        const applyIvaToCalculate =
            validatedData.applyIva !== undefined
                ? validatedData.applyIva
                : existingQuotation.applyIva

        const { items, subtotal, discount, applyIva, tax, total } = calculateTotals(
            itemsToCalculate,
            discountToCalculate,
            applyIvaToCalculate
        )

        // Actualizar cabecera y metadatos
        if (validatedData.clientName !== undefined) {
            existingQuotation.clientName = validatedData.clientName
        }
        if (validatedData.clientDocumentType !== undefined) {
            existingQuotation.clientDocumentType = validatedData.clientDocumentType
        }
        if (validatedData.clientDocument !== undefined) {
            existingQuotation.clientDocument = validatedData.clientDocument
        }
        if (validatedData.clientPhone !== undefined) {
            existingQuotation.clientPhone = validatedData.clientPhone
        }
        if (validatedData.clientEmail !== undefined) {
            existingQuotation.clientEmail = validatedData.clientEmail
        }
        if (validatedData.issueDate !== undefined) {
            existingQuotation.issueDate = validatedData.issueDate
        }
        if (validatedData.validUntil !== undefined) {
            existingQuotation.validUntil = validatedData.validUntil
        }
        if (validatedData.quoterName !== undefined) {
            existingQuotation.quoterName = validatedData.quoterName
        }
        if (validatedData.description !== undefined) {
            existingQuotation.description = validatedData.description
        }
        if (validatedData.paymentTerms !== undefined) {
            existingQuotation.paymentTerms = validatedData.paymentTerms
        }
        if (validatedData.deliveryTime !== undefined) {
            existingQuotation.deliveryTime = validatedData.deliveryTime
        }
        if (validatedData.status !== undefined) {
            existingQuotation.status = validatedData.status
        }
        if (validatedData.notes !== undefined) {
            existingQuotation.notes = validatedData.notes
        }

        // Asignar cálculos financieros
        existingQuotation.items = items
        existingQuotation.subtotal = subtotal
        existingQuotation.discount = discount
        existingQuotation.applyIva = applyIva
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

// 6. POST /api/quotations/:id/send-email - Enviar cotización en PDF por correo electrónico
export const sendQuotationEmailController = async (req, res) => {
    try {
        const { id } = req.params
        const { email } = req.body || {}

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
                message: 'Cotización no encontrada o no pertenece al usuario autenticado',
            })
        }

        const recipientEmail = (email || quotation.clientEmail || '').trim()
        if (!recipientEmail || !recipientEmail.includes('@')) {
            return res.status(400).json({
                message: 'El cliente no tiene un correo electrónico válido registrado',
            })
        }

        // Si se envió un correo nuevo en el cuerpo, actualizarlo en la cotización
        if (email && email.trim() !== quotation.clientEmail) {
            quotation.clientEmail = email.trim()
        }

        // 1. Transición automática antes de generar el PDF: si está en
        // 'borrador', pasa a 'pendiente' para que el PDF se envíe con el
        // estado correcto.
        if (quotation.status === 'borrador') {
            quotation.status = 'pendiente'
        }

        // 2. Generar el archivo PDF real de la cotización
        const pdfBuffer = await generateQuotationPDF(quotation)

        // 3. Enviar por correo con el PDF adjunto
        const sendResult = await sendQuotationEmail({
            quotation,
            pdfBuffer,
            recipientEmail,
        })

        await quotation.save()

        return res.status(200).json({
            message: sendResult.message || `Cotización enviada exitosamente a ${recipientEmail}`,
            quotation,
            simulated: sendResult.simulated || false,
        })
    } catch (error) {
        console.error('Error al enviar cotización por correo:', error)
        return res.status(500).json({
            message: error.message || 'Error al procesar el envío de la cotización',
        })
    }
}
