//control de registro e inicio de sesion
const bcrypt =require("bcryptjs")
const jwt = require("jsonwebtoken")
const {User} = require("../models")

//Crea un usuario nuevo, oculta la informacion de su contraseña y devuelve un JWT
async function register(req, res, next){
    try{
        const {nombre, email, password, telefono} = req.body;

        if(!nombre || !email || !password){
            return res.status(400).json({
                status: "Error",
                message: "Nombre, Email y Contraseña obligatorio",
                data: null
            })
        }

        //Verificar si el correo ya esta registrado
        const exists = await User.findOne({where: {email}})
        if(exists){
            return res.status(409).json({
                status: "error",
                message: "Esten email ya esta registrado",
                data: null
            })
        }


        //Hashear la contraseña, usando un factor que balancea seguridad y velocidad
        const hashedPassword = await bcrypt.hash(password, 12);


        const user = await User.create({
            nombre,
            email,
            password: hashedPassword,
            telefono: telefono || null
        })

        const token = jwt.sign(
            {
                id:user.id,
                email: user.email,
                rol: user.rol
            },process.env.JWT_SECRETE,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "24h"
            }
        );

        res.status(201).json({
            status: "success",
            message: "Usuario registrado exitosamente.",
            data: {
                token,
                user: {id: user.id, nombre: user.nombre, email: user.email, rol: user.rol}
            }
        })
    }catch(err){
        next(err); //Envia al errorMiddleware
    }
}

//Login de usuario, verifica las credenciales
async function login (req,res,next){
    try{
        const {email, password} = req.body

        //Validacion campos necesarios
        if(!email || !password){
        return res.status(400).json({
                status: "error",
                message: "Email y contraseña son obligatorios",
                data: null
            })
        }

        const user = await User.findOne({where: {email}})

        //Mensaje generico para no revelear informacion sensible
        if(!user){
            return res.status(401).json({
                status: "error",
                message: "Credenciales invalidas",
                data: null
            })
        }

        const isValid = await bcrypt.compare(password, user.password);

        if(!isValid){
            return res.status(401).json({
                status: "error",
                message: "Credenciales inválidos",
                data: null
            })
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                rol: user.rol
            },
            process.env.JWT_SECRETE,
            {expiresIn: process.env.JWT_EXPIRES_IN || "24h"}
        );

        res.json({
            status: "success",
            message: "Inicio de sesion exitoso",
            data: {
                token,
                user: {id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, avatar: user.avatar}
            }
        })
    }catch(err){
        next(err)
    }
}


//Obtener los datos del usuario, sin mostrar datos sensibles
async function getMe(req,res,next){
    try{
        const user = await User.findByPk(req.user.id, {
            attributes: {exclude: "password"}
        });

        if(!user){
            return res.status(404).json({
                status: "error",
                message: "Usuario no encontrado",
                data: null
            })
        }

        res.json({
            status: "success",
            message: "Datos de usuario autenticados",
            data: user
        })
    }catch(err){
        next(err)
    }
}

module.exports = {register, login, getMe}