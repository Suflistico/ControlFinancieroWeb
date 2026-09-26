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

app.disable(
    "x-powered-by"
);

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
    express.json({
        limit:
            "100kb"
    })
);


/*
 * =====================================================
 * CABECERAS DE SEGURIDAD BÁSICAS
 * =====================================================
 */

app.use(
    (
        req,
        res,
        next
    ) => {
        res.set({
            "X-Content-Type-Options":
                "nosniff",

            "X-Frame-Options":
                "DENY",

            "Referrer-Policy":
                "no-referrer",

            "Permissions-Policy":
                "camera=(), microphone=(), geolocation=()"
        });

        next();
    }
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
 * ESTADO DEL SERVICIO
 * =====================================================
 */

app.get(
    "/api/health",
    async (
        req,
        res
    ) => {
        try {
            await pool.query(
                "SELECT 1"
            );

            res.json({
                ok:
                    true,

                servicio:
                    "control-financiero-api",

                base_datos:
                    "disponible"
            });

        } catch (error) {
            console.error(
                "La verificación de salud falló:",
                error
            );

            res
                .status(503)
                .json({
                    ok:
                        false,

                    servicio:
                        "control-financiero-api",

                    base_datos:
                        "no disponible"
                });
        }
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


        if (
            error.type ===
            "entity.too.large"
        ) {
            return res
                .status(413)
                .json({
                    ok:
                        false,

                    mensaje:
                        "La solicitud supera el tamaño permitido."
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

const iniciarServidor = (
    puerto = PORT,
    host = "0.0.0.0"
) => {
    const servidor =
        app.listen(
            puerto,
            host,
            () => {
                const direccion =
                    servidor.address();

                const puertoActivo =
                    direccion &&
                    typeof direccion ===
                        "object"
                        ? direccion.port
                        : puerto;

                console.log(
                    `Servidor ejecutándose en puerto ${puertoActivo}`
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

    return servidor;
};


if (
    require.main ===
    module
) {
    const servidor =
        iniciarServidor();

    const cerrarServidor =
        (senal) => {
            console.log(
                `${senal} recibida. Cerrando servidor...`
            );

            servidor.close(
                async () => {
                    await pool.end();
                    process.exit(0);
                }
            );
        };

    process.once(
        "SIGTERM",
        () =>
            cerrarServidor(
                "SIGTERM"
            )
    );

    process.once(
        "SIGINT",
        () =>
            cerrarServidor(
                "SIGINT"
            )
    );
}


module.exports = {
    app,
    iniciarServidor
};
