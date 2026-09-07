const express =
    require("express");

const {
    obtenerPresupuestos,
    guardarPresupuesto,
    eliminarPresupuesto
} =
    require(
        "../controllers/presupuestosController"
    );

const router =
    express.Router();


/*
 * =====================================================
 * GET
 *
 * /api/presupuestos
 *
 * /api/presupuestos?periodo=2026-08
 * =====================================================
 */

router.get(
    "/",
    obtenerPresupuestos
);


/*
 * =====================================================
 * PUT
 *
 * Crear o actualizar presupuesto
 * =====================================================
 */

router.put(
    "/",
    guardarPresupuesto
);


/*
 * =====================================================
 * DELETE
 *
 * /api/presupuestos/:id
 * =====================================================
 */

router.delete(
    "/:id",
    eliminarPresupuesto
);


module.exports =
    router;