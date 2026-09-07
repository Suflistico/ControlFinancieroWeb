const express =
    require("express");

const cors =
    require("cors");

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
 * MIDDLEWARE
 * =====================================================
 */

app.use(
    cors()
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
 * SERVIDOR
 * =====================================================
 */

app.listen(
    PORT,
    () => {
        console.log(
            `Servidor ejecutándose en puerto ${PORT}`
        );
    }
);