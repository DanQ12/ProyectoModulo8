//Subida de archivos e imagenes para avatares y productos

//Tamaño y formato se valida antes de llegar aqui
const {User, Product} = require("../models")

//subir avatar de usuario, se usa el campo de formuilario "avatar"
async function uploadAvatar(req,res,next){
    try{
        //revision que hay archivo
        if(!req.file){
            return res.status(400).json({
                status: "error",
                message: "No se recibio ningun archivo",
                data: null
            })
        }

        //ruta publica, se puede acceder desde el navegador
        const avatarUrl = `/uploads/${req.file.filename}`;

        await User.update({avatar: avatarUrl}, {where:{id: req.user.id}})

        res.json({
            status: "succes",
            message: "Avatar actualizado exitosamente",
            data: {
                url: avatarUrl,
                filename: req.file.filename,
                size: req.file.size,
                mimetype: req.file.mimetype
            }
        })
    }catch(err){
        next(err)
    }
}

//Subir imagen y asociarla con el producto
async function uploadProductImage(req,res,next){
    try{
        if(!req.file){
            return res.status(400).json({
                status: "error",
                message: "No se recibio ningun archivo",
                data: null
            })
        }

        const product = await Product.findByPk(req.params.id)

        if(!product){
            return res.status(404).json({
                status: "error",
                message: "producto no encontrado",
                data: null
            })
        }

        const imageUrl = `/uploads/${req.file.filename}`
        
        await product.update({imagen: imageUrl})

        res.json({
            status: "success",
            message: "Imagen del producto actualizada",
            data: {
                productId: product.id,
                imageUrl,
                filename: req.file.filename,
                size: req.file.size
            }
        })
    }catch(err){
        next(err)
    }
}

module.exports = {uploadAvatar, uploadProductImage}