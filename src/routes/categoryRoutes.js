const {Router} = require("express");
const ctrl = require("../controllers/categoryController")
const {authMiddleware, requireRole} = require("../middleware/authMiddleware");

const router = Router();

//Rutas publicas que no requiern proteccion
router.get("/", ctrl.getAll)
router.get("/:id", ctrl.getById);

//Rutas protegidas, solamente admin pueden crear, editar o borrar categorias
router.post("/", authMiddleware, requireRole("admin"), ctrl.create);
router.put("/:id", authMiddleware,requireRole("admin"), ctrl.update);
router.delete("/:id", authMiddleware, requireRole("admin"), ctrl.remove);

module.exports = router