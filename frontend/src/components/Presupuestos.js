import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import "./Presupuestos.css";


function Presupuestos({
  API,
  formatoCLP,
  periodoExterno,
  onCambiarPeriodoExterno,
  categoriaInicial = null,
}) {
  const periodo =
    periodoExterno;


  const [
    datos,
    setDatos
  ] = useState(null);

  const [
    cargando,
    setCargando
  ] = useState(true);

  const [
    error,
    setError
  ] = useState("");

  const [
    mensaje,
    setMensaje
  ] = useState("");

  const [
    mostrarFormulario,
    setMostrarFormulario
  ] = useState(false);

  const [
    guardando,
    setGuardando
  ] = useState(false);

  const [
    categoriaEditando,
    setCategoriaEditando
  ] = useState(null);

  const [
    formulario,
    setFormulario
  ] = useState({
    categoria:
      "Alimentación",

    monto:
      "",
  });

  const [
    presupuestoEliminar,
    setPresupuestoEliminar
  ] = useState(null);

  const [
    eliminando,
    setEliminando
  ] = useState(false);


  const categoriaInicialProcesada =
    useRef(false);


  const categoriasDisponibles = [
    "Alimentación",
    "Transporte",
    "Hogar",
    "Salud",
    "Entretenimiento",
    "Compras",
    "Educación",
    "Otros",
  ];


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
   * CARGAR
   * =========================================
   */

  const cargarPresupuestos =
    useCallback(
      async () => {
        try {
          setCargando(
            true
          );

          setError("");


          const respuesta =
            await fetch(
              `${API}/presupuestos?periodo=${periodo}`
            );


          const resultado =
            await respuesta
              .json();


          if (
            !respuesta.ok
          ) {
            throw new Error(
              resultado.mensaje ||
                "No se pudieron cargar los presupuestos."
            );
          }


          setDatos(
            resultado
          );

        } catch (error) {
          console.error(
            error
          );

          setError(
            error.message
          );

        } finally {
          setCargando(
            false
          );
        }
      },
      [
        API,
        periodo
      ]
    );


  useEffect(() => {
    cargarPresupuestos();
  }, [
    cargarPresupuestos
  ]);


  useEffect(() => {
    categoriaInicialProcesada
      .current =
      false;
  }, [
    categoriaInicial,
    periodo
  ]);


  /*
   * =========================================
   * NOMBRE PERÍODO
   * =========================================
   */

  const nombrePeriodo =
    useMemo(() => {
      if (
        !periodo
      ) {
        return "";
      }


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


    const nuevaFecha =
      new Date(
        anio,
        mes - 1 +
          cantidad,
        1
      );


    const nuevoPeriodo =
      `${nuevaFecha.getFullYear()}-${String(
        nuevaFecha.getMonth() + 1
      ).padStart(
        2,
        "0"
      )}`;


    onCambiarPeriodoExterno(
      nuevoPeriodo
    );
  };


  /*
   * =========================================
   * MENSAJE
   * =========================================
   */

  const mostrarMensaje = (
    texto
  ) => {
    setMensaje(
      texto
    );


    window.setTimeout(
      () => {
        setMensaje(
          ""
        );
      },
      3000
    );
  };


  /*
   * =========================================
   * NUEVO
   * =========================================
   */

  const abrirNuevo =
    () => {
      setCategoriaEditando(
        null
      );


      const categoriasConPresupuesto =
        new Set(
          (
            datos
              ?.categorias ||
            []
          )
            .filter(
              (
                item
              ) =>
                item.id
            )
            .map(
              (
                item
              ) =>
                item.categoria
            )
        );


      const primeraDisponible =
        categoriasDisponibles.find(
          (
            categoria
          ) =>
            !categoriasConPresupuesto.has(
              categoria
            )
        ) ||
        "Otros";


      setFormulario({
        categoria:
          primeraDisponible,

        monto:
          "",
      });


      setMostrarFormulario(
        true
      );
    };


  /*
   * =========================================
   * EDITAR
   * =========================================
   */

  const abrirEditar = (
    categoria
  ) => {
    setCategoriaEditando(
      categoria
    );


    const montoActual =
      Number(
        categoria
          .presupuesto ||
        0
      );


    setFormulario({
      categoria:
        categoria
          .categoria,

      monto:
        montoActual > 0
          ? String(
              Math.trunc(
                montoActual
              )
            )
          : "",
    });


    setMostrarFormulario(
      true
    );
  };


  /*
   * =========================================
   * ABRIR DESDE DASHBOARD
   * =========================================
   */

  useEffect(() => {
    if (
      cargando ||
      !datos ||
      categoriaInicialProcesada
        .current
    ) {
      return;
    }


    categoriaInicialProcesada
      .current =
      true;


    if (
      !categoriaInicial
    ) {
      return;
    }


    const nombreCategoria =
      typeof categoriaInicial ===
      "string"
        ? categoriaInicial
        : categoriaInicial
            ?.categoria;


    if (
      !nombreCategoria
    ) {
      return;
    }


    const encontrada =
      (
        datos
          ?.categorias ||
        []
      ).find(
        (
          item
        ) =>
          item.categoria ===
          nombreCategoria
      );


    if (
      encontrada
    ) {
      abrirEditar(
        encontrada
      );
    }

  }, [
    cargando,
    datos,
    categoriaInicial
  ]);


  /*
   * =========================================
   * FORMULARIO
   * =========================================
   */

  const cambiarFormulario = (
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
   * GUARDAR
   * =========================================
   */

  const guardarPresupuesto =
    async (
      evento
    ) => {
      evento.preventDefault();


      const monto =
        Number(
          formulario
            .monto
        );


      if (
        !formulario
          .categoria
          .trim()
      ) {
        setError(
          "Debes seleccionar una categoría."
        );

        return;
      }


      if (
        formulario.monto ===
        "" ||
        !Number.isFinite(
          monto
        ) ||
        monto < 0
      ) {
        setError(
          "El presupuesto debe ser un monto válido."
        );

        return;
      }


      try {
        setGuardando(
          true
        );

        setError("");


        const respuesta =
          await fetch(
            `${API}/presupuestos`,
            {
              method:
                "PUT",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  categoria:
                    formulario
                      .categoria,

                  monto,

                  periodo,
                }),
            }
          );


        const resultado =
          await respuesta
            .json();


        if (
          !respuesta.ok
        ) {
          throw new Error(
            resultado.mensaje ||
              "No se pudo guardar el presupuesto."
          );
        }


        await cargarPresupuestos();


        setMostrarFormulario(
          false
        );


        setCategoriaEditando(
          null
        );


        mostrarMensaje(
          "Presupuesto guardado correctamente"
        );

      } catch (error) {
        console.error(
          error
        );


        setError(
          error.message
        );

      } finally {
        setGuardando(
          false
        );
      }
    };


  /*
   * =========================================
   * ELIMINAR
   * =========================================
   */

  const eliminarPresupuesto =
    async () => {
      if (
        !presupuestoEliminar
          ?.id
      ) {
        return;
      }


      try {
        setEliminando(
          true
        );

        setError("");


        const respuesta =
          await fetch(
            `${API}/presupuestos/${presupuestoEliminar.id}`,
            {
              method:
                "DELETE",
            }
          );


        const resultado =
          await respuesta
            .json();


        if (
          !respuesta.ok
        ) {
          throw new Error(
            resultado.mensaje ||
              "No se pudo eliminar el presupuesto."
          );
        }


        await cargarPresupuestos();


        setPresupuestoEliminar(
          null
        );


        mostrarMensaje(
          "Presupuesto eliminado correctamente"
        );

      } catch (error) {
        console.error(
          error
        );


        setError(
          error.message
        );

      } finally {
        setEliminando(
          false
        );
      }
    };


  /*
   * =========================================
   * RESUMEN
   * =========================================
   */

  const categorias =
    datos
      ?.categorias ||
    [];


  const resumen =
    datos
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


  const porcentajeGeneral =
    Math.max(
      0,
      Number(
        resumen
          .porcentaje ||
        0
      )
    );


  const porcentajeBarraGeneral =
    Math.min(
      porcentajeGeneral,
      100
    );


  const cantidadOk =
    categorias.filter(
      (
        item
      ) =>
        item.estado ===
        "ok"
    ).length;


  const cantidadAlerta =
    categorias.filter(
      (
        item
      ) =>
        item.estado ===
        "alerta"
    ).length;


  const cantidadSuperadas =
    categorias.filter(
      (
        item
      ) =>
        item.estado ===
        "superado"
    ).length;


  if (
    cargando &&
    !datos
  ) {
    return (
      <section className="presupuestos-cargando">

        <div className="spinner" />

        <p>
          Cargando presupuestos...
        </p>

      </section>
    );
  }


  return (
    <>

      <div className="presupuestos-moderno">

        <div className="presupuestos-cabecera">

          <div>

            <p className="etiqueta">
              Planificación
            </p>


            <h2>
              Presupuestos
            </h2>


            <p>
              Define cuánto quieres
              destinar a cada categoría
              y compara ese límite con
              tus gastos reales.
            </p>

          </div>


          <button
            type="button"

            className="presupuesto-boton-nuevo"

            onClick={
              abrirNuevo
            }
          >
            + Nuevo presupuesto
          </button>

        </div>


        {mensaje && (

          <div className="presupuesto-mensaje-exito">

            <span>
              ✓
            </span>

            {mensaje}

          </div>

        )}


        {error && (

          <div className="presupuesto-mensaje-error">

            <span>
              !
            </span>

            {error}

          </div>

        )}


        <section className="presupuesto-periodo">

          <button
            type="button"

            className="presupuesto-periodo-flecha"

            onClick={() =>
              moverMes(
                -1
              )
            }
          >
            ‹
          </button>


          <div className="presupuesto-periodo-centro">

            <small>
              Período seleccionado
            </small>


            <strong>
              {nombrePeriodo}
            </strong>


            <input
              type="month"

              value={
                periodo
              }

              onChange={(
                evento
              ) =>
                onCambiarPeriodoExterno(
                  evento
                    .target
                    .value
                )
              }
            />

          </div>


          <button
            type="button"

            className="presupuesto-periodo-flecha"

            onClick={() =>
              moverMes(
                1
              )
            }
          >
            ›
          </button>

        </section>


        <section className="presupuesto-grid-resumen">

          <TarjetaResumen
            titulo="Presupuestado"

            valor={
              resumen
                .presupuestado
            }

            detalle="Límite total del mes"

            icono="$"

            tipo="presupuestado"

            formatoCLP={
              formatoCLP
            }
          />


          <TarjetaResumen
            titulo="Gastado"

            valor={
              resumen
                .gastado
            }

            detalle="Débito + cuotas pagadas"

            icono="↑"

            tipo="gastado"

            formatoCLP={
              formatoCLP
            }
          />


          <TarjetaResumen
            titulo="Disponible"

            valor={
              resumen
                .disponible
            }

            detalle={
              Number(
                resumen
                  .disponible
              ) >= 0
                ? "Aún disponible"
                : "Presupuesto excedido"
            }

            icono="="

            tipo={
              Number(
                resumen
                  .disponible
              ) >= 0
                ? "disponible"
                : "superado"
            }

            formatoCLP={
              formatoCLP
            }
          />


          <div className="presupuesto-tarjeta-porcentaje">

            <div className="presupuesto-circulo">

              <strong>
                {porcentajeGeneral
                  .toFixed(
                    0
                  )}
                %
              </strong>

            </div>


            <div>

              <span>
                Utilizado
              </span>


              <strong>
                {porcentajeGeneral <
                80
                  ? "Dentro del presupuesto"
                  : porcentajeGeneral <=
                    100
                  ? "Cerca del límite"
                  : "Presupuesto superado"}
              </strong>


              <small>
                Progreso del período
              </small>

            </div>

          </div>

        </section>


        <section className="presupuesto-progreso-general">

          <div className="presupuesto-progreso-cabecera">

            <div>

              <span>
                Progreso mensual
              </span>


              <strong>
                {formatoCLP(
                  resumen
                    .gastado
                )}{" "}
                de{" "}
                {formatoCLP(
                  resumen
                    .presupuestado
                )}
              </strong>

            </div>


            <span
              className={
                porcentajeGeneral >
                100
                  ? "presupuesto-estado estado-superado"
                  : porcentajeGeneral >=
                    80
                  ? "presupuesto-estado estado-alerta"
                  : "presupuesto-estado estado-ok"
              }
            >
              {porcentajeGeneral >
              100
                ? "Superado"
                : porcentajeGeneral >=
                  80
                ? "Atención"
                : "Controlado"}
            </span>

          </div>


          <div className="presupuesto-barra-general-fondo">

            <div
              className={
                porcentajeGeneral >
                100
                  ? "presupuesto-barra-general barra-superada"
                  : porcentajeGeneral >=
                    80
                  ? "presupuesto-barra-general barra-alerta"
                  : "presupuesto-barra-general barra-normal"
              }

              style={{
                width:
                  `${porcentajeBarraGeneral}%`,
              }}
            />

          </div>

        </section>


        <section className="presupuesto-estados">

          <div>
            <span className="estado-punto punto-ok" />

            <strong>
              {cantidadOk}
            </strong>

            <small>
              Dentro del límite
            </small>
          </div>


          <div>
            <span className="estado-punto punto-alerta" />

            <strong>
              {cantidadAlerta}
            </strong>

            <small>
              Sobre 80%
            </small>
          </div>


          <div>
            <span className="estado-punto punto-superado" />

            <strong>
              {cantidadSuperadas}
            </strong>

            <small>
              Superadas
            </small>
          </div>

        </section>


        <section className="presupuesto-categorias-panel">

          <div className="presupuesto-categorias-cabecera">

            <div>

              <p className="etiqueta">
                Categorías
              </p>


              <h3>
                Control de gastos
              </h3>

            </div>


            <span>
              {categorias.length}{" "}

              {categorias.length ===
              1
                ? "categoría"
                : "categorías"}
            </span>

          </div>


          {categorias.length ===
          0 ? (

            <div className="presupuesto-vacio">

              <div>
                $
              </div>


              <strong>
                Sin presupuestos
              </strong>


              <p>
                Todavía no existen
                presupuestos ni gastos
                registrados para este
                período.
              </p>


              <button
                type="button"

                onClick={
                  abrirNuevo
                }
              >
                Crear primer presupuesto
              </button>

            </div>

          ) : (

            <div className="presupuesto-lista-categorias">

              {categorias.map(
                (
                  item
                ) => (

                  <TarjetaCategoria
                    key={
                      `${item.categoria}-${item.id || "sin-id"}`
                    }

                    item={
                      item
                    }

                    formatoCLP={
                      formatoCLP
                    }

                    onEditar={() =>
                      abrirEditar(
                        item
                      )
                    }

                    onEliminar={() =>
                      setPresupuestoEliminar(
                        item
                      )
                    }
                  />

                )
              )}

            </div>

          )}

        </section>


        <section className="presupuesto-ayuda">

          <div className="presupuesto-ayuda-icono">
            i
          </div>


          <div>

            <strong>
              ¿Qué se considera gasto?
            </strong>


            <p>
              El presupuesto utiliza
              gastos reales: compras
              con débito más cuotas
              de crédito marcadas
              como pagadas.
            </p>

          </div>

        </section>

      </div>


      {mostrarFormulario && (

        <div
          className="modal-fondo"

          onMouseDown={() => {
            if (
              !guardando
            ) {
              setMostrarFormulario(
                false
              );
            }
          }}
        >

          <div
            className="modal presupuesto-modal"

            onMouseDown={(
              evento
            ) =>
              evento
                .stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <p className="etiqueta">
                  {categoriaEditando
                    ? "Modificar límite"
                    : "Nuevo límite"}
                </p>


                <h2>
                  {categoriaEditando
                    ? `Editar ${categoriaEditando.categoria}`
                    : "Nuevo presupuesto"}
                </h2>

              </div>


              <button
                type="button"

                className="boton-cerrar"

                disabled={
                  guardando
                }

                onClick={() =>
                  setMostrarFormulario(
                    false
                  )
                }
              >
                ×
              </button>

            </div>


            <form
              onSubmit={
                guardarPresupuesto
              }
            >

              <div className="presupuesto-modal-periodo">

                <span>
                  Período
                </span>


                <strong>
                  {nombrePeriodo}
                </strong>

              </div>


              <div className="campo">

                <label>
                  Categoría
                </label>


                <select
                  name="categoria"

                  value={
                    formulario
                      .categoria
                  }

                  onChange={
                    cambiarFormulario
                  }

                  disabled={
                    Boolean(
                      categoriaEditando
                    )
                  }
                >

                  {categoriasDisponibles.map(
                    (
                      categoria
                    ) => (

                      <option
                        key={
                          categoria
                        }

                        value={
                          categoria
                        }
                      >
                        {categoria}
                      </option>

                    )
                  )}

                </select>

              </div>


              <div className="campo">

                <label>
                  Monto presupuestado
                </label>


                <div className="presupuesto-input-moneda">

                  <span>
                    $
                  </span>


                  <input
                    type="text"

                    inputMode="numeric"

                    pattern="[0-9]*"

                    autoComplete="off"

                    name="monto"

                    value={
                      formulario
                        .monto
                    }

                    onChange={
                      cambiarFormulario
                    }

                    placeholder="250000"

                    autoFocus

                    required
                  />

                </div>


                {formulario
                  .monto && (

                  <small>
                    Presupuesto:{" "}

                    <strong>
                      {formatoCLP(
                        formulario
                          .monto
                      )}
                    </strong>
                  </small>

                )}

              </div>


              {categoriaEditando && (

                <div className="presupuesto-modal-comparacion">

                  <div>
                    <span>
                      Gastado
                    </span>

                    <strong>
                      {formatoCLP(
                        categoriaEditando
                          .gastado
                      )}
                    </strong>
                  </div>


                  <span>
                    →
                  </span>


                  <div>
                    <span>
                      Nuevo límite
                    </span>

                    <strong>
                      {formatoCLP(
                        formulario
                          .monto
                      )}
                    </strong>
                  </div>

                </div>

              )}


              <div className="acciones-modal">

                <button
                  type="button"

                  className="boton-secundario"

                  disabled={
                    guardando
                  }

                  onClick={() =>
                    setMostrarFormulario(
                      false
                    )
                  }
                >
                  Cancelar
                </button>


                <button
                  type="submit"

                  className="boton-principal"

                  disabled={
                    guardando
                  }
                >
                  {guardando
                    ? "Guardando..."
                    : categoriaEditando
                    ? "Guardar cambios"
                    : "Crear presupuesto"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {presupuestoEliminar && (

        <div
          className="modal-fondo"

          onMouseDown={() => {
            if (
              !eliminando
            ) {
              setPresupuestoEliminar(
                null
              );
            }
          }}
        >

          <div
            className="modal presupuesto-modal-eliminar"

            onMouseDown={(
              evento
            ) =>
              evento
                .stopPropagation()
            }
          >

            <div className="presupuesto-eliminar-icono">
              !
            </div>


            <p className="etiqueta presupuesto-etiqueta-peligro">
              Eliminar límite
            </p>


            <h2>
              ¿Eliminar presupuesto?
            </h2>


            <p className="presupuesto-eliminar-texto">
              Se eliminará solamente
              el presupuesto de{" "}

              <strong>
                {
                  presupuestoEliminar
                    .categoria
                }
              </strong>

              {" "}para{" "}

              <strong>
                {nombrePeriodo}
              </strong>.
            </p>


            <div className="presupuesto-eliminar-resumen">

              <div>
                <span>
                  Presupuesto
                </span>

                <strong>
                  {formatoCLP(
                    presupuestoEliminar
                      .presupuesto
                  )}
                </strong>
              </div>


              <div>
                <span>
                  Gastado
                </span>

                <strong>
                  {formatoCLP(
                    presupuestoEliminar
                      .gastado
                  )}
                </strong>
              </div>

            </div>


            <div className="presupuesto-eliminar-aviso">

              <strong>
                Tus movimientos no se eliminarán.
              </strong>


              <p>
                Solo desaparecerá el
                límite presupuestario.
              </p>

            </div>


            <div className="acciones-modal">

              <button
                type="button"

                className="boton-secundario"

                disabled={
                  eliminando
                }

                onClick={() =>
                  setPresupuestoEliminar(
                    null
                  )
                }
              >
                Cancelar
              </button>


              <button
                type="button"

                className="presupuesto-boton-eliminar"

                disabled={
                  eliminando
                }

                onClick={
                  eliminarPresupuesto
                }
              >
                {eliminando
                  ? "Eliminando..."
                  : "Eliminar presupuesto"}
              </button>

            </div>

          </div>

        </div>

      )}

    </>
  );
}


function TarjetaResumen({
  titulo,
  valor,
  detalle,
  icono,
  tipo,
  formatoCLP,
}) {
  return (
    <article
      className={
        `presupuesto-resumen-tarjeta ${tipo}`
      }
    >

      <div className="presupuesto-resumen-icono">
        {icono}
      </div>


      <div>

        <span>
          {titulo}
        </span>


        <strong>
          {formatoCLP(
            valor
          )}
        </strong>


        <small>
          {detalle}
        </small>

      </div>

    </article>
  );
}


function TarjetaCategoria({
  item,
  formatoCLP,
  onEditar,
  onEliminar,
}) {
  const porcentaje =
    Number(
      item.porcentaje ||
        0
    );


  const barra =
    Math.min(
      Math.max(
        porcentaje,
        0
      ),
      100
    );


  const sinPresupuesto =
    item.estado ===
    "sin_presupuesto";


  const claseEstado =
    item.estado ===
    "superado"
      ? "categoria-superada"
      : item.estado ===
        "alerta"
      ? "categoria-alerta"
      : sinPresupuesto
      ? "categoria-sin-presupuesto"
      : "categoria-ok";


  return (
    <article
      className={
        `presupuesto-categoria ${claseEstado}`
      }
    >

      <div className="presupuesto-categoria-superior">

        <div className="presupuesto-categoria-identidad">

          <div className="presupuesto-categoria-icono">
            {item.categoria
              ?.charAt(
                0
              )
              .toUpperCase()}
          </div>


          <div>

            <strong>
              {item.categoria}
            </strong>


            <span>
              {sinPresupuesto
                ? "Sin presupuesto configurado"
                : item.estado ===
                  "superado"
                ? "Presupuesto superado"
                : item.estado ===
                  "alerta"
                ? "Cerca del límite"
                : "Dentro del presupuesto"}
            </span>

          </div>

        </div>


        <div className="presupuesto-categoria-acciones">

          <button
            type="button"

            onClick={
              onEditar
            }
          >
            {sinPresupuesto
              ? "Definir"
              : "Editar"}
          </button>


          {item.id && (

            <button
              type="button"

              className="categoria-boton-eliminar"

              onClick={
                onEliminar
              }
            >
              ×
            </button>

          )}

        </div>

      </div>


      <div className="presupuesto-categoria-valores">

        <div>
          <span>
            Gastado
          </span>

          <strong>
            {formatoCLP(
              item.gastado
            )}
          </strong>
        </div>


        <div>
          <span>
            Presupuesto
          </span>

          <strong>
            {sinPresupuesto
              ? "Sin definir"
              : formatoCLP(
                  item.presupuesto
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
                item.disponible
              ) < 0
                ? "valor-presupuesto-negativo"
                : ""
            }
          >
            {sinPresupuesto
              ? "—"
              : formatoCLP(
                  item.disponible
                )}
          </strong>
        </div>


        <div>
          <span>
            Uso
          </span>

          <strong>
            {sinPresupuesto
              ? "—"
              : `${porcentaje.toFixed(
                  0
                )}%`}
          </strong>
        </div>

      </div>


      {!sinPresupuesto && (

        <>
          <div className="presupuesto-categoria-barra-fondo">

            <div
              className="presupuesto-categoria-barra"

              style={{
                width:
                  `${barra}%`,
              }}
            />

          </div>


          <div className="presupuesto-categoria-pie">

            <span>
              {porcentaje >=
              100
                ? "Límite alcanzado"
                : `${Math.max(
                    0,
                    100 -
                      porcentaje
                  ).toFixed(
                    0
                  )}% disponible`}
            </span>


            <strong>
              {porcentaje
                .toFixed(
                  0
                )}
              %
            </strong>

          </div>
        </>

      )}


      {sinPresupuesto && (

        <div className="presupuesto-sin-limite-aviso">

          Esta categoría ya tiene{" "}

          <strong>
            {formatoCLP(
              item.gastado
            )}
          </strong>

          {" "}en gastos reales,
          pero todavía no tiene
          un límite.

        </div>

      )}

    </article>
  );
}


export default Presupuestos;