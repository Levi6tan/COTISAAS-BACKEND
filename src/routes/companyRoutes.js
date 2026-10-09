import express from "express"
const router = express.Router()

//Consulta la información de la empresa vinculada al usuario logueado.
router.get("/", ()=>{
    console.log("login validado")
})

//registro de la empresa
router.post("/", (req,res)=>{
    const {companyName, nit, phone, terms} = req.body
    console.log()
    console.log(req.body)

    res.status(200).json({
        message: "Login recibido con éxito en el backend"
    })
})

// Actulizar datos de la empresa
router.put("/",(req,res)=>{
    const {companyName, nit, phone, terms} = req.body
    console.log({companyName, nit, phone, terms})

    res.status(200).json({
        message: "Datos actulizados correctamente"
    })
})

export default router
