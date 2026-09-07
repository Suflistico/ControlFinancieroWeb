const express =
    require("express");

const {
    obtenerTransacciones,
    obtenerTransaccionPorId,
    crearTransaccion,
    actualizarTransaccion,
    eliminarTransaccion
} =
    require(
        "../controllers/transaccionesController"
    );

const router =
    express.Router();


/*
 * Obtener historial
 */

router.get(
    "/",
    obtenerTransacciones
);


/*
 * Obtener detalle
 */

router.get(
    "/:id",
    obtenerTransaccionPorId
);


/*
 * Crear movimiento
 */

router.post(
    "/",
    crearTransaccion
);


/*
 * Editar movimiento
 */

router.put(
    "/:id",
    actualizarTransaccion
);


/*
 * Eliminar movimiento
 */

router.delete(
    "/:id",
    eliminarTransaccion
);


module.exports =
    router;