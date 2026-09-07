import {
  useMemo,
  useState,
} from "react";

import "./Historial.css";


function Historial({
  transacciones,
  cuotas,
  formatoCLP,
  onSeleccionar,
}) {

  const [
    tipo,
    setTipo
  ] =
    useState(
      "todos"
    );


  const [
    medio,
    setMedio
  ] =
    useState(
      "todos"
    );


  const [
    busqueda,
    setBusqueda
  ] =
    useState("");


  const [
    orden,
    setOrden
  ] =
    useState(
      "desc"
    );


  const [
    fechaDesde,
    setFechaDesde
  ] =
    useState("");


  const [
    fechaHasta,
    setFechaHasta
  ] =
    useState("");


  const [
    paginaActual,
    setPaginaActual
  ] =
    useState(1);


  const [
    mostrarTodas,
    setMostrarTodas
  ] =
    useState(false);


  const registrosPorPagina =
    10;


  /*
   * =====================================================
   * FECHA SEGURA
   * =====================================================
   */

  const obtenerFechaISO = (
    fecha
  ) => {
    if (
      !fecha
    ) {
      return "";
    }


    return String(
      fecha
    ).slice(
      0,
      10
    );
  };


  /*
   * =====================================================
   * BÚSQUEDA
   * =====================================================
   */

  const cumpleBusquedaTexto = (
    movimiento,
    termino
  ) => {
    if (
      !termino
    ) {
      return true;
    }


    const descripcion =
      movimiento
        ?.descripcion
        ?.toLowerCase() ||
      "";


    const categoria =
      movimiento
        ?.categoria
        ?.toLowerCase() ||
      "";


    const notas =
      movimiento
        ?.notas
        ?.toLowerCase() ||
      "";


    return (
      descripcion.includes(
        termino
      ) ||
      categoria.includes(
        termino
      ) ||
      notas.includes(
        termino
      )
    );
  };


  /*
   * =====================================================
   * MOVIMIENTOS FILTRADOS
   * =====================================================
   */

  const movimientosFiltrados =
    useMemo(() => {

      const termino =
        busqueda
          .trim()
          .toLowerCase();


      const resultado =
        transacciones.filter(
          (
            movimiento
          ) => {

            const cumpleTipo =
              tipo ===
                "todos" ||
              movimiento.tipo ===
                tipo;


            const cumpleMedio =
              medio ===
                "todos" ||
              movimiento
                .medio_pago ===
                medio;


            const cumpleBusqueda =
              cumpleBusquedaTexto(
                movimiento,
                termino
              );


            const fechaMovimiento =
              obtenerFechaISO(
                movimiento.fecha
              );


            const cumpleDesde =
              !fechaDesde ||
              fechaMovimiento >=
                fechaDesde;


            const cumpleHasta =
              !fechaHasta ||
              fechaMovimiento <=
                fechaHasta;


            return (
              cumpleTipo &&
              cumpleMedio &&
              cumpleBusqueda &&
              cumpleDesde &&
              cumpleHasta
            );
          }
        );


      resultado.sort(
        (
          a,
          b
        ) => {

          const fechaA =
            obtenerFechaISO(
              a.fecha
            );


          const fechaB =
            obtenerFechaISO(
              b.fecha
            );


          if (
            fechaA ===
            fechaB
          ) {
            return orden ===
              "desc"
              ? Number(
                  b.id
                ) -
                  Number(
                    a.id
                  )
              : Number(
                  a.id
                ) -
                  Number(
                    b.id
                  );
          }


          return orden ===
            "desc"
            ? fechaB.localeCompare(
                fechaA
              )
            : fechaA.localeCompare(
                fechaB
              );
        }
      );


      return resultado;

    }, [
      transacciones,
      tipo,
      medio,
      busqueda,
      orden,
      fechaDesde,
      fechaHasta,
    ]);


  /*
   * =====================================================
   * INGRESOS
   * =====================================================
   */

  const ingresosFiltrados =
    useMemo(() => {

      return movimientosFiltrados
        .filter(
          (
            movimiento
          ) =>
            movimiento.tipo ===
            "ingreso"
        );

    }, [
      movimientosFiltrados
    ]);


  const totalIngresos =
    useMemo(() => {

      return ingresosFiltrados
        .reduce(
          (
            total,
            movimiento
          ) =>
            total +
            Number(
              movimiento.monto ||
              0
            ),
          0
        );

    }, [
      ingresosFiltrados
    ]);


  /*
   * =====================================================
   * DÉBITO REAL
   * =====================================================
   */

  const gastosDebito =
    useMemo(() => {

      return movimientosFiltrados
        .filter(
          (
            movimiento
          ) =>
            movimiento.tipo ===
              "gasto" &&
            movimiento
              .medio_pago ===
              "debito"
        );

    }, [
      movimientosFiltrados
    ]);


  const totalDebito =
    useMemo(() => {

      return gastosDebito
        .reduce(
          (
            total,
            movimiento
          ) =>
            total +
            Number(
              movimiento.monto ||
              0
            ),
          0
        );

    }, [
      gastosDebito
    ]);


  /*
   * =====================================================
   * CUOTAS PAGADAS REALES
   * =====================================================
   *
   * La cuota se incluye únicamente si:
   *
   * pagada === true
   *
   * y tiene fecha_pago.
   *
   * Se filtra por fecha_pago,
   * no por fecha_vencimiento.
   * =====================================================
   */

  const cuotasPagadasFiltradas =
    useMemo(() => {

      const termino =
        busqueda
          .trim()
          .toLowerCase();


      return (
        Array.isArray(
          cuotas
        )
          ? cuotas
          : []
      ).filter(
        (
          cuota
        ) => {

          if (
            !cuota.pagada
          ) {
            return false;
          }


          const fechaPago =
            obtenerFechaISO(
              cuota.fecha_pago
            );


          if (
            !fechaPago
          ) {
            return false;
          }


          const cumpleDesde =
            !fechaDesde ||
            fechaPago >=
              fechaDesde;


          const cumpleHasta =
            !fechaHasta ||
            fechaPago <=
              fechaHasta;


          const cumpleTipo =
            tipo ===
              "todos" ||
            tipo ===
              "gasto";


          const cumpleMedio =
            medio ===
              "todos" ||
            medio ===
              "credito";


          const descripcion =
            cuota.descripcion
              ?.toLowerCase() ||
            "";


          const categoria =
            cuota.categoria
              ?.toLowerCase() ||
            "";


          const cumpleBusqueda =
            !termino ||
            descripcion.includes(
              termino
            ) ||
            categoria.includes(
              termino
            );


          return (
            cumpleDesde &&
            cumpleHasta &&
            cumpleTipo &&
            cumpleMedio &&
            cumpleBusqueda
          );
        }
      );

    }, [
      cuotas,
      fechaDesde,
      fechaHasta,
      tipo,
      medio,
      busqueda,
    ]);


  const totalCuotasPagadas =
    useMemo(() => {

      return cuotasPagadasFiltradas
        .reduce(
          (
            total,
            cuota
          ) =>
            total +
            Number(
              cuota.monto ||
              0
            ),
          0
        );

    }, [
      cuotasPagadasFiltradas
    ]);


  /*
   * =====================================================
   * EGRESOS REALES
   * =====================================================
   */

  const totalEgresosReales =
    totalDebito +
    totalCuotasPagadas;


  const cantidadEgresosReales =
    gastosDebito.length +
    cuotasPagadasFiltradas.length;


  const resultadoPeriodo =
    totalIngresos -
    totalEgresosReales;


  /*
   * =====================================================
   * CRÉDITO REGISTRADO
   * =====================================================
   */

  const comprasCredito =
    useMemo(() => {

      return movimientosFiltrados
        .filter(
          (
            movimiento
          ) =>
            movimiento.tipo ===
              "gasto" &&
            movimiento
              .medio_pago ===
              "credito"
        );

    }, [
      movimientosFiltrados
    ]);


  const totalCreditoRegistrado =
    useMemo(() => {

      return comprasCredito
        .reduce(
          (
            total,
            movimiento
          ) =>
            total +
            Number(
              movimiento.monto ||
              0
            ),
          0
        );

    }, [
      comprasCredito
    ]);


  /*
   * =====================================================
   * PAGINACIÓN
   * =====================================================
   */

  const totalPaginas =
    Math.max(
      1,
      Math.ceil(
        movimientosFiltrados
          .length /
          registrosPorPagina
      )
    );


  const movimientosVisibles =
    useMemo(() => {

      if (
        mostrarTodas
      ) {
        return movimientosFiltrados;
      }


      const paginaSegura =
        Math.min(
          paginaActual,
          totalPaginas
        );


      const inicio =
        (
          paginaSegura -
          1
        ) *
        registrosPorPagina;


      return movimientosFiltrados
        .slice(
          inicio,
          inicio +
            registrosPorPagina
        );

    }, [
      movimientosFiltrados,
      mostrarTodas,
      paginaActual,
      totalPaginas,
    ]);


  /*
   * =====================================================
   * FILTROS
   * =====================================================
   */

  const cambiarFiltro = (
    setter,
    valor
  ) => {

    setter(
      valor
    );


    setPaginaActual(
      1
    );
  };


  const limpiarFiltros =
    () => {

      setTipo(
        "todos"
      );


      setMedio(
        "todos"
      );


      setBusqueda(
        ""
      );


      setOrden(
        "desc"
      );


      setFechaDesde(
        ""
      );


      setFechaHasta(
        ""
      );


      setPaginaActual(
        1
      );


      setMostrarTodas(
        false
      );
    };


  /*
   * =====================================================
   * FECHAS VISUALES
   * =====================================================
   */

  const fechaVisual = (
    fecha
  ) => {

    if (
      !fecha
    ) {
      return "—";
    }


    return new Date(
      `${obtenerFechaISO(
        fecha
      )}T12:00:00`
    ).toLocaleDateString(
      "es-CL"
    );
  };


  const diaSemana = (
    fecha
  ) => {

    if (
      !fecha
    ) {
      return "";
    }


    const texto =
      new Date(
        `${obtenerFechaISO(
          fecha
        )}T12:00:00`
      ).toLocaleDateString(
        "es-CL",
        {
          weekday:
            "short",
        }
      );


    return (
      texto
        .charAt(
          0
        )
        .toUpperCase() +
      texto.slice(
        1
      )
    );
  };


  /*
   * =====================================================
   * MEDIO
   * =====================================================
   */

  const etiquetaMedio = (
    medioPago
  ) => {

    if (
      medioPago ===
      "debito"
    ) {
      return "Débito";
    }


    if (
      medioPago ===
      "credito"
    ) {
      return "Crédito";
    }


    if (
      medioPago ===
      "transferencia"
    ) {
      return "Transferencia";
    }


    return (
      medioPago ||
      "—"
    );
  };


  const iconoMovimiento = (
    movimiento
  ) => {

    if (
      movimiento.tipo ===
      "ingreso"
    ) {
      return "↓";
    }


    if (
      movimiento
        .medio_pago ===
      "credito"
    ) {
      return "◇";
    }


    return "↑";
  };


  /*
   * =====================================================
   * PAGINACIÓN TEXTO
   * =====================================================
   */

  const paginaVisual =
    Math.min(
      paginaActual,
      totalPaginas
    );


  const inicioMostrado =
    movimientosFiltrados
      .length ===
    0
      ? 0
      : mostrarTodas
      ? 1
      : (
          paginaVisual -
          1
        ) *
          registrosPorPagina +
        1;


  const finMostrado =
    mostrarTodas
      ? movimientosFiltrados
          .length
      : Math.min(
          paginaVisual *
            registrosPorPagina,

          movimientosFiltrados
            .length
        );


  /*
   * =====================================================
   * VISTA
   * =====================================================
   */

  return (
    <section className="historial-moderno">

      <div className="historial-moderno-cabecera">

        <div>

          <p className="etiqueta">
            Movimientos
          </p>

          <h2>
            Historial
          </h2>

        </div>


        <div className="historial-contador">

          <span>
            ▤
          </span>

          <div>

            <strong>
              {
                movimientosFiltrados
                  .length
              }
            </strong>

            <small>
              {movimientosFiltrados
                .length ===
              1
                ? "movimiento"
                : "movimientos"}
            </small>

          </div>

        </div>

      </div>


      <div className="historial-filtros-superiores">

        <div className="buscador-historial">

          <span>
            ⌕
          </span>

          <input
            type="search"

            placeholder="Buscar movimiento, categoría o nota..."

            value={
              busqueda
            }

            onChange={(e) =>
              cambiarFiltro(
                setBusqueda,
                e.target.value
              )
            }
          />

        </div>


        <select
          value={
            tipo
          }

          onChange={(e) =>
            cambiarFiltro(
              setTipo,
              e.target.value
            )
          }
        >
          <option value="todos">
            Todos los tipos
          </option>

          <option value="gasto">
            Gastos
          </option>

          <option value="ingreso">
            Ingresos
          </option>
        </select>


        <select
          value={
            medio
          }

          onChange={(e) =>
            cambiarFiltro(
              setMedio,
              e.target.value
            )
          }
        >
          <option value="todos">
            Todos los medios
          </option>

          <option value="debito">
            Débito
          </option>

          <option value="credito">
            Crédito
          </option>

          <option value="transferencia">
            Transferencia
          </option>
        </select>

      </div>


      <div className="historial-filtros-inferiores">

        <div className="control-filtro-historial">

          <span>
            Desde
          </span>

          <input
            type="date"

            value={
              fechaDesde
            }

            onChange={(e) =>
              cambiarFiltro(
                setFechaDesde,
                e.target.value
              )
            }
          />

        </div>


        <div className="control-filtro-historial">

          <span>
            Hasta
          </span>

          <input
            type="date"

            value={
              fechaHasta
            }

            onChange={(e) =>
              cambiarFiltro(
                setFechaHasta,
                e.target.value
              )
            }
          />

        </div>


        <div className="control-filtro-historial control-orden">

          <span>
            Orden
          </span>

          <strong>
            ⇅
          </strong>

          <select
            value={
              orden
            }

            onChange={(e) =>
              cambiarFiltro(
                setOrden,
                e.target.value
              )
            }
          >
            <option value="desc">
              Más reciente primero
            </option>

            <option value="asc">
              Más antiguo primero
            </option>
          </select>

        </div>


        <button
          type="button"

          className="boton-limpiar-historial"

          onClick={
            limpiarFiltros
          }
        >
          <span>
            ≡
          </span>

          Limpiar filtros
        </button>

      </div>


      <div className="historial-resumen-moderno">

        <div className="resumen-moderno-item resumen-moderno-ingreso">

          <div className="resumen-moderno-icono">
            ↓
          </div>

          <div>

            <span>
              Ingresos
            </span>

            <strong>
              {formatoCLP(
                totalIngresos
              )}
            </strong>

            <small>
              {ingresosFiltrados.length}{" "}
              {ingresosFiltrados.length ===
              1
                ? "movimiento"
                : "movimientos"}
            </small>

          </div>

        </div>


        <div className="resumen-moderno-item resumen-moderno-gasto">

          <div className="resumen-moderno-icono">
            ↑
          </div>

          <div>

            <span>
              Egresos reales
            </span>

            <strong>
              {formatoCLP(
                totalEgresosReales
              )}
            </strong>

            <small>
              {cantidadEgresosReales}{" "}
              {cantidadEgresosReales ===
              1
                ? "salida real"
                : "salidas reales"}
            </small>

          </div>

        </div>


        <div className="resumen-moderno-item resumen-moderno-resultado">

          <div className="resumen-moderno-icono">
            =
          </div>

          <div>

            <span>
              Resultado real
            </span>

            <strong>
              {formatoCLP(
                resultadoPeriodo
              )}
            </strong>

            <small>
              {resultadoPeriodo >=
              0
                ? "Saldo positivo"
                : "Déficit"}
            </small>

          </div>

        </div>


        <div className="resumen-rango">

          <span>
            ▣
          </span>

          <div>

            <small>
              Rango seleccionado
            </small>

            <strong>
              {fechaDesde
                ? fechaVisual(
                    fechaDesde
                  )
                : "Sin inicio"}

              {" - "}

              {fechaHasta
                ? fechaVisual(
                    fechaHasta
                  )
                : "Sin límite"}
            </strong>


            <small>
              Crédito registrado
            </small>

            <b>
              {formatoCLP(
                totalCreditoRegistrado
              )}
            </b>

          </div>

        </div>

      </div>


      <div className="historial-tabla-cabecera">

        <span>
          Movimiento
        </span>

        <span>
          Fecha
        </span>

        <span>
          Medio
        </span>

        <span>
          Categoría
        </span>

        <span className="alinear-derecha">
          Monto
        </span>

      </div>


      <div className="historial-listado-moderno">

        {movimientosVisibles
          .length ===
        0 ? (

          <div className="historial-vacio">

            <div>
              ⌕
            </div>

            <strong>
              Sin movimientos
            </strong>

            <p>
              No existen movimientos
              para los filtros
              seleccionados.
            </p>

          </div>

        ) : (

          movimientosVisibles.map(
            (
              movimiento
            ) => (

              <button
                key={
                  movimiento.id
                }

                type="button"

                className="historial-fila-moderna"

                onClick={() =>
                  onSeleccionar(
                    movimiento.id
                  )
                }
              >

                <div className="historial-movimiento-col">

                  <div
                    className={
                      movimiento.tipo ===
                      "ingreso"
                        ? "historial-icono-fila icono-ingreso"
                        : "historial-icono-fila icono-gasto"
                    }
                  >
                    {iconoMovimiento(
                      movimiento
                    )}
                  </div>


                  <div className="historial-descripcion">

                    <strong>
                      {
                        movimiento
                          .descripcion
                      }
                    </strong>


                    {movimiento
                      .notas && (

                      <small>
                        {
                          movimiento
                            .notas
                        }
                      </small>

                    )}


                    <div>

                      <span className="etiqueta-medio-mini">
                        {etiquetaMedio(
                          movimiento
                            .medio_pago
                        )}
                      </span>


                      <small>
                        ·{" "}
                        {fechaVisual(
                          movimiento.fecha
                        )}
                      </small>


                      {movimiento
                        .numero_cuotas >
                        1 && (

                        <small>
                          ·{" "}
                          {
                            movimiento
                              .numero_cuotas
                          }{" "}
                          cuotas
                        </small>

                      )}

                    </div>

                  </div>

                </div>


                <div className="historial-fecha-col">

                  <strong>
                    {fechaVisual(
                      movimiento.fecha
                    )}
                  </strong>

                  <small>
                    {diaSemana(
                      movimiento.fecha
                    )}
                  </small>

                </div>


                <div className="historial-medio-col">
                  {etiquetaMedio(
                    movimiento
                      .medio_pago
                  )}
                </div>


                <div>

                  <span className="historial-categoria">
                    {movimiento
                      .categoria ||
                      "Sin categoría"}
                  </span>

                </div>


                <div className="historial-monto-col">

                  <strong
                    className={
                      movimiento.tipo ===
                      "ingreso"
                        ? "monto-positivo"
                        : "monto-negativo"
                    }
                  >

                    {movimiento.tipo ===
                    "ingreso"
                      ? "+"
                      : "-"}

                    {formatoCLP(
                      movimiento.monto
                    )}

                  </strong>


                  <span>
                    ›
                  </span>

                </div>

              </button>

            )
          )

        )}

      </div>


      {movimientosFiltrados
        .length >
        0 && (

        <div className="historial-paginacion-moderna">

          <p>
            Mostrando{" "}

            <strong>
              {inicioMostrado}-
              {finMostrado}
            </strong>

            {" "}de{" "}

            <strong>
              {
                movimientosFiltrados
                  .length
              }
            </strong>

            {" "}movimientos
          </p>


          <div className="historial-paginacion-acciones">

            {movimientosFiltrados
              .length >
              registrosPorPagina && (

              <button
                type="button"

                className="historial-btn-mostrar"

                onClick={() => {

                  setMostrarTodas(
                    (
                      actual
                    ) =>
                      !actual
                  );

                  setPaginaActual(
                    1
                  );
                }}
              >
                ≡{" "}

                {mostrarTodas
                  ? "Mostrar 10 por página"
                  : "Mostrar todas"}
              </button>

            )}


            {!mostrarTodas &&
              movimientosFiltrados
                .length >
                registrosPorPagina && (

              <>

                <button
                  type="button"

                  className="historial-btn-pagina"

                  disabled={
                    paginaVisual ===
                    1
                  }

                  onClick={() =>
                    setPaginaActual(
                      (
                        pagina
                      ) =>
                        Math.max(
                          1,
                          pagina -
                            1
                        )
                    )
                  }
                >
                  ‹ Anterior
                </button>


                {Array.from(
                  {
                    length:
                      totalPaginas,
                  },
                  (
                    _,
                    indice
                  ) =>
                    indice +
                    1
                ).map(
                  (
                    numero
                  ) => (

                    <button
                      type="button"

                      key={
                        numero
                      }

                      className={
                        paginaVisual ===
                        numero
                          ? "historial-numero-pagina historial-numero-activo"
                          : "historial-numero-pagina"
                      }

                      onClick={() =>
                        setPaginaActual(
                          numero
                        )
                      }
                    >
                      {numero}
                    </button>

                  )
                )}


                <button
                  type="button"

                  className="historial-btn-pagina"

                  disabled={
                    paginaVisual ===
                    totalPaginas
                  }

                  onClick={() =>
                    setPaginaActual(
                      (
                        pagina
                      ) =>
                        Math.min(
                          totalPaginas,
                          pagina +
                            1
                        )
                    )
                  }
                >
                  Siguiente ›
                </button>

              </>

            )}

          </div>

        </div>

      )}

    </section>
  );
}


export default Historial;