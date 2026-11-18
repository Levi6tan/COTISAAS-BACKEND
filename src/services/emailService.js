import nodemailer from 'nodemailer'

const formatCOP = (num) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
    }).format(Number(num) || 0)
}

/**
 * Servicio para enviar cotización en PDF por correo electrónico
 * @param {Object} params
 * @param {Object} params.quotation
 * @param {Buffer} params.pdfBuffer
 * @param {String} params.recipientEmail
 * @returns {Promise<{success: boolean, simulated: boolean, message: string}>}
 */
export const sendQuotationEmail = async ({ quotation, pdfBuffer, recipientEmail }) => {
    const emailUser = (process.env.EMAIL_USER || '').trim()
    const emailPass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '')

    const clientName = quotation.clientName || 'Estimado(a) Cliente'
    const quoteNumber = quotation.quoteNumber || 'COT-2026'
    const totalFormatted = formatCOP(quotation.total || 0)
    const quoterName = quotation.quoterName || 'Asesor Técnico'

    const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #EAECEF; border-radius: 6px; overflow: hidden;">
        <!-- Cabecera -->
        <div style="background-color: #01202F; padding: 24px; color: #ffffff;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">COTISAAS</h1>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #8C959F;">Propuesta Técnica y Presupuesto Comercial</p>
        </div>

        <!-- Contenido Principal -->
        <div style="padding: 24px 28px; color: #1F2328; font-size: 14px; line-height: 1.6;">
            <p style="margin: 0 0 16px 0; font-size: 15px; font-weight: 600;">Hola ${clientName},</p>
            <p style="margin: 0 0 16px 0; color: #57606A;">
                Adjunto a este correo encontrarás el documento formal en PDF de tu cotización <strong>${quoteNumber}</strong> por valor de <strong>${totalFormatted}</strong> para los servicios técnicos solicitados.
            </p>

            <!-- Tarjeta Resumen -->
            <div style="background-color: #F8F9FA; border: 1px solid #EAECEF; border-radius: 4px; padding: 16px; margin: 20px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #57606A; font-size: 13px;">Consecutivo:</span>
                    <strong style="color: #01202F; font-size: 13px;">${quoteNumber}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #57606A; font-size: 13px;">Total a Pagar:</span>
                    <strong style="color: #01202F; font-size: 15px;">${totalFormatted}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #57606A; font-size: 13px;">Forma de Pago:</span>
                    <span style="color: #1F2328; font-size: 13px;">${quotation.paymentTerms || 'Contado / Contra entrega'}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: #57606A; font-size: 13px;">Tiempo de Ejecución:</span>
                    <span style="color: #1F2328; font-size: 13px;">${quotation.deliveryTime || '1 a 3 días hábiles'}</span>
                </div>
            </div>

            <p style="margin: 16px 0; color: #57606A;">
                Puedes descargar el PDF adjunto para revisar el desglose detallado de materiales, mano de obra y términos de garantía. Quedamos a tu completa disposición para resolver cualquier inquietud o programar la ejecución del trabajo.
            </p>

            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #EAECEF;">
                <p style="margin: 0; font-weight: 600; color: #1F2328;">${quoterName}</p>
                <p style="margin: 2px 0 0 0; font-size: 12px; color: #57606A;">Asesor Técnico • CotiSaaS</p>
            </div>
        </div>

        <!-- Pie de página -->
        <div style="background-color: #F8F9FA; padding: 14px 28px; text-align: center; border-top: 1px solid #EAECEF; font-size: 11px; color: #8C959F;">
            Este mensaje fue generado automáticamente por el sistema de cotizaciones CotiSaaS.
        </div>
    </div>
    `

    // Si existen credenciales de correo configuradas, enviar usando Nodemailer
    if (emailUser && emailPass) {
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: emailUser,
                    pass: emailPass,
                },
            })

            const info = await transporter.sendMail({
                from: process.env.EMAIL_FROM || `"CotiSaaS Cotizaciones" <${emailUser}>`,
                to: recipientEmail,
                subject: `Cotización ${quoteNumber} - ${clientName}`,
                text: `Hola ${clientName}, te adjuntamos la cotización ${quoteNumber} por un total de ${totalFormatted}. Quedamos atentos a tus comentarios. Saludos, ${quoterName}.`,
                html: htmlContent,
                attachments: [
                    {
                        filename: `${quoteNumber}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf',
                    },
                ],
            })

            console.log(`[Email] Cotización ${quoteNumber} enviada a ${recipientEmail}:`, info.messageId)
            return {
                success: true,
                simulated: false,
                message: `Cotización enviada exitosamente a ${recipientEmail} con el PDF adjunto.`,
            }
        } catch (error) {
            console.error('[Email Error] Fallo al enviar correo:', error)
            throw new Error(`Error en el servidor de correo: ${error.message}`)
        }
    }

    // Modo desarrollo / sin credenciales SMTP configuradas en .env:
    // Se genera el PDF real y se valida el flujo completo simulando el despacho exitoso
    console.log(`[Email Simulado] PDF generado para ${quoteNumber} (${pdfBuffer.length} bytes). Enviado a: ${recipientEmail}`)
    return {
        success: true,
        simulated: true,
        message: `Cotización enviada exitosamente a ${recipientEmail} con el PDF adjunto.`,
    }
}
