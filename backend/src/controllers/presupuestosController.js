const pool =
    require("../config/db");


/*
 * =====================================================
 * FUNCIÓN AUXILIAR
 * NORMALIZAR PERÍODO
 * =====================================================
 *
 * Acepta:
 *
 * 2026-08
 * 2026-08-15
 *
 * Y siempre devuelve:
 *
 * 2026-08-01
 *
 * Si no se recibe período,
 * devolvemos null y PostgreSQL
 * utilizará el mes actual.
 * =====================================================
 */

const normalizarPeriodo = (
    periodo
) => {
    if (!periodo) {
        return null;
    }

    const texto =
        String(
            periodo
        ).trim();

    /*
     * Formato YYYY-MM
     */

    if (
        /^\d{4}-\d{2}$/.test(
            texto
        )
    ) {
        return `${texto}-01`;
    }

    /*
     * Formato YYYY-MM-DD
     */

    if (
        /^\d{4}-\d{2}-\d{2}$/.test(
            texto
        )
    ) {
        return `${texto.slice(
            0,
            7
        )}-01`;
    }

    return null;
};


/*
 * =====================================================
 * OBTENER PRESUPUESTOS DEL MES
 * =====================================================
 *
 * GET
 *
 * /api/presupuestos
 *
 * o
 *
 * /api/presupuestos?periodo=2026-08
 *
 * =====================================================
 */

const obtenerPresupuestos =
    async (req, res) => {
        try {
            const periodoRecibido =
                req.query.periodo;

            let periodo =
                null;

            if (
                periodoRecibido
            ) {
                periodo =
                    normalizarPeriodo(
                        periodoRecibido
                    );

                if (!periodo) {
                    return res
                        .status(400)
                        .json({
                            mensaje:
                                "El período debe tener formato YYYY-MM o YYYY-MM-DD"
                        });
                }
            }

            /*
             * =============================================
             * Esta consulta combina:
             *
             * - presupuestos configurados
             * - gastos reales por débito
             * - cuotas de crédito pagadas
             *
             * También muestra categorías que tengan gasto
             * aunque todavía no tengan presupuesto.
             * =============================================
             */

            const resultado =
                await pool.query(
                    `
                    WITH parametros AS (
                        SELECT
                            COALESCE(
                                $1::date,
                                date_trunc(
                                    'month',
                                    CURRENT_DATE
                                )::date
                            ) AS inicio_mes
                    ),

                    gastos_debito AS (
                        SELECT
                            COALESCE(
                                categoria,
                                'Otros'
                            ) AS categoria,

                            SUM(monto)
                                AS total

                        FROM transacciones,
                             parametros

                        WHERE tipo = 'gasto'

                        AND medio_pago = 'debito'

                        AND fecha >=
                            parametros.inicio_mes

                        AND fecha <
                            (
                                parametros.inicio_mes
                                +
                                INTERVAL '1 month'
                            )

                        GROUP BY
                            COALESCE(
                                categoria,
                                'Otros'
                            )
                    ),

                    gastos_cuotas AS (
                        SELECT
                            COALESCE(
                                t.categoria,
                                'Otros'
                            ) AS categoria,

                            SUM(c.monto)
                                AS total

                        FROM cuotas c

                        INNER JOIN transacciones t
                            ON t.id =
                               c.transaccion_id

                        CROSS JOIN parametros

                        WHERE c.pagada = true

                        AND c.fecha_vencimiento >=
                            parametros.inicio_mes

                        AND c.fecha_vencimiento <
                            (
                                parametros.inicio_mes
                                +
                                INTERVAL '1 month'
                            )

                        GROUP BY
                            COALESCE(
                                t.categoria,
                                'Otros'
                            )
                    ),

                    gastos AS (
                        SELECT
                            categoria,

                            SUM(total)
                                AS gastado

                        FROM (
                            SELECT *
                            FROM gastos_debito

                            UNION ALL

                            SELECT *
                            FROM gastos_cuotas
                        ) datos

                        GROUP BY categoria
                    ),

                    presupuestos_mes AS (
                        SELECT
                            p.id,
                            p.categoria,
                            p.monto,
                            p.periodo,
                            p.created_at,
                            p.updated_at

                        FROM presupuestos p

                        CROSS JOIN parametros

                        WHERE p.periodo =
                            parametros.inicio_mes
                    ),

                    categorias AS (
                        SELECT categoria
                        FROM presupuestos_mes

                        UNION

                        SELECT categoria
                        FROM gastos
                    )

                    SELECT
                        pm.id,

                        c.categoria,

                        COALESCE(
                            pm.monto,
                            0
                        ) AS presupuesto,

                        COALESCE(
                            g.gastado,
                            0
                        ) AS gastado,

                        (
                            COALESCE(
                                pm.monto,
                                0
                            )
                            -
                            COALESCE(
                                g.gastado,
                                0
                            )
                        ) AS disponible,

                        pm.periodo,

                        pm.created_at,

                        pm.updated_at

                    FROM categorias c

                    LEFT JOIN presupuestos_mes pm
                        ON pm.categoria =
                           c.categoria

                    LEFT JOIN gastos g
                        ON g.categoria =
                           c.categoria

                    ORDER BY
                        COALESCE(
                            g.gastado,
                            0
                        ) DESC,
                        c.categoria ASC
                    `,
                    [
                        periodo
                    ]
                );


            /*
             * =============================================
             * OBTENER PERÍODO REAL UTILIZADO
             * =============================================
             */

            const periodoResult =
                await pool.query(
                    `
                    SELECT
                        COALESCE(
                            $1::date,
                            date_trunc(
                                'month',
                                CURRENT_DATE
                            )::date
                        ) AS periodo
                    `,
                    [
                        periodo
                    ]
                );

            const periodoActual =
                periodoResult
                    .rows[0]
                    .periodo;


            /*
             * =============================================
             * FORMATEAR RESULTADOS
             * =============================================
             */

            const categorias =
                resultado.rows.map(
                    (fila) => {
                        const presupuesto =
                            Number(
                                fila.presupuesto
                            );

                        const gastado =
                            Number(
                                fila.gastado
                            );

                        const disponible =
                            presupuesto -
                            gastado;

                        const porcentaje =
                            presupuesto > 0
                                ? (
                                    gastado /
                                    presupuesto
                                ) * 100
                                : 0;

                        let estado =
                            "ok";

                        /*
                         * No existe presupuesto.
                         */

                        if (
                            !fila.id
                        ) {
                            estado =
                                "sin_presupuesto";
                        }

                        /*
                         * Presupuesto superado.
                         */

                        else if (
                            gastado >
                            presupuesto
                        ) {
                            estado =
                                "superado";
                        }

                        /*
                         * 80% o más.
                         */

                        else if (
                            porcentaje >= 80
                        ) {
                            estado =
                                "alerta";
                        }

                        return {
                            id:
                                fila.id,

                            categoria:
                                fila.categoria,

                            presupuesto,

                            gastado,

                            disponible,

                            porcentaje:
                                Number(
                                    porcentaje
                                        .toFixed(
                                            2
                                        )
                                ),

                            estado
                        };
                    }
                );


            /*
             * =============================================
             * TOTALES
             * =============================================
             */

            const totalPresupuestado =
                categorias.reduce(
                    (
                        total,
                        categoria
                    ) =>
                        total +
                        categoria
                            .presupuesto,
                    0
                );

            const totalGastado =
                categorias.reduce(
                    (
                        total,
                        categoria
                    ) =>
                        total +
                        categoria
                            .gastado,
                    0
                );

            const totalDisponible =
                totalPresupuestado -
                totalGastado;


            /*
             * =============================================
             * RESPUESTA
             * =============================================
             */

            res.json({
                periodo:
                    periodoActual,

                resumen: {
                    presupuestado:
                        totalPresupuestado,

                    gastado:
                        totalGastado,

                    disponible:
                        totalDisponible,

                    porcentaje:
                        totalPresupuestado >
                        0
                            ? Number(
                                (
                                    (
                                        totalGastado /
                                        totalPresupuestado
                                    ) *
                                    100
                                ).toFixed(
                                    2
                                )
                            )
                            : 0
                },

                categorias
            });

        } catch (error) {
            console.error(
                "Error al obtener presupuestos:",
                error
            );

            res
                .status(500)
                .json({
                    mensaje:
                        "Error al obtener presupuestos",

                    error:
                        error.message,

                    code:
                        error.code
                });
        }
    };


/*
 * =====================================================
 * GUARDAR / ACTUALIZAR PRESUPUESTO
 * =====================================================
 *
 * PUT
 *
 * /api/presupuestos
 *
 * BODY:
 *
 * {
 *     "categoria": "Alimentación",
 *     "monto": 250000,
 *     "periodo": "2026-08"
 * }
 *
 * Si ya existe:
 * actualiza.
 *
 * Si no existe:
 * crea.
 * =====================================================
 */

const guardarPresupuesto =
    async (req, res) => {
        const {
            categoria,
            monto,
            periodo
        } =
            req.body;

        /*
         * =============================================
         * VALIDAR CATEGORÍA
         * =============================================
         */

        if (
            !categoria ||
            !String(
                categoria
            ).trim()
        ) {
            return res
                .status(400)
                .json({
                    mensaje:
                        "La categoría es obligatoria"
                });
        }


        /*
         * =============================================
         * VALIDAR MONTO
         * =============================================
         */

        const montoNumero =
            Number(
                monto
            );

        if (
            !Number.isFinite(
                montoNumero
            ) ||
            montoNumero < 0
        ) {
            return res
                .status(400)
                .json({
                    mensaje:
                        "El presupuesto debe ser un monto válido mayor o igual a cero"
                });
        }


        /*
         * =============================================
         * VALIDAR PERÍODO
         * =============================================
         */

        const periodoNormalizado =
            normalizarPeriodo(
                periodo
            );

        if (
            periodo &&
            !periodoNormalizado
        ) {
            return res
                .status(400)
                .json({
                    mensaje:
                        "El período debe tener formato YYYY-MM o YYYY-MM-DD"
                });
        }


        try {
            /*
             * =========================================
             * UPSERT
             *
             * Si categoria + periodo ya existe:
             * UPDATE
             *
             * Si no existe:
             * INSERT
             * =========================================
             */

            const resultado =
                await pool.query(
                    `
                    INSERT INTO presupuestos (
                        categoria,
                        monto,
                        periodo
                    )

                    VALUES (
                        $1,
                        $2,
                        COALESCE(
                            $3::date,
                            date_trunc(
                                'month',
                                CURRENT_DATE
                            )::date
                        )
                    )

                    ON CONFLICT (
                        categoria,
                        periodo
                    )

                    DO UPDATE SET
                        monto =
                            EXCLUDED.monto,

                        updated_at =
                            CURRENT_TIMESTAMP

                    RETURNING *
                    `,
                    [
                        String(
                            categoria
                        ).trim(),

                        montoNumero,

                        periodoNormalizado
                    ]
                );

            res.json({
                mensaje:
                    "Presupuesto guardado correctamente",

                presupuesto: {
                    ...resultado
                        .rows[0],

                    monto:
                        Number(
                            resultado
                                .rows[0]
                                .monto
                        )
                }
            });

        } catch (error) {
            console.error(
                "Error al guardar presupuesto:",
                error
            );

            res
                .status(500)
                .json({
                    mensaje:
                        "Error al guardar presupuesto",

                    error:
                        error.message,

                    code:
                        error.code
                });
        }
    };


/*
 * =====================================================
 * ELIMINAR PRESUPUESTO
 * =====================================================
 *
 * DELETE
 *
 * /api/presupuestos/:id
 *
 * Elimina solamente el límite presupuestario.
 *
 * NO elimina movimientos.
 * NO elimina cuotas.
 * =====================================================
 */

const eliminarPresupuesto =
    async (req, res) => {
        const {
            id
        } =
            req.params;

        try {
            const resultado =
                await pool.query(
                    `
                    DELETE FROM presupuestos

                    WHERE id = $1

                    RETURNING *
                    `,
                    [
                        id
                    ]
                );

            if (
                resultado
                    .rows.length ===
                0
            ) {
                return res
                    .status(404)
                    .json({
                        mensaje:
                            "Presupuesto no encontrado"
                    });
            }

            res.json({
                mensaje:
                    "Presupuesto eliminado correctamente",

                presupuesto:
                    resultado.rows[0]
            });

        } catch (error) {
            console.error(
                "Error al eliminar presupuesto:",
                error
            );

            res
                .status(500)
                .json({
                    mensaje:
                        "Error al eliminar presupuesto",

                    error:
                        error.message,

                    code:
                        error.code
                });
        }
    };


/*
 * =====================================================
 * EXPORTACIONES
 * =====================================================
 */

module.exports = {
    obtenerPresupuestos,
    guardarPresupuesto,
    eliminarPresupuesto
};