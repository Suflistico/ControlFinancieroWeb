import {
  useEffect,
  useState
} from "react";

import "./DetalleTransaccion.css";


function DetalleTransaccion({
  detalle,
  formatoCLP,
  onCerrar,
  onActualizarCuota,
  onEditar,
  onEliminar,
}) {
  const {
    transaccion,
    cuotas = []
  } = detalle;


  /*
   * =========================================
   * ESTADOS
   * =========================================
   */

  const [
    modoEdicion,
    setModoEdicion
  ] = useState(false);


  const [
    guardando,
    setGuardando
  ] = useState(false);


  const [
    mostrarEliminar,
    setMostrarEliminar
  ] = useState(false);


  const [
    eliminando,
    setEliminando
  ] = useState(false);


  const [
    textoEliminar,
    setTextoEliminar
  ] = useState("");


  const [
    cuotaActualizando,
    setCuotaActualizando
  ] = useState(null);


  const [
    formulario,
    setFormulario
  ] = useState({
    fecha: "",
    descripcion: "",
    monto: "",
    tipo: "gasto",
    medio_pago: "debito",
    categoria: "Otros",
    numero_cuotas: 1,
    notas: "",
  });


  /*
   * =========================================
   * OPERACIÓN EN PROCESO
   * =========================================
   */

  const operacionEnProceso =
    guardando ||
    eliminando ||
    cuotaActualizando !== null;


  /*
   * =========================================
   * CERRAR DETALLE
   * =========================================
   */

  const cerrarDetalle = () => {
    if (
      operacionEnProceso
    ) {
      return;
    }

    onCerrar();
  };


  /*
   * =========================================
   * NORMALIZAR MONTO
   * =========================================
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
   * =========================================
   * FECHAS SEGURAS
   * =========================================
   */

  const obtenerFechaISO = (
    fecha
  ) => {
    if (!fecha) {
      return "";
    }

    return String(
      fecha
    ).slice(
      0,
      10
    );
  };


  const fechaVisual = (
    fecha
  ) => {
    const fechaISO =
      obtenerFechaISO(
        fecha
      );

    if (!fechaISO) {
      return "—";
    }

    return new Date(
      `${fechaISO}T12:00:00`
    ).toLocaleDateString(
      "es-CL"
    );
  };


  /*
   * =========================================
   * ETIQUETAS
   * =========================================
   */

  const capitalizar = (
    texto
  ) => {
    if (!texto) {
      return "—";
    }

    const valor =
      String(
        texto
      );

    return (
      valor
        .charAt(0)
        .toUpperCase() +
      valor.slice(1)
    );
  };


  const etiquetaMedio = (
    medio
  ) => {
    if (
      medio === "debito"
    ) {
      return "Débito";
    }

    if (
      medio === "credito"
    ) {
      return "Crédito";
    }

    if (
      medio ===
      "transferencia"
    ) {
      return "Transferencia";
    }

    return capitalizar(
      medio
    );
  };


  /*
   * =========================================
   * INFORMACIÓN DE CUOTAS
   * =========================================
   */

  const cuotasPagadas =
    cuotas.filter(
      (
        cuota
      ) =>
        cuota.pagada === true
    );


  const cantidadPagadas =
    cuotasPagadas.length;


  const tieneCuotasPagadas =
    cantidadPagadas > 0;


  const esCredito =
    transaccion.tipo ===
      "gasto" &&
    transaccion.medio_pago ===
      "credito";


  const creditoCompletado =
    cuotas.length > 0 &&
    cantidadPagadas ===
      cuotas.length;


  /*
   * =========================================
   * CARGAR FORMULARIO
   * =========================================
   */

  useEffect(() => {
    if (
      !transaccion
    ) {
      return;
    }


    const montoActual =
      Number(
        transaccion.monto ||
        0
      );


    setFormulario({
      fecha:
        obtenerFechaISO(
          transaccion.fecha
        ),

      descripcion:
        transaccion.descripcion ||
        "",

      monto:
        montoActual > 0
          ? String(
              Math.trunc(
                montoActual
              )
            )
          : "",

      tipo:
        transaccion.tipo ||
        "gasto",

      medio_pago:
        transaccion.medio_pago ||
        "debito",

      categoria:
        transaccion.categoria ||
        "Otros",

      numero_cuotas:
        transaccion.numero_cuotas ||
        1,

      notas:
        transaccion.notas ||
        "",
    });

  }, [
    transaccion
  ]);


  /*
   * =========================================
   * CAMBIAR CAMPO
   * =========================================
   */

  const cambiarCampo = (
    evento
  ) => {
    const {
      name,
      value
    } =
      evento.target;


    const valorFinal =
      name === "monto"
        ? normalizarMonto(
            value
          )
        : value;


    setFormulario(
      (
        anterior
      ) => ({
        ...anterior,

        [name]:
          valorFinal,
      })
    );
  };


  /*
   * =========================================
   * GUARDAR EDICIÓN
   * =========================================
   */

  const guardarCambios =
    async (
      evento
    ) => {
      evento.preventDefault();


      if (
        !formulario
          .descripcion
          .trim()
      ) {
        alert(
          "Debes ingresar una descripción."
        );

        return;
      }


      const monto =
        Number(
          formulario.monto
        );


      if (
        formulario.monto ===
          "" ||
        !Number.isFinite(
          monto
        ) ||
        monto <= 0
      ) {
        alert(
          "El monto debe ser mayor que cero."
        );

        return;
      }


      try {
        setGuardando(
          true
        );


        const datos = {
          fecha:
            formulario.fecha,

          descripcion:
            formulario
              .descripcion
              .trim(),

          monto,

          tipo:
            formulario.tipo,

          medio_pago:
            formulario
              .medio_pago,

          categoria:
            formulario
              .categoria,

          numero_cuotas:
            esCredito
              ? Number(
                  formulario
                    .numero_cuotas
                )
              : 1,

          notas:
            formulario.notas,
        };


        const guardado =
          await onEditar(
            transaccion.id,
            datos
          );


        if (
          !guardado
        ) {
          setGuardando(
            false
          );
        }

      } catch (error) {
        console.error(
          error
        );

        setGuardando(
          false
        );
      }
    };


  /*
   * =========================================
   * ACTUALIZAR CUOTA
   * =========================================
   */

  const cambiarEstadoCuota =
    async (
      cuota
    ) => {
      /*
       * Impide ejecutar dos cambios
       * simultáneamente.
       */

      if (
        cuotaActualizando !==
        null
      ) {
        return;
      }


      try {
        setCuotaActualizando(
          cuota.id
        );


        /*
         * El backend guarda el cambio.
         *
         * onActualizarCuota además
         * vuelve a obtener el detalle
         * actualizado desde el servidor.
         */

        await onActualizarCuota(
          cuota.id,
          !cuota.pagada
        );

      } catch (error) {
        console.error(
          "Error actualizando cuota:",
          error
        );

      } finally {
        setCuotaActualizando(
          null
        );
      }
    };


  /*
   * =========================================
   * ELIMINAR
   * =========================================
   */

  const abrirConfirmacionEliminar =
    () => {
      if (
        operacionEnProceso
      ) {
        return;
      }


      setTextoEliminar(
        ""
      );

      setMostrarEliminar(
        true
      );
    };


  const confirmarEliminacion =
    async () => {
      try {
        setEliminando(
          true
        );


        const resultado =
          await onEliminar(
            transaccion.id,
            tieneCuotasPagadas
          );


        if (
          !resultado
        ) {
          setEliminando(
            false
          );
        }

      } catch (error) {
        console.error(
          error
        );

        setEliminando(
          false
        );
      }
    };


  /*
   * =========================================
   * VISTA
   * =========================================
   */

  return (
    <>

      <div
        className="modal-fondo"

        onMouseDown={
          cerrarDetalle
        }
      >

        <div
          className="
            detalle-transaccion-modal
          "

          onMouseDown={(
            evento
          ) => {
            evento
              .stopPropagation();
          }}
        >

          {/* =================================
              CABECERA
              ================================= */}

          <div className="detalle-cabecera">

            <div className="detalle-cabecera-texto">

              <p className="detalle-etiqueta">
                {modoEdicion
                  ? "Editar movimiento"
                  : "Detalle del movimiento"}
              </p>


              <h2>
                {
                  transaccion
                    .descripcion
                }
              </h2>


              {!modoEdicion && (

                <div className="detalle-badges">

                  <span
                    className={
                      transaccion.tipo ===
                      "ingreso"
                        ? "detalle-badge detalle-badge-ingreso"
                        : "detalle-badge detalle-badge-gasto"
                    }
                  >
                    {transaccion.tipo ===
                    "ingreso"
                      ? "Ingreso"
                      : "Gasto"}
                  </span>


                  <span className="detalle-badge detalle-badge-medio">
                    {etiquetaMedio(
                      transaccion
                        .medio_pago
                    )}
                  </span>


                  {esCredito && (

                    <span
                      className={
                        creditoCompletado
                          ? "detalle-badge detalle-badge-completado"
                          : "detalle-badge detalle-badge-credito"
                      }
                    >
                      {creditoCompletado
                        ? "Crédito pagado"
                        : `${cantidadPagadas} de ${cuotas.length} cuotas pagadas`}
                    </span>

                  )}

                </div>

              )}

            </div>


            <button
              type="button"

              className="detalle-boton-cerrar"

              aria-label="Cerrar detalle"

              disabled={
                operacionEnProceso
              }

              onClick={
                cerrarDetalle
              }
            >
              <span>
                ×
              </span>
            </button>

          </div>


          {!modoEdicion ? (

            <>

              {/* =============================
                  RESUMEN
                  ============================= */}

              <div className="detalle-resumen">

                <div className="detalle-resumen-item">

                  <span>
                    Fecha
                  </span>

                  <strong>
                    {fechaVisual(
                      transaccion.fecha
                    )}
                  </strong>

                </div>


                <div className="detalle-resumen-item">

                  <span>
                    Monto
                  </span>

                  <strong>
                    {formatoCLP(
                      transaccion.monto
                    )}
                  </strong>

                </div>


                <div className="detalle-resumen-item">

                  <span>
                    Categoría
                  </span>

                  <strong>
                    {transaccion
                      .categoria ||
                      "Sin categoría"}
                  </strong>

                </div>


                <div className="detalle-resumen-item">

                  <span>
                    Medio
                  </span>

                  <strong>
                    {etiquetaMedio(
                      transaccion
                        .medio_pago
                    )}
                  </strong>

                </div>

              </div>


              {transaccion.notas && (

                <div className="detalle-notas">

                  <span>
                    Notas
                  </span>

                  <p>
                    {
                      transaccion
                        .notas
                    }
                  </p>

                </div>

              )}


              {/* =============================
                  ACCIONES
                  ============================= */}

              <div className="detalle-acciones-principales">

                <button
                  type="button"

                  className="detalle-boton-eliminar"

                  disabled={
                    operacionEnProceso
                  }

                  onClick={
                    abrirConfirmacionEliminar
                  }
                >
                  <span>
                    ×
                  </span>

                  <span>
                    Eliminar movimiento
                  </span>
                </button>


                <button
                  type="button"

                  className="detalle-boton-editar"

                  disabled={
                    operacionEnProceso
                  }

                  onClick={() =>
                    setModoEdicion(
                      true
                    )
                  }
                >
                  <span>
                    ✎
                  </span>

                  <span>
                    Editar movimiento
                  </span>
                </button>

              </div>


              {/* =============================
                  CUOTAS
                  ============================= */}

              {cuotas.length >
                0 && (

                <section className="detalle-cuotas">

                  <div className="detalle-cuotas-cabecera">

                    <div>

                      <p className="detalle-etiqueta">
                        Crédito
                      </p>

                      <h3>
                        Cuotas
                      </h3>

                    </div>


                    <div className="detalle-progreso-cuotas">

                      <div className="detalle-progreso-texto">

                        <strong>
                          {cantidadPagadas}
                        </strong>

                        <span>
                          de{" "}
                          {cuotas.length}{" "}
                          pagadas
                        </span>

                      </div>


                      <div className="detalle-progreso-barra-fondo">

                        <div
                          className="detalle-progreso-barra"

                          style={{
                            width:
                              `${
                                cuotas.length >
                                0
                                  ? (
                                      cantidadPagadas /
                                      cuotas.length
                                    ) * 100
                                  : 0
                              }%`,
                          }}
                        />

                      </div>

                    </div>

                  </div>


                  <div className="detalle-cuotas-listado">

                    {cuotas.map(
                      (
                        cuota
                      ) => {

                        const actualizando =
                          cuotaActualizando ===
                          cuota.id;


                        const otraCuotaActualizando =
                          cuotaActualizando !==
                            null &&
                          !actualizando;


                        let textoBotonCuota =
                          "Marcar como pagada";


                        if (
                          cuota.pagada
                        ) {
                          textoBotonCuota =
                            "Marcar pendiente";
                        }


                        if (
                          actualizando
                        ) {
                          textoBotonCuota =
                            "Actualizando...";
                        }


                        return (
                          <article
                            key={
                              cuota.id
                            }

                            className={
                              cuota.pagada
                                ? "detalle-cuota detalle-cuota-pagada"
                                : "detalle-cuota"
                            }
                          >

                            <div
                              className={
                                cuota.pagada
                                  ? "detalle-cuota-estado estado-pagado"
                                  : "detalle-cuota-estado estado-pendiente"
                              }
                            >
                              <span>
                                {cuota.pagada
                                  ? "✓"
                                  : cuota.numero}
                              </span>
                            </div>


                            <div className="detalle-cuota-info">

                              <strong>
                                Cuota{" "}
                                {
                                  cuota.numero
                                }{" "}
                                de{" "}
                                {
                                  cuota
                                    .total_cuotas
                                }
                              </strong>


                              <span>
                                Fecha referencial{" "}
                                {fechaVisual(
                                  cuota
                                    .fecha_vencimiento
                                )}
                              </span>


                              {cuota.pagada &&
                                cuota.fecha_pago && (

                                <small>
                                  Pagada el{" "}
                                  {fechaVisual(
                                    cuota
                                      .fecha_pago
                                  )}
                                </small>

                              )}

                            </div>


                            <div className="detalle-cuota-monto">

                              <span>
                                Monto
                              </span>

                              <strong>
                                {formatoCLP(
                                  cuota.monto
                                )}
                              </strong>

                            </div>


                            <button
                              type="button"

                              className={
                                `${
                                  cuota.pagada
                                    ? "detalle-boton-cuota detalle-boton-pendiente"
                                    : "detalle-boton-cuota detalle-boton-pagar"
                                }${
                                  actualizando
                                    ? " detalle-boton-actualizando"
                                    : ""
                                }${
                                  otraCuotaActualizando
                                    ? " detalle-boton-bloqueado"
                                    : ""
                                }`
                              }

                              disabled={
                                cuotaActualizando !==
                                null
                              }

                              onClick={() =>
                                cambiarEstadoCuota(
                                  cuota
                                )
                              }
                            >

                              {/*
                               * IMPORTANTE:
                               *
                               * Siempre existe el mismo
                               * elemento SPAN.
                               *
                               * Solamente cambia su texto.
                               *
                               * Esto evita problemas
                               * removeChild de React.
                               */}

                              <span>
                                {
                                  textoBotonCuota
                                }
                              </span>

                            </button>

                          </article>
                        );
                      }
                    )}

                  </div>

                </section>

              )}


              {/* =============================
                  PIE
                  ============================= */}

              <div className="detalle-pie">

                <div className="detalle-pie-informacion">

                  <span className="detalle-pie-icono">
                    ✓
                  </span>


                  <div>

                    <strong>
                      {cuotas.length >
                      0
                        ? "Los cambios se guardan automáticamente"
                        : "Movimiento registrado"}
                    </strong>


                    <small>
                      {cuotas.length >
                      0
                        ? "Al cambiar el estado de una cuota no necesitas una segunda confirmación."
                        : "Puedes cerrar esta ventana cuando termines de revisar la información."}
                    </small>

                  </div>

                </div>


                <button
                  type="button"

                  className="detalle-boton-listo"

                  disabled={
                    operacionEnProceso
                  }

                  onClick={
                    cerrarDetalle
                  }
                >

                  {/*
                   * Mantener SIEMPRE
                   * los mismos nodos.
                   */}

                  <span className="detalle-listo-icono">
                    ✓
                  </span>


                  <span className="detalle-listo-texto">
                    {cuotaActualizando !==
                    null
                      ? "Actualizando..."
                      : "Listo"}
                  </span>

                </button>

              </div>

            </>

          ) : (

            /* ===============================
               FORMULARIO EDICIÓN
               =============================== */

            <form
              className="detalle-formulario-edicion"

              onSubmit={
                guardarCambios
              }
            >

              {esCredito &&
                tieneCuotasPagadas && (

                <div className="detalle-aviso-credito">

                  <div className="detalle-aviso-icono">
                    <span>
                      !
                    </span>
                  </div>


                  <div>

                    <strong>
                      Cuotas pagadas protegidas
                    </strong>

                    <p>
                      Puedes modificar la
                      descripción, categoría
                      y notas. El monto, fecha
                      y número de cuotas se
                      mantienen bloqueados
                      para proteger el
                      historial financiero.
                    </p>

                  </div>

                </div>

              )}


              <div className="detalle-campo">

                <label>
                  Descripción
                </label>

                <input
                  name="descripcion"

                  value={
                    formulario
                      .descripcion
                  }

                  onChange={
                    cambiarCampo
                  }

                  required
                />

              </div>


              <div className="detalle-grid-formulario">

                <div className="detalle-campo">

                  <label>
                    Monto
                  </label>

                  <input
                    name="monto"

                    type="text"

                    inputMode="numeric"

                    pattern="[0-9]*"

                    autoComplete="off"

                    value={
                      formulario
                        .monto
                    }

                    onChange={
                      cambiarCampo
                    }

                    disabled={
                      esCredito &&
                      tieneCuotasPagadas
                    }

                    required
                  />

                </div>


                <div className="detalle-campo">

                  <label>
                    Fecha
                  </label>

                  <input
                    name="fecha"

                    type="date"

                    value={
                      formulario
                        .fecha
                    }

                    onChange={
                      cambiarCampo
                    }

                    disabled={
                      esCredito &&
                      tieneCuotasPagadas
                    }

                    required
                  />

                </div>

              </div>


              <div className="detalle-campo">

                <label>
                  Categoría
                </label>

                <input
                  name="categoria"

                  value={
                    formulario
                      .categoria
                  }

                  onChange={
                    cambiarCampo
                  }

                  required
                />

              </div>


              {esCredito && (

                <div className="detalle-campo">

                  <label>
                    Número de cuotas
                  </label>

                  <input
                    name="numero_cuotas"

                    type="number"

                    min="1"

                    max="48"

                    value={
                      formulario
                        .numero_cuotas
                    }

                    onChange={
                      cambiarCampo
                    }

                    disabled={
                      tieneCuotasPagadas
                    }
                  />

                </div>

              )}


              <div className="detalle-campo">

                <label>
                  Notas
                </label>

                <textarea
                  name="notas"

                  value={
                    formulario
                      .notas
                  }

                  onChange={
                    cambiarCampo
                  }

                  placeholder="Información opcional"
                />

              </div>


              <div className="detalle-acciones-edicion">

                <button
                  type="button"

                  className="detalle-boton-cancelar"

                  disabled={
                    guardando
                  }

                  onClick={() =>
                    setModoEdicion(
                      false
                    )
                  }
                >
                  <span>
                    Cancelar
                  </span>
                </button>


                <button
                  type="submit"

                  className="detalle-boton-guardar"

                  disabled={
                    guardando
                  }
                >
                  <span>
                    {guardando
                      ? "Guardando..."
                      : "Guardar cambios"}
                  </span>
                </button>

              </div>

            </form>

          )}

        </div>

      </div>


      {/* =====================================
          CONFIRMACIÓN ELIMINAR
          ===================================== */}

      {mostrarEliminar && (

        <div
          className="
            modal-fondo
            detalle-eliminar-fondo
          "

          onMouseDown={() => {
            if (
              !eliminando
            ) {
              setMostrarEliminar(
                false
              );
            }
          }}
        >

          <div
            className="detalle-eliminar-modal"

            onMouseDown={(
              evento
            ) => {
              evento
                .stopPropagation();
            }}
          >

            <div className="detalle-eliminar-icono">
              <span>
                !
              </span>
            </div>


            <p className="detalle-etiqueta detalle-etiqueta-peligro">
              Acción irreversible
            </p>


            <h2>
              Eliminar movimiento
            </h2>


            <p className="detalle-eliminar-descripcion">
              Este movimiento será
              eliminado permanentemente.
            </p>


            <div className="detalle-eliminar-resumen">

              <div>

                <span>
                  Movimiento
                </span>

                <strong>
                  {
                    transaccion
                      .descripcion
                  }
                </strong>

              </div>


              <div>

                <span>
                  Monto
                </span>

                <strong>
                  {formatoCLP(
                    transaccion.monto
                  )}
                </strong>

              </div>

            </div>


            {esCredito && (

              <div className="detalle-eliminar-aviso">

                <strong>
                  Compra a crédito
                </strong>

                <p>
                  Se eliminarán también
                  las {cuotas.length} cuotas
                  asociadas a esta compra.
                </p>

              </div>

            )}


            {tieneCuotasPagadas && (

              <div className="detalle-eliminar-critico">

                <strong>
                  Atención
                </strong>

                <p>
                  Esta compra tiene{" "}
                  {cantidadPagadas}{" "}
                  {cantidadPagadas === 1
                    ? "cuota pagada"
                    : "cuotas pagadas"}.
                  Al eliminar el movimiento
                  se modificará el historial
                  financiero y se devolverán
                  esos pagos al saldo.
                </p>

              </div>

            )}


            {tieneCuotasPagadas && (

              <div className="detalle-confirmacion-escrita">

                <label>
                  Para confirmar escribe{" "}

                  <strong>
                    ELIMINAR
                  </strong>
                </label>


                <input
                  type="text"

                  value={
                    textoEliminar
                  }

                  onChange={(
                    evento
                  ) =>
                    setTextoEliminar(
                      evento
                        .target
                        .value
                        .toUpperCase()
                    )
                  }

                  placeholder="ELIMINAR"

                  autoComplete="off"
                />

              </div>

            )}


            <div className="detalle-eliminar-acciones">

              <button
                type="button"

                className="detalle-boton-cancelar"

                disabled={
                  eliminando
                }

                onClick={() =>
                  setMostrarEliminar(
                    false
                  )
                }
              >
                <span>
                  Cancelar
                </span>
              </button>


              <button
                type="button"

                className="detalle-boton-confirmar-eliminar"

                disabled={
                  eliminando ||
                  (
                    tieneCuotasPagadas &&
                    textoEliminar !==
                      "ELIMINAR"
                  )
                }

                onClick={
                  confirmarEliminacion
                }
              >
                <span>
                  {eliminando
                    ? "Eliminando..."
                    : "Eliminar definitivamente"}
                </span>
              </button>

            </div>

          </div>

        </div>

      )}

    </>
  );
}


export default DetalleTransaccion;