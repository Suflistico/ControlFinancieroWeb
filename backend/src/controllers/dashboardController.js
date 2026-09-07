const pool = require("../config/db");


/*
 * =====================================================
 * NORMALIZAR PERÍODO
 * =====================================================
 *
 * La fecha del movimiento se utiliza para:
 *
 * - Historial
 * - Reportes
 * - Presupuestos
 * - Análisis mensual
 *
 * NO se utiliza para decidir si una transacción
 * afecta o no el saldo disponible actual.
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


    if (
        /^\d{4}-\d{2}$/.test(
            texto
        )
    ) {
        return `${texto}-01`;
    }


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
 * OBTENER DASHBOARD
 * =====================================================
 */

const obtenerDashboard =
    async (req, res) => {
        try {
            /*
             * =============================================
             * PERÍODO DE ANÁLISIS
             * =============================================
             */

            const periodoRecibido =
                req.query.periodo;


            let periodoNormalizado =
                null;


            if (
                periodoRecibido
            ) {
                periodoNormalizado =
                    normalizarPeriodo(
                        periodoRecibido
                    );


                if (
                    !periodoNormalizado
                ) {
                    return res
                        .status(400)
                        .json({
                            mensaje:
                                "El período debe tener formato YYYY-MM o YYYY-MM-DD"
                        });
                }
            }


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
                        ) AS inicio_mes
                    `,
                    [
                        periodoNormalizado
                    ]
                );


            const inicioMes =
                periodoResult
                    .rows[0]
                    .inicio_mes;


            /*
             * =============================================
             * CONFIGURACIÓN FINANCIERA
             * =============================================
             *
             * saldo_inicial:
             *
             * Es la base desde donde comienza
             * el dinero disponible.
             *
             * fecha_inicio:
             *
             * Se conserva como información de
             * configuración, pero NO limita
             * movimientos registrados.
             * =============================================
             */

            const configuracionResult =
                await pool.query(
                    `
                    SELECT
                        saldo_inicial,
                        fecha_inicio

                    FROM configuracion_financiera

                    ORDER BY id

                    LIMIT 1
                    `
                );


            const configuracion =
                configuracionResult
                    .rows[0] || {
                    saldo_inicial:
                        0,

                    fecha_inicio:
                        null
                };


            const saldoInicial =
                Number(
                    configuracion
                        .saldo_inicial ||
                    0
                );


            /*
             * =============================================
             * MOVIMIENTOS ACUMULADOS
             * =============================================
             *
             * REGLA PRINCIPAL:
             *
             * Toda transacción registrada afecta
             * inmediatamente el saldo.
             *
             * NO importa:
             *
             * - Si tiene fecha anterior
             * - Si tiene fecha actual
             * - Si tiene fecha futura
             *
             * La fecha es información administrativa
             * y sirve para reportes mensuales.
             *
             * INGRESO:
             * suma al saldo.
             *
             * DÉBITO:
             * resta del saldo.
             *
             * CRÉDITO:
             * la compra NO resta directamente.
             * Solamente restan las cuotas pagadas.
             * =============================================
             */

            const movimientosAcumuladosResult =
                await pool.query(
                    `
                    SELECT

                        COALESCE(
                            SUM(
                                CASE

                                    WHEN tipo = 'ingreso'
                                    THEN monto

                                    ELSE 0

                                END
                            ),
                            0
                        ) AS ingresos_acumulados,


                        COALESCE(
                            SUM(
                                CASE

                                    WHEN tipo = 'gasto'
                                    AND medio_pago = 'debito'
                                    THEN monto

                                    ELSE 0

                                END
                            ),
                            0
                        ) AS debito_acumulado

                    FROM transacciones
                    `
                );


            /*
             * =============================================
             * CUOTAS PAGADAS ACUMULADAS
             * =============================================
             *
             * Toda cuota marcada como pagada
             * afecta inmediatamente el saldo,
             * independientemente de su
             * fecha de vencimiento.
             *
             * Esto permite pago anticipado.
             * =============================================
             */

            const cuotasPagadasResult =
                await pool.query(
                    `
                    SELECT
                        COALESCE(
                            SUM(monto),
                            0
                        ) AS cuotas_pagadas

                    FROM cuotas

                    WHERE pagada = true
                    `
                );


            /*
             * =============================================
             * CRÉDITO PENDIENTE ACTUAL
             * =============================================
             */

            const creditoPendienteResult =
                await pool.query(
                    `
                    SELECT
                        COALESCE(
                            SUM(monto),
                            0
                        ) AS credito_pendiente

                    FROM cuotas

                    WHERE pagada = false
                    `
                );


            /*
             * =============================================
             * PRÓXIMA CUOTA
             * =============================================
             *
             * La fecha de vencimiento se utiliza
             * solamente para ordenar visualmente
             * las cuotas pendientes.
             * =============================================
             */

            const proximaCuotaResult =
                await pool.query(
                    `
                    SELECT
                        c.id,
                        c.transaccion_id,
                        c.numero,
                        c.total_cuotas,
                        c.monto,
                        c.fecha_vencimiento,

                        t.descripcion,
                        t.categoria

                    FROM cuotas c

                    INNER JOIN transacciones t
                        ON t.id =
                           c.transaccion_id

                    WHERE c.pagada = false

                    ORDER BY
                        c.fecha_vencimiento ASC,
                        c.numero ASC,
                        c.id ASC

                    LIMIT 1
                    `
                );


            /*
             * =============================================
             * MOVIMIENTOS DEL PERÍODO
             * =============================================
             *
             * AQUÍ SÍ utilizamos la fecha.
             *
             * Esto no modifica el saldo disponible.
             *
             * Sirve únicamente para responder:
             *
             * "¿Qué ocurrió durante agosto?"
             * "¿Qué ocurrió durante septiembre?"
             * etc.
             * =============================================
             */

            const resumenMesResult =
                await pool.query(
                    `
                    SELECT

                        COALESCE(
                            SUM(
                                CASE

                                    WHEN tipo = 'ingreso'
                                    THEN monto

                                    ELSE 0

                                END
                            ),
                            0
                        ) AS ingresos_mes,


                        COALESCE(
                            SUM(
                                CASE

                                    WHEN tipo = 'gasto'
                                    AND medio_pago = 'debito'
                                    THEN monto

                                    ELSE 0

                                END
                            ),
                            0
                        ) AS debito_mes,


                        COALESCE(
                            SUM(
                                CASE

                                    WHEN tipo = 'gasto'
                                    AND medio_pago = 'credito'
                                    THEN monto

                                    ELSE 0

                                END
                            ),
                            0
                        ) AS credito_mes,


                        COUNT(
                            CASE

                                WHEN tipo = 'ingreso'
                                THEN 1

                            END
                        ) AS cantidad_ingresos,


                        COUNT(
                            CASE

                                WHEN tipo = 'gasto'
                                THEN 1

                            END
                        ) AS cantidad_gastos


                    FROM transacciones


                    WHERE fecha >=
                        $1::date


                    AND fecha <
                        (
                            $1::date
                            +
                            INTERVAL '1 month'
                        )
                    `,
                    [
                        inicioMes
                    ]
                );


            /*
             * =============================================
             * CUOTAS PAGADAS DEL PERÍODO
             * =============================================
             *
             * IMPORTANTE:
             *
             * Aquí utilizamos fecha_pago.
             *
             * NO fecha_vencimiento.
             *
             * Ejemplo:
             *
             * Cuota vence en octubre.
             *
             * Usuario la paga en agosto.
             *
             * El gasto real pertenece a agosto.
             * =============================================
             */

            const cuotasPagadasMesResult =
                await pool.query(
                    `
                    SELECT

                        COALESCE(
                            SUM(monto),
                            0
                        ) AS cuotas_pagadas_mes,


                        COUNT(*)
                            AS cantidad_cuotas_pagadas


                    FROM cuotas


                    WHERE pagada = true


                    AND fecha_pago >=
                        $1::date


                    AND fecha_pago <
                        (
                            $1::date
                            +
                            INTERVAL '1 month'
                        )
                    `,
                    [
                        inicioMes
                    ]
                );


            /*
             * =============================================
             * GASTOS REALES POR CATEGORÍA
             * =============================================
             *
             * Gasto real =
             *
             * Débito
             * +
             * cuotas pagadas
             *
             * Las compras de crédito completas
             * NO se consideran salida de caja.
             * =============================================
             */

            const gastosCategoriaResult =
                await pool.query(
                    `
                    WITH gastos_reales AS (

                        /*
                         * DÉBITO
                         */

                        SELECT
                            COALESCE(
                                categoria,
                                'Otros'
                            ) AS categoria,

                            monto

                        FROM transacciones

                        WHERE tipo = 'gasto'

                        AND medio_pago = 'debito'

                        AND fecha >=
                            $1::date

                        AND fecha <
                            (
                                $1::date
                                +
                                INTERVAL '1 month'
                            )


                        UNION ALL


                        /*
                         * CUOTAS PAGADAS
                         */

                        SELECT
                            COALESCE(
                                t.categoria,
                                'Otros'
                            ) AS categoria,

                            c.monto

                        FROM cuotas c

                        INNER JOIN transacciones t
                            ON t.id =
                               c.transaccion_id

                        WHERE c.pagada = true

                        AND c.fecha_pago >=
                            $1::date

                        AND c.fecha_pago <
                            (
                                $1::date
                                +
                                INTERVAL '1 month'
                            )
                    )


                    SELECT
                        categoria,

                        COALESCE(
                            SUM(monto),
                            0
                        ) AS total,

                        COUNT(*)
                            AS cantidad

                    FROM gastos_reales

                    GROUP BY categoria

                    ORDER BY
                        total DESC,
                        categoria ASC
                    `,
                    [
                        inicioMes
                    ]
                );


            /*
             * =============================================
             * EVOLUCIÓN ÚLTIMOS 6 MESES
             * =============================================
             */

            const evolucionMensualResult =
                await pool.query(
                    `
                    WITH meses AS (

                        SELECT
                            generate_series(
                                $1::date
                                -
                                INTERVAL '5 months',

                                $1::date,

                                INTERVAL '1 month'
                            ) AS inicio_mes
                    ),


                    movimientos AS (

                        SELECT

                            date_trunc(
                                'month',
                                fecha
                            ) AS inicio_mes,


                            COALESCE(
                                SUM(
                                    CASE

                                        WHEN tipo = 'ingreso'
                                        THEN monto

                                        ELSE 0

                                    END
                                ),
                                0
                            ) AS ingresos,


                            COALESCE(
                                SUM(
                                    CASE

                                        WHEN tipo = 'gasto'
                                        AND medio_pago = 'debito'
                                        THEN monto

                                        ELSE 0

                                    END
                                ),
                                0
                            ) AS debito


                        FROM transacciones


                        WHERE fecha >=
                            (
                                $1::date
                                -
                                INTERVAL '5 months'
                            )


                        AND fecha <
                            (
                                $1::date
                                +
                                INTERVAL '1 month'
                            )


                        GROUP BY
                            date_trunc(
                                'month',
                                fecha
                            )
                    ),


                    pagos_credito AS (

                        SELECT

                            date_trunc(
                                'month',
                                fecha_pago
                            ) AS inicio_mes,


                            COALESCE(
                                SUM(monto),
                                0
                            ) AS cuotas_pagadas


                        FROM cuotas


                        WHERE pagada = true


                        AND fecha_pago IS NOT NULL


                        AND fecha_pago >=
                            (
                                $1::date
                                -
                                INTERVAL '5 months'
                            )


                        AND fecha_pago <
                            (
                                $1::date
                                +
                                INTERVAL '1 month'
                            )


                        GROUP BY
                            date_trunc(
                                'month',
                                fecha_pago
                            )
                    )


                    SELECT

                        TO_CHAR(
                            m.inicio_mes,
                            'YYYY-MM'
                        ) AS periodo,


                        EXTRACT(
                            YEAR
                            FROM m.inicio_mes
                        )::integer AS anio,


                        EXTRACT(
                            MONTH
                            FROM m.inicio_mes
                        )::integer AS mes,


                        COALESCE(
                            mov.ingresos,
                            0
                        ) AS ingresos,


                        COALESCE(
                            mov.debito,
                            0
                        ) AS debito,


                        COALESCE(
                            pc.cuotas_pagadas,
                            0
                        ) AS cuotas_pagadas,


                        (
                            COALESCE(
                                mov.debito,
                                0
                            )
                            +
                            COALESCE(
                                pc.cuotas_pagadas,
                                0
                            )
                        ) AS egresos,


                        (
                            COALESCE(
                                mov.ingresos,
                                0
                            )
                            -
                            COALESCE(
                                mov.debito,
                                0
                            )
                            -
                            COALESCE(
                                pc.cuotas_pagadas,
                                0
                            )
                        ) AS resultado


                    FROM meses m


                    LEFT JOIN movimientos mov
                        ON mov.inicio_mes =
                           m.inicio_mes


                    LEFT JOIN pagos_credito pc
                        ON pc.inicio_mes =
                           m.inicio_mes


                    ORDER BY
                        m.inicio_mes ASC
                    `,
                    [
                        inicioMes
                    ]
                );


            /*
             * =============================================
             * CONVERSIONES
             * =============================================
             */

            const ingresosAcumulados =
                Number(
                    movimientosAcumuladosResult
                        .rows[0]
                        .ingresos_acumulados ||
                    0
                );


            const debitoAcumulado =
                Number(
                    movimientosAcumuladosResult
                        .rows[0]
                        .debito_acumulado ||
                    0
                );


            const cuotasPagadas =
                Number(
                    cuotasPagadasResult
                        .rows[0]
                        .cuotas_pagadas ||
                    0
                );


            const creditoPendiente =
                Number(
                    creditoPendienteResult
                        .rows[0]
                        .credito_pendiente ||
                    0
                );


            const ingresosMes =
                Number(
                    resumenMesResult
                        .rows[0]
                        .ingresos_mes ||
                    0
                );


            const debitoMes =
                Number(
                    resumenMesResult
                        .rows[0]
                        .debito_mes ||
                    0
                );


            const creditoMes =
                Number(
                    resumenMesResult
                        .rows[0]
                        .credito_mes ||
                    0
                );


            const cuotasPagadasMes =
                Number(
                    cuotasPagadasMesResult
                        .rows[0]
                        .cuotas_pagadas_mes ||
                    0
                );


            /*
             * =============================================
             * SALDO DISPONIBLE REAL
             * =============================================
             *
             * ÚNICA FÓRMULA OFICIAL:
             *
             * saldo inicial
             * +
             * todos los ingresos registrados
             * -
             * todos los débitos registrados
             * -
             * todas las cuotas pagadas
             *
             * LA FECHA NO INTERVIENE.
             * =============================================
             */

            const saldoDisponible =
                saldoInicial
                +
                ingresosAcumulados
                -
                debitoAcumulado
                -
                cuotasPagadas;


            /*
             * =============================================
             * RESULTADO DEL PERÍODO
             * =============================================
             */

            const egresosMes =
                debitoMes
                +
                cuotasPagadasMes;


            const resultadoMes =
                ingresosMes
                -
                egresosMes;


            /*
             * =============================================
             * FORMATEAR CATEGORÍAS
             * =============================================
             */

            const gastosPorCategoria =
                gastosCategoriaResult
                    .rows
                    .map(
                        (
                            fila
                        ) => ({
                            categoria:
                                fila.categoria,

                            total:
                                Number(
                                    fila.total ||
                                    0
                                ),

                            cantidad:
                                Number(
                                    fila.cantidad ||
                                    0
                                )
                        })
                    );


            /*
             * =============================================
             * FORMATEAR EVOLUCIÓN
             * =============================================
             */

            const evolucionMensual =
                evolucionMensualResult
                    .rows
                    .map(
                        (
                            fila
                        ) => ({
                            periodo:
                                fila.periodo,

                            anio:
                                Number(
                                    fila.anio
                                ),

                            mes:
                                Number(
                                    fila.mes
                                ),

                            ingresos:
                                Number(
                                    fila.ingresos ||
                                    0
                                ),

                            debito:
                                Number(
                                    fila.debito ||
                                    0
                                ),

                            cuotas_pagadas:
                                Number(
                                    fila.cuotas_pagadas ||
                                    0
                                ),

                            egresos:
                                Number(
                                    fila.egresos ||
                                    0
                                ),

                            resultado:
                                Number(
                                    fila.resultado ||
                                    0
                                )
                        })
                    );


            /*
             * =============================================
             * RESPUESTA
             * =============================================
             */

            return res.json({
                /*
                 * Período visual
                 */

                periodo:
                    String(
                        inicioMes
                    ).slice(
                        0,
                        10
                    ),


                /*
                 * Configuración
                 */

                saldo_inicial:
                    saldoInicial,

                fecha_inicio:
                    configuracion
                        .fecha_inicio || null,


                /*
                 * Posición financiera actual
                 */

                ingresos_acumulados:
                    ingresosAcumulados,

                debito_acumulado:
                    debitoAcumulado,

                cuotas_pagadas:
                    cuotasPagadas,

                saldo_disponible:
                    saldoDisponible,

                credito_pendiente:
                    creditoPendiente,


                /*
                 * Período seleccionado
                 */

                ingresos_mes:
                    ingresosMes,

                debito_mes:
                    debitoMes,

                credito_mes:
                    creditoMes,

                cuotas_pagadas_mes:
                    cuotasPagadasMes,

                egresos_mes:
                    egresosMes,

                resultado_mes:
                    resultadoMes,


                /*
                 * Cantidades
                 */

                cantidad_ingresos_mes:
                    Number(
                        resumenMesResult
                            .rows[0]
                            .cantidad_ingresos ||
                        0
                    ),

                cantidad_gastos_mes:
                    Number(
                        resumenMesResult
                            .rows[0]
                            .cantidad_gastos ||
                        0
                    ),

                cantidad_cuotas_pagadas_mes:
                    Number(
                        cuotasPagadasMesResult
                            .rows[0]
                            .cantidad_cuotas_pagadas ||
                        0
                    ),


                /*
                 * Crédito
                 */

                proxima_cuota:
                    proximaCuotaResult
                        .rows[0] ||
                    null,


                /*
                 * Análisis
                 */

                gastos_por_categoria:
                    gastosPorCategoria,

                evolucion_mensual:
                    evolucionMensual
            });


        } catch (error) {
            console.error(
                "Error al obtener dashboard:",
                error
            );


            return res
                .status(500)
                .json({
                    mensaje:
                        "Error al obtener dashboard",

                    error:
                        error.message,

                    code:
                        error.code
                });
        }
    };


module.exports = {
    obtenerDashboard
};