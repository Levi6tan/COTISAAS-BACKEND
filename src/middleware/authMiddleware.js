import jwt from 'jsonwebtoken'

export const verifyAuth = async (req, res, next) => {
    try {
        // Extraer el token de la cookie accessToken o del header Authorization Bearer
        const tokenFromCookie = req.cookies?.accessToken
        const authHeader = req.headers.authorization
        const tokenFromHeader =
            authHeader && authHeader.startsWith('Bearer ')
                ? authHeader.split(' ')[1]
                : null

        const token = tokenFromCookie || tokenFromHeader

        if (!token) {
            return res.status(401).json({
                message: 'No autenticado. Por favor inicie sesión para acceder a las cotizaciones.',
            })
        }

        const JWT_SECRET = process.env.JWT_SECRET || 'miClaveSecreta_0987'
        const decoded = jwt.verify(token, JWT_SECRET)

        // Asignar el id del usuario autenticado a la petición
        req.user = {
            id: decoded.userId,
        }

        next()
    } catch (error) {
        console.error('Error de autenticación en verifyAuth:', error.message)
        return res.status(401).json({
            message: 'Sesión inválida o expirada. Inicie sesión nuevamente.',
        })
    }
}

