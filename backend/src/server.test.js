const {
    after,
    before,
    test
} = require("node:test");

const assert =
    require("node:assert/strict");

const {
    once
} = require("node:events");

const {
    iniciarServidor
} = require("./server");


let servidor;
let origen;


before(
    async () => {
        servidor =
            iniciarServidor(
                0,
                "127.0.0.1"
            );

        await once(
            servidor,
            "listening"
        );

        const direccion =
            servidor.address();

        origen =
            `http://127.0.0.1:${direccion.port}`;
    }
);


after(
    async () => {
        servidor.close();

        await once(
            servidor,
            "close"
        );
    }
);


test(
    "expone el estado básico de la API con cabeceras seguras",
    async () => {
        const respuesta =
            await fetch(
                `${origen}/`
            );

        assert.equal(
            respuesta.status,
            200
        );

        assert.equal(
            respuesta.headers.get(
                "x-content-type-options"
            ),
            "nosniff"
        );

        assert.equal(
            respuesta.headers.get(
                "x-powered-by"
            ),
            null
        );

        assert.deepEqual(
            await respuesta.json(),
            {
                ok:
                    true,

                mensaje:
                    "API Control Financiero funcionando"
            }
        );
    }
);


test(
    "rechaza cargas JSON excesivas",
    async () => {
        const respuesta =
            await fetch(
                `${origen}/api/transacciones`,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            contenido:
                                "x".repeat(
                                    110000
                                )
                        })
                }
            );

        assert.equal(
            respuesta.status,
            413
        );
    }
);
