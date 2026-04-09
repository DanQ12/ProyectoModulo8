const {Router} = require ("express");
const ctrl = require("../controllers/userController")
const {authMiddleware, requireRole} = require("../middleware/authMiddleware");

const router = Router();

//todas las rutas requieren verificacion
router.use(authMiddleware);

//solo admin peude pedir todos los usuarios
router.get("/", requireRole("admin"), ctrl.getUsers)

module.exports = router