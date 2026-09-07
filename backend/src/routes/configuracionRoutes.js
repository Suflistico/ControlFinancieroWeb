const express = require("express");

const {
    obtenerConfiguracion,
    guardarConfiguracion,
    restablecerDatos
} = require("../controllers/configuracionController");

const router = express.Router();

router.get(
    "/",
    obtenerConfiguracion
);

router.put(
    "/",
    guardarConfiguracion
);

router.delete(
    "/reset",
    restablecerDatos
);

module.exports = router;