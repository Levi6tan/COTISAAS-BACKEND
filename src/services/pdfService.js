import PDFDocument from 'pdfkit'

// Formateador COP para el PDF
const formatCOP = (num) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
    }).format(Number(num) || 0)
}

/**
 * Genera un Buffer PDF profesional de la cotización técnica
 * @param {Object} quotation
 * @returns {Promise<Buffer>}
 */
export const generateQuotationPDF = (quotation) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'LETTER',
                margin: 40,
                info: {
                    Title: `Cotización ${quotation.quoteNumber || 'COT'} - CotiSaaS`,
                    Author: quotation.quoterName || 'CotiSaaS',
                    Subject: 'Propuesta Técnica y Comercial',
                },
            })

            const buffers = []
            doc.on('data', (chunk) => buffers.push(chunk))
            doc.on('end', () => resolve(Buffer.concat(buffers)))
            doc.on('error', (err) => reject(err))

            // 1. Membrete Superior
            doc.fillColor('#01202F')
                .fontSize(22)
                .font('Helvetica-Bold')
                .text('COTISAAS', 40, 40)

            doc.fontSize(9)
                .font('Helvetica')
                .fillColor('#57606A')
                .text('Servicios Técnicos, Redes e Instalaciones Profesionales', 40, 68)
                .text('NIT: 901.882.341-1 • Colombia', 40, 80)
                .text(`Cotizador Asignado: ${quotation.quoterName || 'Asesor Técnico'}`, 40, 92)

            // Consecutivo y Fechas a la derecha
            const rightX = 380
            doc.rect(rightX, 40, 190, 65)
                .fillAndStroke('#F8F9FA', '#DCD8D0')

            doc.fillColor('#01202F')
                .fontSize(12)
                .font('Helvetica-Bold')
                .text(quotation.quoteNumber || 'COT-2026-###', rightX + 10, 48)

            doc.fontSize(8.5)
                .font('Helvetica')
                .fillColor('#57606A')
                .text(`Emisión: ${quotation.issueDate ? new Date(quotation.issueDate).toLocaleDateString('es-CO') : 'Hoy'}`, rightX + 10, 66)
                .text(`Válida hasta: ${quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString('es-CO') : '15 días'}`, rightX + 10, 78)
                .text(`Estado: ${(quotation.status || 'pendiente').toUpperCase()}`, rightX + 10, 90)

            // 2. Bloque de Datos del Cliente
            let y = 125
            doc.rect(40, y, 530, 60)
                .fillAndStroke('#F8F9FA', '#EAECEF')

            doc.fillColor('#1F2328')
                .fontSize(8.5)
                .font('Helvetica-Bold')
                .text('DATOS DEL CLIENTE (PERSONA / PROPIETARIO)', 50, y + 8)

            doc.font('Helvetica')
                .fontSize(9)
                .fillColor('#57606A')
                .text(`Nombre: `, 50, y + 24, { continued: true })
                .font('Helvetica-Bold').fillColor('#1F2328').text(quotation.clientName || 'Cliente Particular')

            doc.font('Helvetica')
                .fillColor('#57606A')
                .text(`Identificación: `, 50, y + 40, { continued: true })
                .font('Helvetica-Bold').fillColor('#1F2328')
                .text(`${quotation.clientDocumentType || 'CC'}: ${quotation.clientDocument || 'No registrada'}`)

            doc.font('Helvetica')
                .fillColor('#57606A')
                .text(`Celular / WhatsApp: `, 320, y + 24, { continued: true })
                .font('Helvetica-Bold').fillColor('#1F2328').text(quotation.clientPhone || 'No registrado')

            doc.font('Helvetica')
                .fillColor('#57606A')
                .text(`Correo Electrónico: `, 320, y + 40, { continued: true })
                .font('Helvetica-Bold').fillColor('#1F2328').text(quotation.clientEmail || 'No registrado')

            y += 70

            // Descripción del trabajo si existe
            if (quotation.description) {
                doc.fontSize(8.5)
                    .font('Helvetica-Bold')
                    .fillColor('#01202F')
                    .text('OBJETO DEL TRABAJO / SERVICIO:', 40, y)
                doc.font('Helvetica')
                    .fillColor('#57606A')
                    .text(quotation.description, 40, y + 12, { width: 530 })
                y += 30
            }

            // 3. Tabla de Conceptos
            y += 5
            doc.rect(40, y, 530, 20)
                .fill('#01202F')

            doc.fillColor('#FFFFFF')
                .fontSize(8.5)
                .font('Helvetica-Bold')
                .text('DESCRIPCIÓN / SERVICIO', 50, y + 5)
                .text('UNIDAD', 280, y + 5, { width: 50, align: 'center' })
                .text('CANT.', 340, y + 5, { width: 40, align: 'center' })
                .text('VALOR UNITARIO', 390, y + 5, { width: 85, align: 'right' })
                .text('SUBTOTAL', 485, y + 5, { width: 75, align: 'right' })

            y += 20

            // Filas de conceptos
            const items = quotation.items || []
            items.forEach((item, index) => {
                const isEven = index % 2 === 0
                if (isEven) {
                    doc.rect(40, y, 530, 20).fill('#FAFAFA')
                }

                const itemSubtotal = (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)

                doc.fillColor('#1F2328')
                    .fontSize(8.5)
                    .font('Helvetica')
                    .text(item.concept || 'Servicio técnico', 50, y + 5, { width: 220 })
                    .text(item.unit || 'Und', 280, y + 5, { width: 50, align: 'center' })
                    .text(String(item.quantity || 1), 340, y + 5, { width: 40, align: 'center' })
                    .text(formatCOP(item.unitPrice || 0), 390, y + 5, { width: 85, align: 'right' })
                    .font('Helvetica-Bold')
                    .text(formatCOP(itemSubtotal), 485, y + 5, { width: 75, align: 'right' })

                y += 20
            })

            // Línea divisoria
            doc.moveTo(40, y).lineTo(570, y).strokeColor('#EAECEF').stroke()
            y += 10

            // 4. Bloque Financiero (Alineado a la derecha)
            const sumBoxX = 350
            const sumBoxW = 220

            doc.rect(sumBoxX, y, sumBoxW, 75)
                .fillAndStroke('#F8F9FA', '#EAECEF')

            doc.fontSize(8.5)
                .font('Helvetica')
                .fillColor('#57606A')
                .text('Subtotal:', sumBoxX + 15, y + 10)
                .font('Helvetica-Bold').fillColor('#1F2328')
                .text(formatCOP(quotation.subtotal || 0), sumBoxX + 110, y + 10, { width: 95, align: 'right' })

            if (Number(quotation.discount) > 0) {
                doc.font('Helvetica').fillColor('#2E7D32')
                    .text('Descuento:', sumBoxX + 15, y + 24)
                    .font('Helvetica-Bold')
                    .text(`-${formatCOP(quotation.discount)}`, sumBoxX + 110, y + 24, { width: 95, align: 'right' })
            }

            if (quotation.applyIva) {
                doc.font('Helvetica').fillColor('#57606A')
                    .text('IVA (19%):', sumBoxX + 15, y + 38)
                    .font('Helvetica-Bold').fillColor('#1F2328')
                    .text(formatCOP(quotation.tax || 0), sumBoxX + 110, y + 38, { width: 95, align: 'right' })
            }

            // Total
            doc.rect(sumBoxX, y + 52, sumBoxW, 23).fill('#01202F')
            doc.fontSize(9.5)
                .font('Helvetica-Bold')
                .fillColor('#FFFFFF')
                .text('TOTAL A PAGAR:', sumBoxX + 15, y + 58)
                .text(formatCOP(quotation.total || 0), sumBoxX + 110, y + 58, { width: 95, align: 'right' })

            // Condiciones comerciales (A la izquierda)
            doc.fontSize(8.5)
                .font('Helvetica-Bold')
                .fillColor('#01202F')
                .text('CONDICIONES COMERCIALES:', 40, y + 8)

            doc.font('Helvetica')
                .fillColor('#57606A')
                .text(`Forma de pago: ${quotation.paymentTerms || 'Contado / Contra entrega'}`, 40, y + 22)
                .text(`Tiempo de ejecución: ${quotation.deliveryTime || '1 a 3 días hábiles'}`, 40, y + 34)

            if (quotation.notes) {
                doc.text(`Observaciones y garantía: ${quotation.notes}`, 40, y + 46, { width: 290 })
            }

            // 5. Sección de Firmas al pie de página
            const signY = 660
            doc.moveTo(60, signY).lineTo(240, signY).strokeColor('#8C959F').stroke()
            doc.moveTo(370, signY).lineTo(550, signY).strokeColor('#8C959F').stroke()

            doc.fontSize(8.5)
                .font('Helvetica-Bold')
                .fillColor('#1F2328')
                .text(quotation.quoterName || 'Cotizador', 60, signY + 6, { width: 180, align: 'center' })
                .text(quotation.clientName || 'Cliente Particular', 370, signY + 6, { width: 180, align: 'center' })

            doc.font('Helvetica')
                .fontSize(7.5)
                .fillColor('#57606A')
                .text('Asesor Técnico / CotiSaaS', 60, signY + 18, { width: 180, align: 'center' })
                .text('Aceptado y Recibido a Conformidad', 370, signY + 18, { width: 180, align: 'center' })

            doc.end()
        } catch (error) {
            reject(error)
        }
    })
}
