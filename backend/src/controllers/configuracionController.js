const pool = require("../config/db");


/*
 * =========================================
 * OBTENER CONFIGURACIÓN
 * =========================================
 */

const obtenerConfiguracion =
  async (
    req,
    res
  ) => {

    try {

      const resultado =
        await pool.query(`
          SELECT
            id,
            saldo_inicial,
            fecha_inicio,
            created_at
          FROM configuracion_financiera
          ORDER BY id
          LIMIT 1
        `);


      res.json(
        resultado.rows[0] ||
        null
      );

    } catch (error) {

      console.error(
        "Error al obtener configuración:",
        error
      );


      res.status(500).json({
        mensaje:
          "Error al obtener configuración",

        error:
          error.message
      });
    }
  };


/*
 * =========================================
 * GUARDAR CONFIGURACIÓN
 * =========================================
 */

const guardarConfiguracion =
  async (
    req,
    res
  ) => {

    const {
      saldo_inicial,
      fecha_inicio
    } =
      req.body;


    if (
      saldo_inicial ===
        undefined ||
      !fecha_inicio
    ) {
      return res
        .status(400)
        .json({
          mensaje:
            "Saldo inicial y fecha de inicio son obligatorios"
        });
    }


    const saldo =
      Number(
        saldo_inicial
      );


    if (
      !Number.isFinite(
        saldo
      )
    ) {
      return res
        .status(400)
        .json({
          mensaje:
            "Saldo inicial no válido"
        });
    }


    if (
      saldo < 0
    ) {
      return res
        .status(400)
        .json({
          mensaje:
            "El saldo inicial no puede ser negativo"
        });
    }


    try {

      const existente =
        await pool.query(`
          SELECT id
          FROM configuracion_financiera
          ORDER BY id
          LIMIT 1
        `);


      let resultado;


      if (
        existente.rows.length >
        0
      ) {

        resultado =
          await pool.query(
            `
            UPDATE configuracion_financiera
            SET
              saldo_inicial = $1,
              fecha_inicio = $2
            WHERE id = $3
            RETURNING *
            `,
            [
              saldo,
              fecha_inicio,
              existente.rows[0].id
            ]
          );

      } else {

        resultado =
          await pool.query(
            `
            INSERT INTO configuracion_financiera (
              saldo_inicial,
              fecha_inicio
            )
            VALUES ($1, $2)
            RETURNING *
            `,
            [
              saldo,
              fecha_inicio
            ]
          );
      }


      res.json({
        mensaje:
          "Configuración guardada correctamente",

        configuracion:
          resultado.rows[0]
      });

    } catch (error) {

      console.error(
        "Error al guardar configuración:",
        error
      );


      res.status(500).json({
        mensaje:
          "Error al guardar configuración",

        error:
          error.message
      });
    }
  };


/*
 * =========================================
 * RESTABLECER TODOS LOS DATOS
 * =========================================
 */

const restablecerDatos =
  async (
    req,
    res
  ) => {

    const client =
      await pool.connect();


    try {

      await client.query(
        "BEGIN"
      );


      /*
       * =====================================
       * PRESUPUESTOS
       * =====================================
       *
       * Deben eliminarse también para que
       * RESET realmente deje la aplicación
       * completamente limpia.
       */

      await client.query(
        "DELETE FROM presupuestos"
      );


      /*
       * =====================================
       * CUOTAS
       * =====================================
       */

      await client.query(
        "DELETE FROM cuotas"
      );


      /*
       * =====================================
       * TRANSACCIONES
       * =====================================
       */

      await client.query(
        "DELETE FROM transacciones"
      );


      /*
       * =====================================
       * CONFIGURACIÓN FINANCIERA
       * =====================================
       */

      await client.query(
        "DELETE FROM configuracion_financiera"
      );


      /*
       * =====================================
       * REINICIAR SECUENCIAS
       * =====================================
       *
       * Así, después del reset, los nuevos
       * registros vuelven a comenzar desde 1.
       */

      await client.query(
        "ALTER SEQUENCE presupuestos_id_seq RESTART WITH 1"
      );


      await client.query(
        "ALTER SEQUENCE cuotas_id_seq RESTART WITH 1"
      );


      await client.query(
        "ALTER SEQUENCE transacciones_id_seq RESTART WITH 1"
      );


      await client.query(
        "ALTER SEQUENCE configuracion_financiera_id_seq RESTART WITH 1"
      );


      await client.query(
        "COMMIT"
      );


      res.json({
        mensaje:
          "Todos los datos fueron restablecidos correctamente"
      });

    } catch (error) {

      await client.query(
        "ROLLBACK"
      );


      console.error(
        "Error al restablecer datos:",
        error
      );


      res.status(500).json({
        mensaje:
          "No se pudieron restablecer los datos",

        error:
          error.message
      });

    } finally {

      client.release();
    }
  };


module.exports = {
  obtenerConfiguracion,
  guardarConfiguracion,
  restablecerDatos
};