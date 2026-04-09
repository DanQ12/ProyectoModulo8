    //Ruoter raiz que monta las subsrutas, permitiendo flexibilidad y exalamiento
    
    const Router = require("express");
    const authRoutes = require("./authRoutes")
    const categoryRoutes = require("./categoryRoutes")
    const orderRoutes = require("./orderRoutes")
    const productsRoutes = require("./productsRoutes")
    const uploadsRoutes = require("./uploadsRoutes")
    const userRoutes = require("./userRoutes")

    const router = Router()

    //Rutas de estado de la api
    router.get("/", (req,res) => {
        res.json({
            status: "success",
            message: "API retailAseo v1.0 - lista para recibir peticiones",
            data: {
                endpoints: [
                    "POST   /api/auth/register",
                    "POST   /api/auth/login",
                    "GET    /api/auth/me              -  [🔒JWT]",
                    "GET    /api/categories",
                    "GET    /api/categories/:id",
                    "POST   /api/categories           -  [🔒admin]",
                    "PUT    /api/categories/:id       -  [🔒admin]",
                    "DELETE /api/categories/:id       -  [🔒admin]",
                    "GET    /api/products",
                    "GET    /api/products/:id",
                    "POST   /api/products             -  [🔒admin]",
                    "PUT    /api/products/:id         -  [🔒admin]",
                    "DELETE /api/products/:id         -  [🔒admin]",
                    "GET    /api/orders               -  [🔒JWT]",
                    "GET    /api/orders/:id           -  [🔒JWT]",
                    "POST   /api/orders               -  [🔒JWT]",
                    "PUT    /api/orders/:id/estado    -  [🔒admin]",
                    "POST   /api/uploads/avatar       -  [🔒JWT]",
                    "POST   /api/uploads/product/:id  -  [🔒admin]",
                    "GET    /api/users                -  [🔒admin]",
                ]
            }
        })
    })

    //monaje de las rutas
    router.use("/auth", authRoutes)
    router.use("/categories", categoryRoutes)
    router.use("/orders", orderRoutes)
    router.use("/products", productsRoutes)
    router.use("/uploads", uploadsRoutes)
    router.use("/users", userRoutes)
    
    module.exports = router;