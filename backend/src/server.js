const express =
    require("express");

const cors =
    require("cors");

require("dotenv").config();

const pool =
    require("./config/db");


/*
 * =====================================================
 * ROUTES
 * =====================================================
 */

const transaccionesRoutes =
    require(
        "./routes/transaccionesRoutes"
    );

const dashboardRoutes =
    require(
        "./routes/dashboardRoutes"
    );

const configuracionRoutes =
    require(
        "./routes/configuracionRoutes"
    );

const cuotasRoutes =
    require(
        "./routes/cuotasRoutes"
    );

const presupuestosRoutes =
    require(
        "./routes/presupuestosRoutes"
    );


/*
 * =====================================================
 * APP
 * =====================================================
 */

const app =
    express();

const PORT =
    process.env.PORT ||
    3001;


/*
 * =====================================================
 * CORS
 * =====================================================
 *
 * Desarrollo local:
 * http://localhost:3000
 *
 * Producción:
 * FRONTEND_URL configurado en Render.
 * =====================================================
 */

const origenesPermitidos = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    process.env.FRONTEND_URL,
].filter(Boolean);


const configuracionCors = {
    origin: (
        origin,
        callback
    ) => {

        /*
         * Permitir solicitudes sin Origin.
         *
         * Esto permite pruebas directas,
         * herramientas y solicitudes servidor-servidor.
         */

        if (!origin) {
            return callback(
                null,
                true
            );
        }


        if (
            origenesPermitidos.includes(
                origin
            )
        ) {
            return callback(
                null,
                true
            );
        }


        console.warn(
            `Origen bloqueado por CORS: ${origin}`
        );


        return callback(
            new Error(
                "Origen no permitido por CORS."
            )
        );
    },

    methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],

    allowedHeaders: [
        "Content-Type",
    ],
};


app.use(
    cors(
        configuracionCors
    )
);


app.use(
    express.json()
);


/*
 * =====================================================
 * RUTA PRINCIPAL
 * =====================================================
 */

app.get(
    "/",
    (
        req,
        res
    ) => {
        res.json({
            ok:
                true,

            mensaje:
                "API Control Financiero funcionando"
        });
    }
);


/*
 * =====================================================
 * TEST POSTGRESQL
 * =====================================================
 */

app.get(
    "/api/db-test",
    async (
        req,
        res
    ) => {
        try {
            const resultado =
                await pool.query(
                    `
                    SELECT
                        NOW()
                        AS fecha_servidor
                    `
                );


            res.json({
                ok:
                    true,

                mensaje:
                    "PostgreSQL conectado correctamente",

                fecha:
                    resultado
                        .rows[0]
                        .fecha_servidor
            });

        } catch (error) {

            console.error(
                "Error comprobando PostgreSQL:",
                error
            );


            res
                .status(500)
                .json({
                    ok:
                        false,

                    mensaje:
                        "No se pudo conectar a PostgreSQL"
                });
        }
    }
);


/*
 * =====================================================
 * API TRANSACCIONES
 * =====================================================
 */

app.use(
    "/api/transacciones",
    transaccionesRoutes
);


/*
 * =====================================================
 * API DASHBOARD
 * =====================================================
 */

app.use(
    "/api/dashboard",
    dashboardRoutes
);


/*
 * =====================================================
 * API CONFIGURACIÓN
 * =====================================================
 */

app.use(
    "/api/configuracion",
    configuracionRoutes
);


/*
 * =====================================================
 * API CUOTAS
 * =====================================================
 */

app.use(
    "/api/cuotas",
    cuotasRoutes
);


/*
 * =====================================================
 * API PRESUPUESTOS
 * =====================================================
 */

app.use(
    "/api/presupuestos",
    presupuestosRoutes
);


/*
 * =====================================================
 * MANEJO 404
 * =====================================================
 */

app.use(
    (
        req,
        res
    ) => {
        res
            .status(404)
            .json({
                ok:
                    false,

                mensaje:
                    "Ruta no encontrada"
            });
    }
);


/*
 * =====================================================
 * MANEJO GENERAL DE ERRORES
 * =====================================================
 */

app.use(
    (
        error,
        req,
        res,
        next
    ) => {

        console.error(
            "Error del servidor:",
            error
        );


        if (
            error.message ===
            "Origen no permitido por CORS."
        ) {
            return res
                .status(403)
                .json({
                    ok:
                        false,

                    mensaje:
                        "Origen no permitido."
                });
        }


        res
            .status(500)
            .json({
                ok:
                    false,

                mensaje:
                    "Error interno del servidor."
            });
    }
);


/*
 * =====================================================
 * SERVIDOR
 * =====================================================
 *
 * Render requiere que el servicio web pueda escuchar
 * en 0.0.0.0 y en el puerto entregado mediante PORT.
 * =====================================================
 */

app.listen(
    PORT,
    "0.0.0.0",
    () => {
        console.log(
            `Servidor ejecutándose en puerto ${PORT}`
        );

        console.log(
            `Entorno: ${process.env.NODE_ENV || "development"}`
        );

        console.log(
            `Frontend permitido: ${
                process.env.FRONTEND_URL ||
                "http://localhost:3000"
            }`
        );
    }
);