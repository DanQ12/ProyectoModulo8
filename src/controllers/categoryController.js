//Crud de categorias y productos
const {Category, Product} = require("../models")
const {Op} = require("sequelize")

//Lista de categorias con sus productos
async function getAll(req, res, next){
    try{
        //busceda dinamica por nombre
        const {search} = req.query;
        const where = {};
        if(search){
            where.nombre = { [Op.iLike]: `%${search}%` } //no afectada por mayusculas-minuscula
        }

        const categories = await Category.findAll({
            where,
            include: [{
                model: Product,
                as: "products",
                attributes: ["id", "nombre", "precio", "stock"]
            }],
            order: [["nombre", "ASC"]]
        })

        res.json({
            status: "success",
            message: `${categories.length} categorías encotnradas`,
            data: categories
        })
    }catch(err){
        next(err)
    }
}

//Devolver una sola categoria con su productos
async function getById(req,res,next){
    try{
        const category = await Category.findByPk(req.params.id, {
            include:[{model: Product, as: "products"}]
        })

        if(!category){
            return res.status(404).json({
                status: "error",
                message: "Categoria no encontrada",
                data: null
            })
        }

        res.json({
            status: "success",
            message: "Categoria encontrada",
            data: category
        })
    }catch(err){
        next(err)
    }
}

async function create (req, res, next){
    try{
        const {nombre, descripcion} = req.body;

        if(!nombre){
            return res.status(400).json({
                status: "error",
                message: "El nombre es obligatorio",
                data: null
            })
        }

        const category = await Category.create({nombre, descripcion});
        res.status(201).json({
            status: "success",
            message: "Categoría creada exitosamente",
            data: category
        })
    }catch(err){
        next(err)
    }
}


//Actualizacion de categorias. Se actualizan solo los campos que llegan
async function update (req,res,next){
    try{
        const category = await Category.findByPk(req.params.id);

        if(!category){
            return res.status(404).json({
                status: "error",
                message: "Categoria no encontrada",
                data: null
            })
        }

        await category.update(req.body);
        res.json({
            status: "success",
            message: "Categoria actualizada",
            data: category
        })
    }catch(err){
        next(err)
    }
}


//Borrar categoria
async function remove(req,res,next){
    try{
        const category = await Category.findByPk(req.params.id)

        if(!category){
            return res.status(404).json({
                status: "error",
                message: "Categoria no encontrada",
                data: null
            })
        }

        await category.destroy();

        res.json({
            status: "success",
            message: "Categoria eliminada",
            data: null
        })
    }catch(err){
        next(err)
    } 
}
module.exports = {getAll, getById, create, update, remove}