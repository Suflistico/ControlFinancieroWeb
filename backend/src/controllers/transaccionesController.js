const pool = require("../config/db");

/*
 * =====================================================
 * FUNCIÓN AUXILIAR
 * GENERAR CUOTAS
 * =====================================================
 */

const generarCuotas = async (
    client,
    transaccionId,
    fecha,
    monto,
    numeroCuotas
) => {
    const montoTotal =
        Number(monto);

    const totalCuotas =
        Number(numeroCuotas);

    const montoBase =
        Math.floor(
            montoTotal /
            totalCuotas
        );

    const diferencia =
        montoTotal -
        (
            montoBase *
            totalCuotas
        );

    const cuotasCreadas = [];

    for (
        let numero = 1;
        numero <= totalCuotas;
        numero++
    ) {
        const montoCuota =
            numero === totalCuotas
                ? montoBase +
                  diferencia
                : montoBase;

        const resultado =
            await client.query(
                `
                INSERT INTO cuotas (
                    transaccion_id,
                    numero,
                    total_cuotas,
                    monto,
                    fecha_vencimiento,
                    pagada
                )
                VALUES (
                    $1::integer,
                    $2::integer,
                    $3::integer,
                    $4::numeric,
                    (
                        $5::date +
                        make_interval(
                            months =>
                                $2::integer
                        )
                    )::date,
                    false
                )
                RETURNING *
                `,
                [
                    transaccionId,
                    numero,
                    totalCuotas,
                    montoCuota,
                    fecha
                ]
            );

        cuotasCreadas.push(
            resultado.rows[0]
        );
    }

    return cuotasCreadas;
};


/*
 * =====================================================
 * OBTENER TODAS LAS TRANSACCIONES
 * =====================================================
 */

const obtenerTransacciones =
    async (req, res) => {
        try {
            const resultado =
                await pool.query(
                    `
                    SELECT
                        id,
                        fecha,
                        descripcion,
                        monto,
                        tipo,
                        medio_pago,
                        categoria,
                        numero_cuotas,
                        notas,
                        created_at
                    FROM transacciones
                    ORDER BY
                        fecha DESC,
                        id DESC
                    `
                );

            res.json(
                resultado.rows
            );

        } catch (error) {
            console.error(
                "Error al obtener transacciones:",
                error
            );

            res
                .status(500)
                .json({
                    mensaje:
                        "Error al obtener transacciones",

                    error:
                        error.message,

                    code:
                        error.code
                });
        }
    };


/*
 * =====================================================
 * OBTENER TRANSACCIÓN POR ID
 * =====================================================
 */

const obtenerTransaccionPorId =
    async (req, res) => {
        const { id } =
            req.params;

        try {
            const resultadoTransaccion =
                await pool.query(
                    `
                    SELECT *
                    FROM transacciones
                    WHERE id = $1
                    `,
                    [id]
                );

            if (
                resultadoTransaccion
                    .rows.length === 0
            ) {
                return res
                    .status(404)
                    .json({
                        mensaje:
                            "Transacción no encontrada"
                    });
            }

            const resultadoCuotas =
                await pool.query(
                    `
                    SELECT
                        id,
                        transaccion_id,
                        numero,
                        total_cuotas,
                        monto,
                        fecha_vencimiento,
                        pagada,
                        created_at
                    FROM cuotas
                    WHERE transaccion_id = $1
                    ORDER BY numero ASC
                    `,
                    [id]
                );

            res.json({
                transaccion:
                    resultadoTransaccion
                        .rows[0],

                cuotas:
                    resultadoCuotas.rows
            });

        } catch (error) {
            console.error(
                "Error al obtener detalle:",
                error
            );

            res
                .status(500)
                .json({
                    mensaje:
                        "Error al obtener detalle de la transacción",

                    error:
                        error.message
                });
        }
    };


/*
 * =====================================================
 * CREAR TRANSACCIÓN
 * =====================================================
 */

const crearTransaccion =
    async (req, res) => {
        const {
            fecha,
            descripcion,
            monto,
            tipo,
            medio_pago,
            categoria = "Otros",
            numero_cuotas = 1,
            notas = null
        } = req.body;

        if (
            !fecha ||
            !descripcion ||
            monto === undefined ||
            !tipo ||
            !medio_pago
        ) {
            return res
                .status(400)
                .json({
                    mensaje:
                        "Faltan campos obligatorios"
                });
        }

        const montoNumero =
            Number(monto);

        const cuotasNumero =
            Number(
                numero_cuotas
            );

        if (
            !Number.isFinite(
                montoNumero
            ) ||
            montoNumero <= 0
        ) {
            return res
                .status(400)
                .json({
                    mensaje:
                        "El monto debe ser mayor que cero"
                });
        }

        if (
            !Number.isInteger(
                cuotasNumero
            ) ||
            cuotasNumero < 1 ||
            cuotasNumero > 48
        ) {
            return res
                .status(400)
                .json({
                    mensaje:
                        "El número de cuotas debe estar entre 1 y 48"
                });
        }

        if (
            ![
                "gasto",
                "ingreso"
            ].includes(
                tipo
            )
        ) {
            return res
                .status(400)
                .json({
                    mensaje:
                        "Tipo de movimiento no válido"
                });
        }

        if (
            ![
                "debito",
                "credito",
                "transferencia"
            ].includes(
                medio_pago
            )
        ) {
            return res
                .status(400)
                .json({
                    mensaje:
                        "Medio de pago no válido"
                });
        }

        if (
            tipo === "ingreso" &&
            medio_pago ===
                "credito"
        ) {
            return res
                .status(400)
                .json({
                    mensaje:
                        "Un ingreso no puede registrarse como crédito"
                });
        }

        const client =
            await pool.connect();

        try {
            await client.query(
                "BEGIN"
            );

            const cuotasFinales =
                tipo === "gasto" &&
                medio_pago ===
                    "credito"
                    ? cuotasNumero
                    : 1;

            const resultado =
                await client.query(
                    `
                    INSERT INTO transacciones (
                        fecha,
                        descripcion,
                        monto,
                        tipo,
                        medio_pago,
                        categoria,
                        numero_cuotas,
                        notas
                    )
                    VALUES (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6,
                        $7,
                        $8
                    )
                    RETURNING *
                    `,
                    [
                        fecha,
                        descripcion.trim(),
                        montoNumero,
                        tipo,
                        medio_pago,
                        categoria,
                        cuotasFinales,
                        notas || null
                    ]
                );

            const transaccion =
                resultado.rows[0];

            let cuotas = [];

            if (
                tipo === "gasto" &&
                medio_pago ===
                    "credito"
            ) {
                cuotas =
                    await generarCuotas(
                        client,
                        transaccion.id,
                        fecha,
                        montoNumero,
                        cuotasNumero
                    );
            }

            await client.query(
                "COMMIT"
            );

            res
                .status(201)
                .json({
                    mensaje:
                        "Transacción creada correctamente",

                    transaccion,

                    cuotas
                });

        } catch (error) {
            await client.query(
                "ROLLBACK"
            );

            console.error(
                "Error al crear transacción:",
                error
            );

            res
                .status(500)
                .json({
                    mensaje:
                        "Error al crear transacción",

                    error:
                        error.message,

                    code:
                        error.code
                });

        } finally {
            client.release();
        }
    };


/*
 * =====================================================
 * ACTUALIZAR TRANSACCIÓN
 * =====================================================
 */

const actualizarTransaccion =
    async (req, res) => {
        const { id } =
            req.params;

        const client =
            await pool.connect();

        try {
            await client.query(
                "BEGIN"
            );

            const resultadoActual =
                await client.query(
                    `
                    SELECT *
                    FROM transacciones
                    WHERE id = $1
                    FOR UPDATE
                    `,
                    [id]
                );

            if (
                resultadoActual
                    .rows.length === 0
            ) {
                await client.query(
                    "ROLLBACK"
                );

                return res
                    .status(404)
                    .json({
                        mensaje:
                            "Transacción no encontrada"
                    });
            }

            const actual =
                resultadoActual.rows[0];

            const descripcion =
                req.body.descripcion ??
                actual.descripcion;

            const fecha =
                req.body.fecha ??
                String(
                    actual.fecha
                ).slice(
                    0,
                    10
                );

            const monto =
                req.body.monto ??
                actual.monto;

            const tipo =
                req.body.tipo ??
                actual.tipo;

            const medioPago =
                req.body.medio_pago ??
                actual.medio_pago;

            const categoria =
                req.body.categoria ??
                actual.categoria;

            const numeroCuotas =
                req.body.numero_cuotas ??
                actual.numero_cuotas;

            const notas =
                req.body.notas ??
                actual.notas;

            const montoNumero =
                Number(
                    monto
                );

            const cuotasNumero =
                Number(
                    numeroCuotas
                );

            if (
                !descripcion ||
                !String(
                    descripcion
                ).trim()
            ) {
                await client.query(
                    "ROLLBACK"
                );

                return res
                    .status(400)
                    .json({
                        mensaje:
                            "La descripción es obligatoria"
                    });
            }

            if (!fecha) {
                await client.query(
                    "ROLLBACK"
                );

                return res
                    .status(400)
                    .json({
                        mensaje:
                            "La fecha es obligatoria"
                    });
            }

            if (
                !Number.isFinite(
                    montoNumero
                ) ||
                montoNumero <= 0
            ) {
                await client.query(
                    "ROLLBACK"
                );

                return res
                    .status(400)
                    .json({
                        mensaje:
                            "El monto debe ser mayor que cero"
                    });
            }

            if (
                ![
                    "gasto",
                    "ingreso"
                ].includes(
                    tipo
                )
            ) {
                await client.query(
                    "ROLLBACK"
                );

                return res
                    .status(400)
                    .json({
                        mensaje:
                            "Tipo de movimiento no válido"
                    });
            }

            if (
                ![
                    "debito",
                    "credito",
                    "transferencia"
                ].includes(
                    medioPago
                )
            ) {
                await client.query(
                    "ROLLBACK"
                );

                return res
                    .status(400)
                    .json({
                        mensaje:
                            "Medio de pago no válido"
                    });
            }

            if (
                tipo === "ingreso" &&
                medioPago ===
                    "credito"
            ) {
                await client.query(
                    "ROLLBACK"
                );

                return res
                    .status(400)
                    .json({
                        mensaje:
                            "Un ingreso no puede utilizar crédito"
                    });
            }

            if (
                !Number.isInteger(
                    cuotasNumero
                ) ||
                cuotasNumero < 1 ||
                cuotasNumero > 48
            ) {
                await client.query(
                    "ROLLBACK"
                );

                return res
                    .status(400)
                    .json({
                        mensaje:
                            "El número de cuotas debe estar entre 1 y 48"
                    });
            }

            const eraCredito =
                actual.tipo ===
                    "gasto" &&
                actual.medio_pago ===
                    "credito";

            const resultadoCuotas =
                await client.query(
                    `
                    SELECT *
                    FROM cuotas
                    WHERE transaccion_id = $1
                    ORDER BY numero ASC
                    FOR UPDATE
                    `,
                    [id]
                );

            const cuotasActuales =
                resultadoCuotas.rows;

            const cuotasPagadas =
                cuotasActuales.filter(
                    (cuota) =>
                        cuota.pagada ===
                        true
                );

            const tieneCuotasPagadas =
                cuotasPagadas.length >
                0;

            if (
                eraCredito &&
                tieneCuotasPagadas
            ) {
                const fechaActual =
                    String(
                        actual.fecha
                    ).slice(
                        0,
                        10
                    );

                const cambioMonto =
                    Number(
                        actual.monto
                    ) !==
                    montoNumero;

                const cambioFecha =
                    fechaActual !==
                    fecha;

                const cambioCuotas =
                    Number(
                        actual.numero_cuotas
                    ) !==
                    cuotasNumero;

                const cambioTipo =
                    actual.tipo !==
                    tipo;

                const cambioMedioPago =
                    actual.medio_pago !==
                    medioPago;

                if (
                    cambioMonto ||
                    cambioFecha ||
                    cambioCuotas ||
                    cambioTipo ||
                    cambioMedioPago
                ) {
                    await client.query(
                        "ROLLBACK"
                    );

                    return res
                        .status(409)
                        .json({
                            mensaje:
                                "Esta compra tiene cuotas pagadas. Por seguridad solo puedes modificar descripción, categoría y notas.",

                            cuotas_pagadas:
                                cuotasPagadas.length,

                            total_cuotas:
                                cuotasActuales.length
                        });
                }

                const resultado =
                    await client.query(
                        `
                        UPDATE transacciones
                        SET
                            descripcion = $1,
                            categoria = $2,
                            notas = $3
                        WHERE id = $4
                        RETURNING *
                        `,
                        [
                            String(
                                descripcion
                            ).trim(),

                            categoria,

                            notas || null,

                            id
                        ]
                    );

                await client.query(
                    "COMMIT"
                );

                return res.json({
                    mensaje:
                        "Movimiento actualizado correctamente. Las cuotas pagadas fueron protegidas.",

                    transaccion:
                        resultado.rows[0],

                    cuotas:
                        cuotasActuales
                });
            }

            const seraCredito =
                tipo === "gasto" &&
                medioPago ===
                    "credito";

            const cuotasFinales =
                seraCredito
                    ? cuotasNumero
                    : 1;

            const resultadoActualizado =
                await client.query(
                    `
                    UPDATE transacciones
                    SET
                        fecha = $1,
                        descripcion = $2,
                        monto = $3,
                        tipo = $4,
                        medio_pago = $5,
                        categoria = $6,
                        numero_cuotas = $7,
                        notas = $8
                    WHERE id = $9
                    RETURNING *
                    `,
                    [
                        fecha,
                        String(
                            descripcion
                        ).trim(),
                        montoNumero,
                        tipo,
                        medioPago,
                        categoria,
                        cuotasFinales,
                        notas || null,
                        id
                    ]
                );

            await client.query(
                `
                DELETE FROM cuotas
                WHERE transaccion_id = $1
                `,
                [id]
            );

            let nuevasCuotas = [];

            if (seraCredito) {
                nuevasCuotas =
                    await generarCuotas(
                        client,
                        id,
                        fecha,
                        montoNumero,
                        cuotasNumero
                    );
            }

            await client.query(
                "COMMIT"
            );

            return res.json({
                mensaje:
                    seraCredito
                        ? "Movimiento actualizado y cuotas recalculadas correctamente."
                        : "Movimiento actualizado correctamente.",

                transaccion:
                    resultadoActualizado
                        .rows[0],

                cuotas:
                    nuevasCuotas
            });

        } catch (error) {
            try {
                await client.query(
                    "ROLLBACK"
                );
            } catch (
                rollbackError
            ) {
                console.error(
                    "Error durante rollback:",
                    rollbackError
                );
            }

            console.error(
                "Error al actualizar transacción:",
                error
            );

            res
                .status(500)
                .json({
                    mensaje:
                        "Error al actualizar la transacción",

                    error:
                        error.message,

                    code:
                        error.code
                });

        } finally {
            client.release();
        }
    };


/*
 * =====================================================
 * ELIMINAR TRANSACCIÓN
 * =====================================================
 */

const eliminarTransaccion =
    async (req, res) => {
        const { id } =
            req.params;

        const client =
            await pool.connect();

        try {
            await client.query(
                "BEGIN"
            );

            /*
             * Obtenemos la transacción
             * y la bloqueamos.
             */

            const resultadoTransaccion =
                await client.query(
                    `
                    SELECT *
                    FROM transacciones
                    WHERE id = $1
                    FOR UPDATE
                    `,
                    [id]
                );

            if (
                resultadoTransaccion
                    .rows.length === 0
            ) {
                await client.query(
                    "ROLLBACK"
                );

                return res
                    .status(404)
                    .json({
                        mensaje:
                            "Transacción no encontrada"
                    });
            }

            const transaccion =
                resultadoTransaccion
                    .rows[0];

            /*
             * Revisamos las cuotas.
             */

            const resultadoCuotas =
                await client.query(
                    `
                    SELECT *
                    FROM cuotas
                    WHERE transaccion_id = $1
                    ORDER BY numero
                    FOR UPDATE
                    `,
                    [id]
                );

            const cuotas =
                resultadoCuotas.rows;

            const cuotasPagadas =
                cuotas.filter(
                    (cuota) =>
                        cuota.pagada ===
                        true
                );

            /*
             * El frontend enviará
             * confirmar_historial = true
             * cuando el usuario haya
             * realizado la confirmación
             * reforzada.
             */

            const confirmarHistorial =
                req.body
                    ?.confirmar_historial ===
                true;

            /*
             * Si hay cuotas pagadas,
             * exigimos confirmación
             * reforzada.
             */

            if (
                cuotasPagadas.length >
                    0 &&
                !confirmarHistorial
            ) {
                await client.query(
                    "ROLLBACK"
                );

                return res
                    .status(409)
                    .json({
                        mensaje:
                            "Este movimiento tiene cuotas pagadas. Eliminarlo modificará el historial financiero y el saldo disponible.",

                        requiere_confirmacion:
                            true,

                        cuotas_pagadas:
                            cuotasPagadas.length,

                        total_cuotas:
                            cuotas.length
                    });
            }

            /*
             * Borramos cuotas primero.
             *
             * Aunque tengas ON DELETE
             * CASCADE, hacerlo explícito
             * mantiene clara la lógica.
             */

            await client.query(
                `
                DELETE FROM cuotas
                WHERE transaccion_id = $1
                `,
                [id]
            );

            /*
             * Borramos la transacción.
             */

            await client.query(
                `
                DELETE FROM transacciones
                WHERE id = $1
                `,
                [id]
            );

            await client.query(
                "COMMIT"
            );

            res.json({
                mensaje:
                    "Movimiento eliminado correctamente",

                eliminado: {
                    id:
                        transaccion.id,

                    descripcion:
                        transaccion
                            .descripcion,

                    tipo:
                        transaccion.tipo,

                    medio_pago:
                        transaccion
                            .medio_pago,

                    cuotas_eliminadas:
                        cuotas.length,

                    cuotas_pagadas_eliminadas:
                        cuotasPagadas.length
                }
            });

        } catch (error) {
            try {
                await client.query(
                    "ROLLBACK"
                );
            } catch (
                rollbackError
            ) {
                console.error(
                    "Error durante rollback:",
                    rollbackError
                );
            }

            console.error(
                "Error al eliminar transacción:",
                error
            );

            res
                .status(500)
                .json({
                    mensaje:
                        "Error al eliminar la transacción",

                    error:
                        error.message,

                    code:
                        error.code
                });

        } finally {
            client.release();
        }
    };


/*
 * =====================================================
 * EXPORTACIONES
 * =====================================================
 */

module.exports = {
    obtenerTransacciones,
    obtenerTransaccionPorId,
    crearTransaccion,
    actualizarTransaccion,
    eliminarTransaccion
};