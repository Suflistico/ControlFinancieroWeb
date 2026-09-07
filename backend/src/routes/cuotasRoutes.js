const express =
    require("express");


const {
    obtenerCuotas,
    actualizarEstadoCuota
} =
    require(
        "../controllers/cuotasController"
    );


const router =
    express.Router();


/*
 * =====================================================
 * LISTAR CUOTAS
 * =====================================================
 */

router.get(
    "/",
    obtenerCuotas
);


/*
 * =====================================================
 * PAGAR / REVERTIR CUOTA
 * =====================================================
 */

router.patch(
    "/:id",
    actualizarEstadoCuota
);


module.exports =
    router;