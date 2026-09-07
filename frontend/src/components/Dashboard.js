import {
  useEffect,
  useMemo,
  useState
} from "react";

import "./Dashboard.css";


function Dashboard({
  dashboard,
  formatoCLP,
  API,
  periodo,
  periodoMaximo,
  onCambiarPeriodo,
  onAbrirPresupuesto,
}) {
  const [
    presupuestos,
    setPresupuestos
  ] = useState(null);

  const [
    cargandoPresupuestos,
    setCargandoPresupuestos
  ] = useState(false);


  /*
   * =========================================
   * PRESUPUESTOS DEL PERÍODO
   * =========================================
   */

  useEffect(() => {
    const cargarPresupuestos =
      async () => {
        try {
          setCargandoPresupuestos(
            true
          );

          const respuesta =
            await fetch(
              `${API}/presupuestos?periodo=${periodo}`
            );


          if (
            !respuesta.ok
          ) {
            throw new Error(
              "No se pudieron cargar los presupuestos."
            );
          }


          const resultado =
            await respuesta
              .json();


          setPresupuestos(
            resultado
          );

        } catch (error) {
          console.error(
            "Error cargando presupuestos:",
            error
          );

          setPresupuestos(
            null
          );

        } finally {
          setCargandoPresupuestos(
            false
          );
        }
      };


    cargarPresupuestos();

  }, [
    API,
    periodo,
    dashboard
  ]);


  /*
   * =========================================
   * NOMBRE DEL PERÍODO
   * =========================================
   */

  const nombrePeriodo =
    useMemo(() => {
      const [
        anio,
        mes
      ] =
        periodo
          .split("-")
          .map(
            Number
          );


      return new Date(
        anio,
        mes - 1,
        1
      )
        .toLocaleDateString(
          "es-CL",
          {
            month:
              "long",

            year:
              "numeric",
          }
        )
        .replace(
          /^./,
          (
            letra
          ) =>
            letra
              .toUpperCase()
        );

    }, [
      periodo
    ]);


  /*
   * =========================================
   * CAMBIAR MES
   * =========================================
   */

  const moverMes = (
    cantidad
  ) => {
    const [
      anio,
      mes
    ] =
      periodo
        .split("-")
        .map(
          Number
        );


    const fecha =
      new Date(
        anio,
        mes - 1 +
          cantidad,
        1
      );


    const nuevoPeriodo =
      `${fecha.getFullYear()}-${String(
        fecha.getMonth() + 1
      ).padStart(
        2,
        "0"
      )}`;


    /*
     * Evitamos avanzar
     * más allá del mes actual.
     */

    if (
      periodoMaximo &&
      nuevoPeriodo >
      periodoMaximo
    ) {
      return;
    }


    onCambiarPeriodo(
      nuevoPeriodo
    );
  };


  /*
   * =========================================
   * DATOS PRINCIPALES
   * =========================================
   */

  const saldoDisponible =
    Number(
      dashboard
        ?.saldo_disponible ||
        0
    );


  const creditoPendiente =
    Number(
      dashboard
        ?.credito_pendiente ||
        0
    );


  const disponibleDespuesDeuda =
    saldoDisponible -
    creditoPendiente;


  const ingresosMes =
    Number(
      dashboard
        ?.ingresos_mes ||
        0
    );


  const egresosMes =
    Number(
      dashboard
        ?.egresos_mes ||
        0
    );


  const debitoMes =
    Number(
      dashboard
        ?.debito_mes ||
        0
    );


  const cuotasPagadasMes =
    Number(
      dashboard
        ?.cuotas_pagadas_mes ||
        0
    );


  const resultadoMes =
    Number(
      dashboard
        ?.resultado_mes ||
        0
    );


  /*
   * =========================================
   * CATEGORÍAS
   * =========================================
   */

  const categorias =
    dashboard
      ?.gastos_por_categoria ||
    [];


  const totalCategorias =
    categorias.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.total ||
          0
        ),
      0
    );


  const mayorCategoria =
    categorias.reduce(
      (
        mayor,
        item
      ) =>
        Math.max(
          mayor,
          Number(
            item.total ||
            0
          )
        ),
      0
    );


  /*
   * =========================================
   * EVOLUCIÓN
   * =========================================
   */

  const evolucion =
    dashboard
      ?.evolucion_mensual ||
    [];


  const valorMaximoEvolucion =
    evolucion.reduce(
      (
        mayor,
        item
      ) =>
        Math.max(
          mayor,

          Number(
            item.ingresos ||
            0
          ),

          Number(
            item.egresos ||
            0
          )
        ),
      0
    );


  /*
   * =========================================
   * PRESUPUESTO
   * =========================================
   */

  const resumenPresupuesto =
    presupuestos
      ?.resumen || {
        presupuestado:
          0,

        gastado:
          0,

        disponible:
          0,

        porcentaje:
          0,
      };


  const porcentajePresupuesto =
    Number(
      resumenPresupuesto
        .porcentaje ||
        0
    );


  const anchoPresupuesto =
    Math.min(
      Math.max(
        porcentajePresupuesto,
        0
      ),
      100
    );


  const categoriasPresupuesto =
    presupuestos
      ?.categorias ||
    [];


  const categoriasSuperadas =
    categoriasPresupuesto
      .filter(
        (
          categoria
        ) =>
          categoria.estado ===
          "superado"
      );


  const categoriasAlerta =
    categoriasPresupuesto
      .filter(
        (
          categoria
        ) =>
          categoria.estado ===
          "alerta"
      );


  const alertasPresupuesto = [
    ...categoriasSuperadas,
    ...categoriasAlerta
  ].slice(
    0,
    4
  );


  /*
   * =========================================
   * FORMATO MES GRÁFICO
   * =========================================
   */

  const nombreMes = (
    numero
  ) => {
    const fecha =
      new Date(
        2020,
        Number(
          numero
        ) - 1,
        1
      );


    return fecha
      .toLocaleDateString(
        "es-CL",
        {
          month:
            "short",
        }
      )
      .replace(
        ".",
        ""
      )
      .replace(
        /^./,
        (
          letra
        ) =>
          letra
            .toUpperCase()
      );
  };


  /*
   * =========================================
   * FECHA
   * =========================================
   */

  const fechaVisual = (
    fecha
  ) => {
    if (!fecha) {
      return "";
    }


    const soloFecha =
      String(
        fecha
      ).slice(
        0,
        10
      );


    return new Date(
      `${soloFecha}T12:00:00`
    ).toLocaleDateString(
      "es-CL"
    );
  };


  return (
    <div className="dashboard-moderno">

      {/* =====================================
          SELECTOR DE PERÍODO
          ===================================== */}

      <section
        className="panel"
        style={{
          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "space-between",

          gap:
            "16px",

          flexWrap:
            "wrap",
        }}
      >

        <div>

          <p className="etiqueta">
            Período de análisis
          </p>

          <h3
            style={{
              margin:
                "5px 0 0",
            }}
          >
            {nombrePeriodo}
          </h3>

          <small
            style={{
              color:
                "#7d899a",
            }}
          >
            El saldo principal sigue
            representando tu saldo
            acumulado actual.
          </small>

        </div>


        <div
          style={{
            display:
              "flex",

            alignItems:
              "center",

            gap:
              "8px",
          }}
        >

          <button
            type="button"

            className="boton-secundario"

            onClick={() =>
              moverMes(
                -1
              )
            }
          >
            ‹
          </button>


          <input
            type="month"

            value={
              periodo
            }

            max={
              periodoMaximo
            }

            onChange={(
              evento
            ) =>
              onCambiarPeriodo(
                evento
                  .target
                  .value
              )
            }

            style={{
              minHeight:
                "42px",

              border:
                "1px solid #dde3ec",

              borderRadius:
                "11px",

              padding:
                "8px 12px",

              background:
                "white",

              color:
                "#354257",
            }}
          />


          <button
            type="button"

            className="boton-secundario"

            disabled={
              periodo ===
              periodoMaximo
            }

            onClick={() =>
              moverMes(
                1
              )
            }
          >
            ›
          </button>

        </div>

      </section>


      {/* =====================================
          SALDO ACTUAL
          ===================================== */}

      <section className="dashboard-saldo-principal">

        <div className="dashboard-saldo-contenido">

          <p className="dashboard-etiqueta-clara">
            Saldo disponible actual
          </p>

          <h2>
            {formatoCLP(
              saldoDisponible
            )}
          </h2>

          <div className="dashboard-saldo-detalles">

            <span>
              Saldo inicial{" "}

              <strong>
                {formatoCLP(
                  dashboard
                    ?.saldo_inicial
                )}
              </strong>
            </span>


            <span>
              Cuotas pagadas acumuladas{" "}

              <strong>
                {formatoCLP(
                  dashboard
                    ?.cuotas_pagadas
                )}
              </strong>
            </span>

          </div>

        </div>


        <div className="dashboard-saldo-icono">
          $
        </div>

      </section>


      {/* =====================================
          RESUMEN DEL PERÍODO
          ===================================== */}

      <section className="dashboard-grid-resumen">

        <TarjetaDashboard
          titulo={
            `Ingresos · ${nombrePeriodo}`
          }

          monto={
            ingresosMes
          }

          detalle={
            `${
              dashboard
                ?.cantidad_ingresos_mes ||
              0
            } movimientos`
          }

          icono="↓"

          tipo="ingreso"

          formatoCLP={
            formatoCLP
          }
        />


        <TarjetaDashboard
          titulo={
            `Egresos · ${nombrePeriodo}`
          }

          monto={
            egresosMes
          }

          detalle="Débito + cuotas pagadas"

          icono="↑"

          tipo="gasto"

          formatoCLP={
            formatoCLP
          }
        />


        <TarjetaDashboard
          titulo="Crédito pendiente actual"

          monto={
            creditoPendiente
          }

          detalle="Cuotas aún no pagadas"

          icono="◇"

          tipo="credito"

          formatoCLP={
            formatoCLP
          }
        />


        <TarjetaDashboard
          titulo={
            `Resultado · ${nombrePeriodo}`
          }

          monto={
            resultadoMes
          }

          detalle={
            resultadoMes >= 0
              ? "Balance del período positivo"
              : "Egresos mayores a ingresos"
          }

          icono="="

          tipo={
            resultadoMes >= 0
              ? "resultado-positivo"
              : "resultado-negativo"
          }

          formatoCLP={
            formatoCLP
          }
        />

      </section>


      {/* =====================================
          PRESUPUESTO
          ===================================== */}

      <section className="dashboard-presupuesto-panel">

        <div className="dashboard-seccion-cabecera">

          <div>

            <p className="etiqueta">
              Presupuesto
            </p>

            <h3>
              {nombrePeriodo}
            </h3>

          </div>


          {!cargandoPresupuestos &&
            presupuestos && (

            <span
              className={
                porcentajePresupuesto >
                100
                  ? "dashboard-presupuesto-estado presupuesto-superado"
                  : porcentajePresupuesto >=
                    80
                  ? "dashboard-presupuesto-estado presupuesto-alerta"
                  : "dashboard-presupuesto-estado presupuesto-ok"
              }
            >
              {porcentajePresupuesto >
              100
                ? "Superado"
                : porcentajePresupuesto >=
                  80
                ? "Atención"
                : "Controlado"}
            </span>

          )}

        </div>


        {cargandoPresupuestos ? (

          <div className="dashboard-presupuesto-cargando">
            Cargando presupuesto...
          </div>

        ) : !presupuestos ? (

          <div className="dashboard-presupuesto-sin-datos">
            No fue posible obtener
            la información de presupuestos.
          </div>

        ) : Number(
            resumenPresupuesto
              .presupuestado
          ) === 0 ? (

          <div className="dashboard-presupuesto-vacio">

            <div>
              $
            </div>

            <div>

              <strong>
                Sin presupuesto configurado
              </strong>

              <p>
                No existen límites
                presupuestarios para{" "}
                {nombrePeriodo}.
              </p>


              <button
                type="button"

                className="dashboard-ir-presupuestos"

                onClick={() =>
                  onAbrirPresupuesto(
                    null
                  )
                }
              >
                Ir a Presupuestos →
              </button>

            </div>

          </div>

        ) : (

          <>

            <div className="dashboard-presupuesto-resumen">

              <div>
                <span>
                  Presupuestado
                </span>

                <strong>
                  {formatoCLP(
                    resumenPresupuesto
                      .presupuestado
                  )}
                </strong>
              </div>


              <div>
                <span>
                  Gastado
                </span>

                <strong className="dashboard-presupuesto-gastado">
                  {formatoCLP(
                    resumenPresupuesto
                      .gastado
                  )}
                </strong>
              </div>


              <div>
                <span>
                  Disponible
                </span>

                <strong
                  className={
                    Number(
                      resumenPresupuesto
                        .disponible
                    ) >= 0
                      ? "dashboard-presupuesto-disponible"
                      : "dashboard-presupuesto-negativo"
                  }
                >
                  {formatoCLP(
                    resumenPresupuesto
                      .disponible
                  )}
                </strong>
              </div>


              <div>
                <span>
                  Utilizado
                </span>

                <strong>
                  {porcentajePresupuesto
                    .toFixed(
                      0
                    )}
                  %
                </strong>
              </div>

            </div>


            <div className="dashboard-presupuesto-progreso">

              <div className="dashboard-presupuesto-barra-fondo">

                <div
                  className={
                    porcentajePresupuesto >
                    100
                      ? "dashboard-presupuesto-barra barra-superada-dashboard"
                      : porcentajePresupuesto >=
                        80
                      ? "dashboard-presupuesto-barra barra-alerta-dashboard"
                      : "dashboard-presupuesto-barra barra-ok-dashboard"
                  }

                  style={{
                    width:
                      `${anchoPresupuesto}%`,
                  }}
                />

              </div>


              <div className="dashboard-presupuesto-progreso-pie">

                <span>
                  {formatoCLP(
                    resumenPresupuesto
                      .gastado
                  )}
                  {" "}utilizados
                </span>


                <div className="dashboard-presupuesto-pie-derecha">

                  <strong>
                    {porcentajePresupuesto
                      .toFixed(
                        0
                      )}
                    %
                  </strong>


                  <button
                    type="button"

                    onClick={() =>
                      onAbrirPresupuesto(
                        null
                      )
                    }
                  >
                    Ver presupuestos →
                  </button>

                </div>

              </div>

            </div>

          </>

        )}

      </section>


      {/* =====================================
          ALERTAS
          ===================================== */}

      {alertasPresupuesto.length >
        0 && (

        <section className="dashboard-alertas-presupuesto">

          <div className="dashboard-seccion-cabecera">

            <div>

              <p className="etiqueta">
                Atención
              </p>

              <h3>
                Alertas de presupuesto
              </h3>

            </div>


            <span className="dashboard-alertas-contador">
              {
                alertasPresupuesto
                  .length
              }
            </span>

          </div>


          <div className="dashboard-alertas-lista">

            {alertasPresupuesto.map(
              (
                categoria
              ) => {

                const superada =
                  categoria.estado ===
                  "superado";


                const exceso =
                  Math.abs(
                    Number(
                      categoria
                        .disponible ||
                      0
                    )
                  );


                return (
                  <button
                    type="button"

                    key={
                      categoria
                        .categoria
                    }

                    className={
                      superada
                        ? "dashboard-alerta-item alerta-roja dashboard-alerta-clickeable"
                        : "dashboard-alerta-item alerta-amarilla dashboard-alerta-clickeable"
                    }

                    onClick={() =>
                      onAbrirPresupuesto(
                        categoria
                      )
                    }
                  >

                    <div className="dashboard-alerta-icono">
                      {superada
                        ? "!"
                        : "↑"}
                    </div>


                    <div className="dashboard-alerta-contenido">

                      <strong>
                        {
                          categoria
                            .categoria
                        }
                      </strong>


                      <span>
                        {superada
                          ? `Superó el presupuesto en ${formatoCLP(
                              exceso
                            )}`
                          : `Utilizado ${Number(
                              categoria
                                .porcentaje ||
                              0
                            ).toFixed(
                              0
                            )}% del presupuesto`
                        }
                      </span>

                    </div>


                    <div className="dashboard-alerta-montos">

                      <strong>
                        {formatoCLP(
                          categoria
                            .gastado
                        )}
                      </strong>


                      <small>
                        de{" "}

                        {formatoCLP(
                          categoria
                            .presupuesto
                        )}
                      </small>


                      <span className="dashboard-alerta-ver">
                        Revisar →
                      </span>

                    </div>

                  </button>
                );
              }
            )}

          </div>

        </section>

      )}


      {/* =====================================
          FLUJO DEL PERÍODO
          ===================================== */}

      <section className="dashboard-flujo-mes">

        <div className="dashboard-seccion-cabecera">

          <div>

            <p className="etiqueta">
              Flujo mensual
            </p>

            <h3>
              {nombrePeriodo}
            </h3>

          </div>


          <span className="dashboard-badge">
            Período seleccionado
          </span>

        </div>


        <div className="dashboard-flujo-grid">

          <div className="dashboard-flujo-item">

            <div className="dashboard-flujo-icono flujo-debito">
              ↑
            </div>

            <div>
              <span>
                Débito
              </span>

              <strong>
                {formatoCLP(
                  debitoMes
                )}
              </strong>

              <small>
                Pagado directamente
              </small>
            </div>

          </div>


          <div className="dashboard-flujo-separador">
            +
          </div>


          <div className="dashboard-flujo-item">

            <div className="dashboard-flujo-icono flujo-cuotas">
              ◇
            </div>

            <div>
              <span>
                Cuotas pagadas
              </span>

              <strong>
                {formatoCLP(
                  cuotasPagadasMes
                )}
              </strong>

              <small>
                {
                  dashboard
                    ?.cantidad_cuotas_pagadas_mes ||
                  0
                }{" "}
                cuotas
              </small>
            </div>

          </div>


          <div className="dashboard-flujo-separador">
            =
          </div>


          <div className="dashboard-flujo-item dashboard-flujo-total">

            <div className="dashboard-flujo-icono flujo-total">
              $
            </div>

            <div>
              <span>
                Egresos reales
              </span>

              <strong>
                {formatoCLP(
                  egresosMes
                )}
              </strong>

              <small>
                Salida del período
              </small>
            </div>

          </div>

        </div>

      </section>


      {/* =====================================
          GRÁFICOS
          ===================================== */}

      <section className="dashboard-grid-graficos">

        <div className="dashboard-panel">

          <div className="dashboard-seccion-cabecera">

            <div>
              <p className="etiqueta">
                Distribución
              </p>

              <h3>
                Gastos por categoría
              </h3>
            </div>


            <strong className="dashboard-total-secundario">
              {formatoCLP(
                totalCategorias
              )}
            </strong>

          </div>


          {categorias.length ===
          0 ? (

            <div className="dashboard-sin-datos">
              No existen gastos reales
              registrados durante este
              período.
            </div>

          ) : (

            <div className="dashboard-categorias">

              {categorias.map(
                (
                  categoria,
                  indice
                ) => {

                  const total =
                    Number(
                      categoria
                        .total ||
                      0
                    );


                  const porcentaje =
                    totalCategorias >
                    0
                      ? (
                          total /
                          totalCategorias
                        ) * 100
                      : 0;


                  const ancho =
                    mayorCategoria >
                    0
                      ? (
                          total /
                          mayorCategoria
                        ) * 100
                      : 0;


                  return (
                    <div
                      className="dashboard-categoria-fila"

                      key={
                        `${categoria.categoria}-${indice}`
                      }
                    >

                      <div className="dashboard-categoria-info">

                        <div>

                          <span className="dashboard-categoria-punto">
                            {indice + 1}
                          </span>


                          <strong>
                            {
                              categoria
                                .categoria
                            }
                          </strong>

                        </div>


                        <div>

                          <strong>
                            {formatoCLP(
                              total
                            )}
                          </strong>


                          <small>
                            {porcentaje
                              .toFixed(
                                0
                              )}
                            %
                          </small>

                        </div>

                      </div>


                      <div className="dashboard-barra-fondo">

                        <div
                          className="dashboard-barra-categoria"

                          style={{
                            width:
                              `${Math.max(
                                ancho,
                                3
                              )}%`,
                          }}
                        />

                      </div>


                      <small className="dashboard-categoria-cantidad">
                        {
                          categoria
                            .cantidad
                        }{" "}

                        {Number(
                          categoria
                            .cantidad
                        ) === 1
                          ? "movimiento"
                          : "movimientos"}
                      </small>

                    </div>
                  );
                }
              )}

            </div>

          )}

        </div>


        {/* POSICIÓN ACTUAL */}

        <div className="dashboard-panel dashboard-posicion">

          <div className="dashboard-seccion-cabecera">

            <div>

              <p className="etiqueta">
                Posición actual
              </p>

              <h3>
                Disponible después de deuda
              </h3>

            </div>

          </div>


          <div className="dashboard-posicion-principal">

            <span>
              Disponible real
            </span>


            <strong
              className={
                disponibleDespuesDeuda >=
                0
                  ? "dashboard-valor-positivo"
                  : "dashboard-valor-negativo"
              }
            >
              {formatoCLP(
                disponibleDespuesDeuda
              )}
            </strong>

          </div>


          <div className="dashboard-posicion-desglose">

            <div>
              <span>
                Saldo actual
              </span>

              <strong>
                {formatoCLP(
                  saldoDisponible
                )}
              </strong>
            </div>


            <span className="dashboard-operador">
              −
            </span>


            <div>
              <span>
                Crédito pendiente
              </span>

              <strong>
                {formatoCLP(
                  creditoPendiente
                )}
              </strong>
            </div>

          </div>


          <p className="dashboard-posicion-ayuda">
            Esta información representa
            tu posición financiera actual
            y no cambia al navegar por
            meses anteriores.
          </p>

        </div>

      </section>


      {/* =====================================
          EVOLUCIÓN
          ===================================== */}

      <section className="dashboard-panel dashboard-evolucion">

        <div className="dashboard-seccion-cabecera">

          <div>

            <p className="etiqueta">
              Tendencia
            </p>

            <h3>
              6 meses hasta{" "}
              {nombrePeriodo}
            </h3>

          </div>


          <div className="dashboard-leyenda">

            <span>
              <i className="leyenda-ingresos" />
              Ingresos
            </span>

            <span>
              <i className="leyenda-egresos" />
              Egresos
            </span>

          </div>

        </div>


        <div className="dashboard-grafico-meses">

          {evolucion.map(
            (
              mes
            ) => {

              const ingresos =
                Number(
                  mes.ingresos ||
                  0
                );


              const egresos =
                Number(
                  mes.egresos ||
                  0
                );


              const alturaIngresos =
                valorMaximoEvolucion >
                0
                  ? (
                      ingresos /
                      valorMaximoEvolucion
                    ) * 100
                  : 0;


              const alturaEgresos =
                valorMaximoEvolucion >
                0
                  ? (
                      egresos /
                      valorMaximoEvolucion
                    ) * 100
                  : 0;


              return (
                <div
                  className="dashboard-mes"

                  key={
                    mes.periodo
                  }
                >

                  <div className="dashboard-mes-valores">

                    <span>
                      {formatoCLP(
                        ingresos
                      )}
                    </span>

                    <span>
                      {formatoCLP(
                        egresos
                      )}
                    </span>

                  </div>


                  <div className="dashboard-columnas">

                    <div
                      className="dashboard-columna columna-ingreso"

                      style={{
                        height:
                          `${Math.max(
                            alturaIngresos,
                            ingresos >
                            0
                              ? 5
                              : 0
                          )}%`,
                      }}
                    />


                    <div
                      className="dashboard-columna columna-egreso"

                      style={{
                        height:
                          `${Math.max(
                            alturaEgresos,
                            egresos >
                            0
                              ? 5
                              : 0
                          )}%`,
                      }}
                    />

                  </div>


                  <strong>
                    {nombreMes(
                      mes.mes
                    )}
                  </strong>


                  <small>
                    {mes.anio}
                  </small>

                </div>
              );
            }
          )}

        </div>

      </section>


      {/* =====================================
          PRÓXIMA CUOTA ACTUAL
          ===================================== */}

      <section className="dashboard-panel dashboard-proxima-cuota">

        <div className="dashboard-seccion-cabecera">

          <div>

            <p className="etiqueta">
              Compromiso actual
            </p>

            <h3>
              Próxima cuota
            </h3>

          </div>


          {dashboard
            ?.proxima_cuota && (

            <span className="dashboard-badge-credito">
              Crédito
            </span>

          )}

        </div>


        {dashboard
          ?.proxima_cuota ? (

          <div className="dashboard-proxima-contenido">

            <div className="dashboard-proxima-descripcion">

              <div className="dashboard-proxima-icono">
                ◇
              </div>


              <div>

                <strong>
                  {
                    dashboard
                      .proxima_cuota
                      .descripcion
                  }
                </strong>


                <span>
                  {
                    dashboard
                      .proxima_cuota
                      .categoria ||
                    "Sin categoría"
                  }
                </span>

              </div>

            </div>


            <div>
              <span>
                Cuota
              </span>

              <strong>
                {
                  dashboard
                    .proxima_cuota
                    .numero
                }{" "}
                de{" "}
                {
                  dashboard
                    .proxima_cuota
                    .total_cuotas
                }
              </strong>
            </div>


            <div>
              <span>
                Vencimiento
              </span>

              <strong>
                {fechaVisual(
                  dashboard
                    .proxima_cuota
                    .fecha_vencimiento
                )}
              </strong>
            </div>


            <div>
              <span>
                Monto
              </span>

              <strong className="dashboard-proxima-monto">
                {formatoCLP(
                  dashboard
                    .proxima_cuota
                    .monto
                )}
              </strong>
            </div>

          </div>

        ) : (

          <div className="dashboard-sin-cuotas">

            <div>
              ✓
            </div>

            <strong>
              Sin cuotas pendientes
            </strong>

            <p>
              No existen compromisos
              de crédito pendientes.
            </p>

          </div>

        )}

      </section>

    </div>
  );
}


/*
 * =========================================
 * TARJETA
 * =========================================
 */

function TarjetaDashboard({
  titulo,
  monto,
  detalle,
  icono,
  tipo,
  formatoCLP,
}) {
  return (
    <article
      className={
        `dashboard-tarjeta ${tipo}`
      }
    >

      <div className="dashboard-tarjeta-icono">
        {icono}
      </div>


      <div className="dashboard-tarjeta-contenido">

        <span>
          {titulo}
        </span>


        <strong>
          {formatoCLP(
            monto
          )}
        </strong>


        <small>
          {detalle}
        </small>

      </div>

    </article>
  );
}


export default Dashboard;