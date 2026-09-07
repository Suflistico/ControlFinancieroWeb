const pool = require("../config/db");


/*
 * =====================================================
 * OBTENER TODAS LAS CUOTAS
 * =====================================================
 *
 * Este endpoint permite que el historial conozca
 * cuáles cuotas fueron realmente pagadas y en qué fecha.
 *
 * La fecha importante para un pago es fecha_pago,
 * NO fecha_vencimiento.
 * =====================================================
 */

const obtenerCuotas =
    async (req, res) => {
        try {
            const resultado =
                await pool.query(`
                    SELECT
                        c.id,
                        c.transaccion_id,
                        c.numero,
                        c.total_cuotas,
                        c.monto,
                        c.fecha_vencimiento,
                        c.pagada,
                        c.fecha_pago,
                        c.created_at,

                        t.fecha
                            AS fecha_transaccion,

                        t.descripcion,

                        t.categoria,

                        t.tipo,

                        t.medio_pago

                    FROM cuotas c

                    INNER JOIN transacciones t
                        ON t.id =
                           c.transaccion_id

                    ORDER BY
                        c.id ASC
                `);


            res.json(
                resultado.rows
            );

        } catch (error) {
            console.error(
                "Error al obtener cuotas:",
                error
            );


            res
                .status(500)
                .json({
                    mensaje:
                        "Error al obtener las cuotas",

                    error:
                        error.message,

                    code:
                        error.code
                });
        }
    };


/*
 * =====================================================
 * ACTUALIZAR ESTADO DE UNA CUOTA
 * =====================================================
 *
 * REGLA:
 *
 * pagada = true
 *      -> fecha_pago = CURRENT_DATE
 *
 * pagada = false
 *      -> fecha_pago = NULL
 *
 * La fecha de vencimiento nunca determina
 * si el dinero salió o no.
 * =====================================================
 */

const actualizarEstadoCuota =
    async (req, res) => {
        const {
            id
        } =
            req.params;


        const {
            pagada
        } =
            req.body;


        if (
            typeof pagada !==
            "boolean"
        ) {
            return res
                .status(400)
                .json({
                    mensaje:
                        "El campo pagada debe ser true o false"
                });
        }


        try {
            const resultado =
                await pool.query(
                    `
                    UPDATE cuotas

                    SET
                        pagada = $1,

                        fecha_pago =
                            CASE
                                WHEN $1 = true
                                THEN CURRENT_DATE
                                ELSE NULL
                            END

                    WHERE id = $2

                    RETURNING
                        id,
                        transaccion_id,
                        numero,
                        total_cuotas,
                        monto,
                        fecha_vencimiento,
                        pagada,
                        fecha_pago,
                        created_at
                    `,
                    [
                        pagada,
                        id
                    ]
                );


            if (
                resultado
                    .rows
                    .length ===
                0
            ) {
                return res
                    .status(404)
                    .json({
                        mensaje:
                            "Cuota no encontrada"
                    });
            }


            res.json({
                mensaje:
                    pagada
                        ? "Cuota marcada como pagada"
                        : "Cuota marcada como pendiente",

                cuota:
                    resultado.rows[0]
            });

        } catch (error) {
            console.error(
                "Error al actualizar cuota:",
                error
            );


            res
                .status(500)
                .json({
                    mensaje:
                        "Error al actualizar la cuota",

                    error:
                        error.message,

                    code:
                        error.code
                });
        }
    };


module.exports = {
    obtenerCuotas,
    actualizarEstadoCuota
};