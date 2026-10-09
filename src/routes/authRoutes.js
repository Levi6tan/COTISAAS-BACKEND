import express from "express"
const router = express.Router() //envia las rutas al server.js


// Obtener la peticion de login, crear cuenta o olvide la contraseña.
router.get("/", (req, res)=>{
    console.log("Usuario registrado");

    res.send("Petición GET exitosa a /api/auth")
})

// POST|Crear un recurso, como json pero se debe pasar a un objeto de js

// Iniciar sesion
router.post("/login", (req,res)=>{
    const {user, password} = req.body
    console.log(req.body)
    console.log(user, password)

    res.status(200).json({
        mensaje: "Login recibido con éxito en el backend",
        datosRecibidos: req.body
    })
})

//Crear un usuario nuevo
router.post("/register", (req,res)=>{
    const {name,user, email, password, companyId } = req.body
    console.log(req.body)
    console.log(name, user, email, password, companyId)

    res.status(201).json({
        mensaje: "Usuario registrado con éxito en el backend",
        usuario: { name, email, companyId }
    })
})


export default router
