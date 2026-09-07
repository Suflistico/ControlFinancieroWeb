import {
  useEffect,
  useState
} from "react";

import "./Configuracion.css";


function Configuracion({
  API,
  formatoCLP,
  onConfiguracionGuardada,
}) {
  const [
    saldoInicial,
    setSaldoInicial
  ] = useState("");

  const [
    saldoOriginal,
    setSaldoOriginal
  ] = useState(0);

  const [
    fechaInicio,
    setFechaInicio
  ] = useState("");

  const [
    fechaOriginal,
    setFechaOriginal
  ] = useState("");

  const [
    cargando,
    setCargando
  ] = useState(true);

  const [
    guardando,
    setGuardando
  ] = useState(false);

  const [
    mostrarReset,
    setMostrarReset
  ] = useState(false);

  const [
    reseteando,
    setReseteando
  ] = useState(false);

  const [
    textoConfirmacionReset,
    setTextoConfirmacionReset
  ] = useState("");

  const [
    mensaje,
    setMensaje
  ] = useState("");

  const [
    error,
    setError
  ] = useState("");


  /*
   * =====================================================
   * NORMALIZAR MONTO
   * =====================================================
   */

  const normalizarMonto = (
    valor
  ) => {
    return String(
      valor ?? ""
    ).replace(
      /\D/g,
      ""
    );
  };


  /*
   * =====================================================
   * CAMBIAR SALDO
   * =====================================================
   */

  const cambiarSaldoInicial = (
    evento
  ) => {
    const valorLimpio =
      normalizarMonto(
        evento.target.value
      );


    setSaldoInicial(
      valorLimpio
    );


    setMensaje("");
    setError("");
  };


  /*
   * =====================================================
   * CARGAR CONFIGURACIÓN
   * =====================================================
   */

  const cargarConfiguracion =
    async () => {
      try {
        setCargando(
          true
        );

        setError("");


        const respuesta =
          await fetch(
            `${API}/configuracion`,
            {
              cache:
                "no-store",
            }
          );


        if (
          !respuesta.ok
        ) {
          throw new Error(
            "No se pudo cargar la configuración."
          );
        }


        const datos =
          await respuesta
            .json();


        if (
          datos
        ) {
          const saldo =
            Number(
              datos.saldo_inicial ||
              0
            );


          const fecha =
            datos.fecha_inicio
              ? String(
                  datos.fecha_inicio
                ).slice(
                  0,
                  10
                )
              : "";


          setSaldoInicial(
            String(
              Math.trunc(
                saldo
              )
            )
          );


          setSaldoOriginal(
            saldo
          );


          setFechaInicio(
            fecha
          );


          setFechaOriginal(
            fecha
          );

        } else {

          setSaldoInicial(
            ""
          );


          setSaldoOriginal(
            0
          );


          setFechaInicio(
            ""
          );


          setFechaOriginal(
            ""
          );
        }

      } catch (error) {

        console.error(
          error
        );


        setError(
          "No fue posible cargar la configuración."
        );

      } finally {

        setCargando(
          false
        );
      }
    };


  useEffect(() => {
    cargarConfiguracion();

    // eslint-disable-next-line
  }, [
    API
  ]);


  /*
   * =====================================================
   * FECHA VISUAL
   * =====================================================
   */

  const fechaVisual = (
    fecha
  ) => {
    if (
      !fecha
    ) {
      return "Sin fecha";
    }


    return new Date(
      `${fecha}T12:00:00`
    ).toLocaleDateString(
      "es-CL"
    );
  };


  /*
   * =====================================================
   * CÁLCULOS
   * =====================================================
   */

  const nuevoSaldo =
    Number(
      saldoInicial ||
      0
    );


  const diferenciaSaldo =
    nuevoSaldo -
    Number(
      saldoOriginal ||
      0
    );


  const cambioSaldo =
    nuevoSaldo !==
    Number(
      saldoOriginal ||
      0
    );


  const cambioFecha =
    fechaInicio !==
    fechaOriginal;


  /*
   * =====================================================
   * GUARDAR CONFIGURACIÓN
   * =====================================================
   *
   * Devuelve true cuando el backend confirmó
   * correctamente la actualización.
   * =====================================================
   */

  const guardarConfiguracion =
    async () => {
      if (
        guardando
      ) {
        return false;
      }


      try {
        setGuardando(
          true
        );

        setMensaje("");
        setError("");


        const saldoNumero =
          Number(
            saldoInicial
          );


        const respuesta =
          await fetch(
            `${API}/configuracion`,
            {
              method:
                "PUT",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  saldo_inicial:
                    saldoNumero,

                  fecha_inicio:
                    fechaInicio,
                }),
            }
          );


        const resultado =
          await respuesta.json();


        if (
          !respuesta.ok
        ) {
          throw new Error(
            resultado.mensaje ||
              "No se pudo guardar la configuración."
          );
        }


        /*
         * Primero dejamos nuestros valores internos
         * sincronizados.
         */

        setSaldoOriginal(
          saldoNumero
        );


        setFechaOriginal(
          fechaInicio
        );


        /*
         * Actualizamos los datos globales del App.
         */

        if (
          onConfiguracionGuardada
        ) {
          await onConfiguracionGuardada();
        }


        return true;

      } catch (error) {

        console.error(
          error
        );


        setError(
          error.message
        );


        return false;

      } finally {

        setGuardando(
          false
        );
      }
    };


  /*
   * =====================================================
   * CONFIRMACIÓN DEL CAMBIO
   * =====================================================
   *
   * La confirmación se realiza fuera del DOM de React.
   *
   * Para una modificación del saldo inicial:
   * el usuario debe escribir CONFIRMAR.
   * =====================================================
   */

  const solicitarConfirmacion =
    async (
      evento
    ) => {
      evento.preventDefault();

      setMensaje("");
      setError("");


      /*
       * Validación saldo.
       */

      if (
        saldoInicial ===
        ""
      ) {
        setError(
          "Debes ingresar un saldo inicial."
        );

        return;
      }


      const saldoNumero =
        Number(
          saldoInicial
        );


      if (
        !Number.isFinite(
          saldoNumero
        )
      ) {
        setError(
          "El saldo inicial no es válido."
        );

        return;
      }


      if (
        saldoNumero < 0
      ) {
        setError(
          "El saldo inicial no puede ser negativo."
        );

        return;
      }


      /*
       * Validación fecha.
       */

      if (
        !fechaInicio
      ) {
        setError(
          "Debes indicar una fecha de inicio."
        );

        return;
      }


      /*
       * Debe existir al menos un cambio.
       */

      if (
        !cambioSaldo &&
        !cambioFecha
      ) {
        setError(
          "No existen cambios para guardar."
        );

        return;
      }


      /*
       * =================================================
       * CAMBIO DEL SALDO INICIAL
       * =================================================
       */

      if (
        cambioSaldo
      ) {
        const signo =
          diferenciaSaldo > 0
            ? "+"
            : "";


        const confirmacion =
          window.prompt(
            [
              "CONFIRMAR MODIFICACIÓN DEL SALDO INICIAL",
              "",
              `Saldo inicial actual: ${formatoCLP(
                saldoOriginal
              )}`,
              "",
              `Nuevo saldo inicial: ${formatoCLP(
                saldoNumero
              )}`,
              "",
              `Diferencia: ${signo}${formatoCLP(
                diferenciaSaldo
              )}`,
              "",
              "IMPORTANTE:",
              "",
              "Modificar el saldo inicial NO crea un ingreso.",
              "",
              "No modifica movimientos existentes.",
              "No modifica cuotas existentes.",
              "No modifica presupuestos existentes.",
              "",
              "Solamente cambia la base utilizada para calcular el saldo disponible.",
              "",
              "Para autorizar esta modificación escribe exactamente:",
              "",
              "CONFIRMAR"
            ].join(
              "\n"
            ),
            ""
          );


        /*
         * Cancelar.
         */

        if (
          confirmacion ===
          null
        ) {
          return;
        }


        /*
         * Texto incorrecto.
         */

        if (
          String(
            confirmacion
          )
            .trim()
            .toUpperCase() !==
          "CONFIRMAR"
        ) {
          setError(
            "La modificación fue cancelada porque no se escribió CONFIRMAR correctamente."
          );

          return;
        }
      }


      /*
       * =================================================
       * SOLO CAMBIO DE FECHA
       * =================================================
       */

      if (
        !cambioSaldo &&
        cambioFecha
      ) {
        const confirmado =
          window.confirm(
            [
              "Confirmar cambio de fecha de inicio",
              "",
              `Fecha anterior: ${fechaVisual(
                fechaOriginal
              )}`,
              "",
              `Nueva fecha: ${fechaVisual(
                fechaInicio
              )}`,
              "",
              "Esta fecha es únicamente referencial.",
              "",
              "Todos los movimientos registrados seguirán afectando el saldo acumulado.",
              "",
              "¿Deseas guardar este cambio?"
            ].join(
              "\n"
            )
          );


        if (
          !confirmado
        ) {
          return;
        }
      }


      /*
       * =================================================
       * GUARDAR
       * =================================================
       */

      const guardado =
        await guardarConfiguracion();


      if (
        !guardado
      ) {
        return;
      }


      /*
       * =================================================
       * RECARGA SEGURA
       * =================================================
       *
       * El backend ya confirmó el cambio.
       *
       * En vez de continuar reconciliando el árbol
       * React que acaba de sufrir la actualización,
       * iniciamos una instancia completamente nueva
       * de la aplicación.
       *
       * Esto elimina nodos/referencias DOM antiguas
       * que pudieran producir:
       *
       * insertBefore
       * removeChild
       * =================================================
       */

      window.alert(
        "Configuración guardada correctamente.\n\nLa aplicación se actualizará para aplicar el nuevo saldo de forma segura."
      );


      window.location.reload();
    };


  /*
   * =====================================================
   * RESET
   * =====================================================
   */

  const abrirReset =
    () => {
      setMensaje("");
      setError("");


      setTextoConfirmacionReset(
        ""
      );


      setMostrarReset(
        true
      );
    };


  const cerrarReset =
    () => {
      if (
        reseteando
      ) {
        return;
      }


      setMostrarReset(
        false
      );


      setTextoConfirmacionReset(
        ""
      );
    };


  const restablecerTodo =
    async () => {
      if (
        reseteando ||
        textoConfirmacionReset !==
          "RESET"
      ) {
        return;
      }


      try {
        setReseteando(
          true
        );

        setError("");
        setMensaje("");


        const respuesta =
          await fetch(
            `${API}/configuracion/reset`,
            {
              method:
                "DELETE"
            }
          );


        const resultado =
          await respuesta.json();


        if (
          !respuesta.ok
        ) {
          throw new Error(
            resultado.mensaje ||
              "No fue posible restablecer los datos."
          );
        }


        /*
         * Después de un RESET tampoco necesitamos
         * reconstruir manualmente múltiples estados.
         *
         * Una recarga limpia vuelve a pedir:
         *
         * configuración
         * dashboard
         * transacciones
         * cuotas
         * presupuestos
         */

        window.alert(
          "Todos los datos fueron eliminados correctamente.\n\nLa aplicación se reiniciará."
        );


        window.location.reload();

      } catch (error) {

        console.error(
          error
        );


        setError(
          error.message
        );

        setReseteando(
          false
        );
      }
    };


  /*
   * =====================================================
   * CARGANDO
   * =====================================================
   */

  if (
    cargando
  ) {
    return (
      <section className="configuracion-moderna configuracion-cargando">

        <div className="spinner" />

        <p>
          Cargando configuración...
        </p>

      </section>
    );
  }


  /*
   * =====================================================
   * VISTA
   * =====================================================
   */

  return (
    <div className="configuracion-contenedor">

      <div className="configuracion-moderna">

        <div className="configuracion-moderna-cabecera">

          <div>

            <p className="etiqueta">
              Preferencias financieras
            </p>

            <h2>
              Configuración
            </h2>

            <p>
              Define el saldo inicial de tu
              control financiero y una fecha
              referencial de inicio.

              El saldo disponible considera
              todos los movimientos registrados,
              independientemente de esa fecha.
            </p>

          </div>


          <div className="configuracion-cabecera-icono">
            ⚙
          </div>

        </div>


        {mensaje && (
          <div className="configuracion-mensaje configuracion-mensaje-exito">

            <span>
              ✓
            </span>

            <span>
              {mensaje}
            </span>

          </div>
        )}


        {error && (
          <div className="configuracion-mensaje configuracion-mensaje-error">

            <span>
              !
            </span>

            <span>
              {error}
            </span>

          </div>
        )}


        <div className="configuracion-resumen-superior">

          <div className="configuracion-resumen-item">

            <span className="configuracion-resumen-icono icono-saldo-actual">
              $
            </span>


            <div>

              <small>
                Saldo inicial actual
              </small>

              <strong>
                {formatoCLP(
                  saldoOriginal
                )}
              </strong>

            </div>

          </div>


          <div className="configuracion-resumen-item">

            <span className="configuracion-resumen-icono icono-nuevo-saldo">
              →
            </span>


            <div>

              <small>
                Nuevo saldo inicial
              </small>

              <strong>
                {formatoCLP(
                  nuevoSaldo
                )}
              </strong>

            </div>

          </div>


          <div className="configuracion-resumen-item">

            <span className="configuracion-resumen-icono icono-fecha">
              ▣
            </span>


            <div>

              <small>
                Fecha referencial
              </small>

              <strong>
                {fechaVisual(
                  fechaInicio
                )}
              </strong>

            </div>

          </div>

        </div>


        <form
          className="configuracion-formulario-moderno"

          onSubmit={
            solicitarConfirmacion
          }
        >

          <div className="configuracion-formulario-titulo">

            <div>

              <h3>
                Datos financieros
              </h3>

              <p>
                Revisa los valores antes
                de guardarlos.
              </p>

            </div>

          </div>


          <div className="configuracion-campos">

            <div className="configuracion-campo">

              <label
                htmlFor="saldo-inicial-configuracion"
              >
                Saldo inicial
              </label>


              <div className="configuracion-input-moneda">

                <span>
                  $
                </span>


                <input
                  id="saldo-inicial-configuracion"

                  type="text"

                  inputMode="numeric"

                  pattern="[0-9]*"

                  autoComplete="off"

                  value={
                    saldoInicial
                  }

                  onChange={
                    cambiarSaldoInicial
                  }

                  placeholder="500000"

                  disabled={
                    guardando ||
                    reseteando
                  }

                  required
                />

              </div>


              <small>
                Valor ingresado:{" "}

                <strong>
                  {formatoCLP(
                    nuevoSaldo
                  )}
                </strong>
              </small>

            </div>


            <div className="configuracion-campo">

              <label
                htmlFor="fecha-inicio-configuracion"
              >
                Fecha de inicio
              </label>


              <input
                id="fecha-inicio-configuracion"

                type="date"

                value={
                  fechaInicio
                }

                onChange={(
                  evento
                ) => {
                  setFechaInicio(
                    evento.target.value
                  );

                  setMensaje("");
                  setError("");
                }}

                disabled={
                  guardando ||
                  reseteando
                }

                required
              />


              <small>
                Esta fecha es solo referencial
                para el inicio de tu control.

                El saldo acumulado considera
                todos los movimientos
                registrados, sean anteriores
                o posteriores.
              </small>

            </div>

          </div>


          <div className="configuracion-formulario-footer">

            <div>

              {cambioSaldo && (

                <span
                  className={
                    diferenciaSaldo >= 0
                      ? "configuracion-diferencia diferencia-positiva"
                      : "configuracion-diferencia diferencia-negativa"
                  }
                >
                  Diferencia:{" "}

                  {diferenciaSaldo >
                  0
                    ? "+"
                    : ""}

                  {formatoCLP(
                    diferenciaSaldo
                  )}
                </span>

              )}

            </div>


            <button
              type="submit"

              className="configuracion-boton-guardar"

              disabled={
                guardando ||
                reseteando
              }
            >
              {guardando
                ? "Guardando..."
                : "Revisar y guardar"}
            </button>

          </div>

        </form>


        <div className="configuracion-grid-inferior">

          <section className="configuracion-tarjeta-secundaria">

            <div className="configuracion-tarjeta-cabecera">

              <div className="configuracion-mini-icono mini-icono-formula">
                =
              </div>


              <div>

                <p className="etiqueta">
                  ¿Cómo funciona?
                </p>

                <h3>
                  Cálculo del saldo
                </h3>

              </div>

            </div>


            <div className="configuracion-formula">

              <div>
                <span>
                  Saldo inicial
                </span>

                <strong>
                  +
                </strong>
              </div>


              <div>
                <span>
                  Ingresos
                </span>

                <strong>
                  −
                </strong>
              </div>


              <div>
                <span>
                  Débito
                </span>

                <strong>
                  −
                </strong>
              </div>


              <div>
                <span>
                  Cuotas pagadas
                </span>

                <strong>
                  =
                </strong>
              </div>


              <div className="configuracion-formula-resultado">

                <span>
                  Saldo disponible
                </span>

              </div>

            </div>

          </section>


          <section className="configuracion-tarjeta-secundaria">

            <div className="configuracion-tarjeta-cabecera">

              <div className="configuracion-mini-icono mini-icono-credito">
                ◇
              </div>


              <div>

                <p className="etiqueta">
                  Compras a crédito
                </p>

                <h3>
                  Cómo afecta al saldo
                </h3>

              </div>

            </div>


            <div className="configuracion-regla-credito">

              <div>

                <span>
                  Compra realizada
                </span>

                <strong>
                  Saldo intacto
                </strong>

              </div>


              <div className="flecha-regla">
                →
              </div>


              <div>

                <span>
                  Cuota pagada
                </span>

                <strong>
                  Se descuenta
                </strong>

              </div>

            </div>


            <p className="configuracion-texto-ayuda">
              Una compra con crédito no
              disminuye inmediatamente
              el saldo disponible.

              Cada cuota se descuenta
              cuando la marcas como
              pagada.
            </p>

          </section>

        </div>

      </div>


      <section className="configuracion-zona-peligro">

        <div className="configuracion-zona-info">

          <div className="configuracion-peligro-icono">
            !
          </div>


          <div>

            <p className="etiqueta configuracion-etiqueta-peligro">
              Zona de peligro
            </p>

            <h3>
              Restablecer todos los datos
            </h3>

            <p>
              Elimina movimientos,
              cuotas, presupuestos y
              configuración financiera.

              La aplicación quedará lista
              para comenzar nuevamente
              desde cero.
            </p>

          </div>

        </div>


        <button
          type="button"

          className="configuracion-boton-reset"

          disabled={
            guardando ||
            reseteando
          }

          onClick={
            abrirReset
          }
        >
          Restablecer datos
        </button>

      </section>


      {/* =====================================
          RESET SIEMPRE MONTADO
          ===================================== */}

      <div
        className={
          mostrarReset
            ? "modal-fondo configuracion-capa-modal configuracion-capa-visible"
            : "modal-fondo configuracion-capa-modal configuracion-capa-oculta"
        }

        aria-hidden={
          !mostrarReset
        }

        onMouseDown={
          cerrarReset
        }
      >

        <div
          className="modal configuracion-modal configuracion-modal-reset"

          onMouseDown={(
            evento
          ) => {
            evento.stopPropagation();
          }}
        >

          <div className="configuracion-modal-icono configuracion-modal-icono-peligro">
            !
          </div>


          <p className="etiqueta configuracion-etiqueta-peligro">
            Acción irreversible
          </p>


          <h2>
            ¿Restablecer todos
            los datos?
          </h2>


          <p className="configuracion-modal-texto">
            Esta acción eliminará
            permanentemente:
          </p>


          <div className="configuracion-lista-reset">

            <div>
              <span>
                ×
              </span>

              <span>
                Todos los movimientos
              </span>
            </div>


            <div>
              <span>
                ×
              </span>

              <span>
                Todas las cuotas
              </span>
            </div>


            <div>
              <span>
                ×
              </span>

              <span>
                Todos los presupuestos
              </span>
            </div>


            <div>
              <span>
                ×
              </span>

              <span>
                Saldo inicial y
                fecha de inicio
              </span>
            </div>

          </div>


          <div className="configuracion-confirmacion-reset">

            <label>
              Para continuar escribe{" "}

              <strong>
                RESET
              </strong>
            </label>


            <input
              type="text"

              value={
                textoConfirmacionReset
              }

              onChange={(
                evento
              ) =>
                setTextoConfirmacionReset(
                  evento
                    .target
                    .value
                    .toUpperCase()
                )
              }

              placeholder="RESET"

              autoComplete="off"

              disabled={
                reseteando
              }
            />

          </div>


          <div className="configuracion-modal-acciones">

            <button
              type="button"

              className="boton-secundario"

              disabled={
                reseteando
              }

              onClick={
                cerrarReset
              }
            >
              Cancelar
            </button>


            <button
              type="button"

              className="configuracion-reset-confirmar"

              disabled={
                reseteando ||
                textoConfirmacionReset !==
                  "RESET"
              }

              onClick={
                restablecerTodo
              }
            >
              {reseteando
                ? "Restableciendo..."
                : "Eliminar todo"}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}


export default Configuracion;