const {
    Pool
} =
    require("pg");

require("dotenv").config();


/*
 * =====================================================
 * CONFIGURACIÓN POSTGRESQL
 * =====================================================
 *
 * PRODUCCIÓN / RENDER
 *
 * Render proporcionará:
 *
 * DATABASE_URL
 *
 *
 * DESARROLLO LOCAL
 *
 * Si DATABASE_URL no existe,
 * se conservan las variables actuales:
 *
 * DB_HOST
 * DB_PORT
 * DB_NAME
 * DB_USER
 * DB_PASSWORD
 * =====================================================
 */

const usarDatabaseUrl =
    Boolean(
        process.env.DATABASE_URL
    );


const configuracionPool =
    usarDatabaseUrl
        ? {
            connectionString:
                process.env.DATABASE_URL,

            max:
                10,

            idleTimeoutMillis:
                30000,

            connectionTimeoutMillis:
                10000,
        }
        : {
            host:
                process.env.DB_HOST,

            port:
                Number(
                    process.env.DB_PORT ||
                    5432
                ),

            database:
                process.env.DB_NAME,

            user:
                process.env.DB_USER,

            password:
                process.env.DB_PASSWORD,

            max:
                10,

            idleTimeoutMillis:
                30000,

            connectionTimeoutMillis:
                10000,
        };


const pool =
    new Pool(
        configuracionPool
    );


/*
 * =====================================================
 * EVENTOS DEL POOL
 * =====================================================
 */

pool.on(
    "connect",
    () => {
        console.log(
            usarDatabaseUrl
                ? "PostgreSQL conectado mediante DATABASE_URL"
                : "PostgreSQL conectado mediante configuración local"
        );
    }
);


pool.on(
    "error",
    (
        error
    ) => {
        console.error(
            "Error inesperado en PostgreSQL:",
            error
        );
    }
);


module.exports =
    pool;