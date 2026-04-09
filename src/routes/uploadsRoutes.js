const {Routes} = require("express");
const upload = require("../config/multer")
const ctrl = require("../controllers/uploadController")
const {authMiddleware, requireRole} = require("../middleware/authMiddleware");

const router = Router();

//Todas las rutas requieren validacion de JWT
router.use(authMiddleware);

//El Usuario sube su foto de perfil, "avatar" es el nombre que se le da en el formulario de multer
router.post("/avatar", upload.single("avatar"), ctrl.uploadAvatar);

//Cambio imagenes de productos, solo disponible para admin
router.post("/product/i:d", requireRole("admin"), upload.single("imagen"), ctrl.uploadProductImage)

module.exports = router