import {
  useEffect,
  useState
} from "react";

import "./App.css";

import Dashboard
  from "./components/Dashboard";

import Historial
  from "./components/Historial";

import Configuracion
  from "./components/Configuracion";

import Presupuestos
  from "./components/Presupuestos";

import DetalleTransaccion
  from "./components/DetalleTransaccion";


const API =
  "http://localhost:3001/api";


/*
 * =========================================
 * FECHA LOCAL SEGURA
 * =========================================
 */

const obtenerFechaLocalISO = () => {
  const ahora =
    new Date();

  const anio =
    ahora.getFullYear();

  const mes =
    String(
      ahora.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const dia =
    String(
      ahora.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${anio}-${mes}-${dia}`;
};


/*
 * =========================================
 * PERÍODO LOCAL ACTUAL
 * =========================================
 */

const obtenerPeriodoLocal = () => {
  const ahora =
    new Date();

  const anio =
    ahora.getFullYear();

  const mes =
    String(
      ahora.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  return `${anio}-${mes}`;
};


function App() {

  /*
   * =========================================
   * PERÍODO GLOBAL
   * =========================================
   */

  const periodoActual =
    obtenerPeriodoLocal();


  const [
    periodoAnalisis,
    setPeriodoAnalisis
  ] = useState(
    periodoActual
  );


  /*
   * =========================================
   * DATOS GLOBALES
   * =========================================
   */

  const [
    dashboard,
    setDashboard
  ] = useState(null);


  const [
    transacciones,
    setTransacciones
  ] = useState([]);


  const [
    cuotas,
    setCuotas
  ] = useState([]);


  const [
    cargando,
    setCargando
  ] = useState(true);


  const [
    error,
    setError
  ] = useState("");


  const [
    mensajeExito,
    setMensajeExito
  ] = useState("");


  const [
    mostrarFormulario,
    setMostrarFormulario
  ] = useState(false);


  const [
    vista,
    setVista
  ] = useState(
    "dashboard"
  );


  const [
    detalleTransaccion,
    setDetalleTransaccion
  ] = useState(null);


  const [
    categoriaPresupuesto,
    setCategoriaPresupuesto
  ] = useState(null);


  /*
   * =========================================
   * FORMULARIO NUEVO MOVIMIENTO
   * =========================================
   */

  const [
    formulario,
    setFormulario
  ] = useState({
    tipo:
      "gasto",

    fecha:
      obtenerFechaLocalISO(),

    descripcion:
      "",

    monto:
      "",

    medio_pago:
      "debito",

    categoria:
      "Otros",

    numero_cuotas:
      1,

    notas:
      "",
  });


  /*
   * =========================================
   * FORMULARIO VACÍO
   * =========================================
   */

  const crearFormularioVacio =
    () => ({
      tipo:
        "gasto",

      fecha:
        obtenerFechaLocalISO(),

      descripcion:
        "",

      monto:
        "",

      medio_pago:
        "debito",

      categoria:
        "Otros",

      numero_cuotas:
        1,

      notas:
        "",
    });


  /*
   * =========================================
   * ABRIR NUEVO MOVIMIENTO
   * =========================================
   */

  const abrirNuevoMovimiento =
    () => {
      setFormulario(
        crearFormularioVacio()
      );

      setMostrarFormulario(
        true
      );
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
   * MONEDA
   * =========================================
   */

  const formatoCLP = (
    valor
  ) => {
    return new Intl.NumberFormat(
      "es-CL",
      {
        style:
          "currency",

        currency:
          "CLP",

        maximumFractionDigits:
          0,
      }
    ).format(
      Number(
        valor || 0
      )
    );
  };


  /*
   * =========================================
   * MENSAJE DE ÉXITO
   * =========================================
   */

  const mostrarMensajeExito = (
    mensaje
  ) => {
    setMensajeExito(
      mensaje
    );

    window.setTimeout(
      () => {
        setMensajeExito(
          ""
        );
      },
      3000
    );
  };


  /*
   * =========================================
   * CARGAR DATOS GLOBALES
   * =========================================
   */

  const cargarDatos =
    async (
      mostrarCarga = false,
      periodo =
        periodoAnalisis
    ) => {
      try {

        if (
          mostrarCarga
        ) {
          setCargando(
            true
          );
        }

        setError("");


        const [
          respuestaDashboard,
          respuestaTransacciones,
          respuestaCuotas
        ] =
          await Promise.all([
            fetch(
              `${API}/dashboard?periodo=${periodo}`,
              {
                cache:
                  "no-store",
              }
            ),

            fetch(
              `${API}/transacciones`,
              {
                cache:
                  "no-store",
              }
            ),

            fetch(
              `${API}/cuotas`,
              {
                cache:
                  "no-store",
              }
            ),
          ]);


        if (
          !respuestaDashboard.ok ||
          !respuestaTransacciones.ok ||
          !respuestaCuotas.ok
        ) {
          throw new Error(
            "No se pudieron obtener los datos."
          );
        }


        const datosDashboard =
          await respuestaDashboard
            .json();


        const datosTransacciones =
          await respuestaTransacciones
            .json();


        const datosCuotas =
          await respuestaCuotas
            .json();


        const cuotasNormalizadas =
          Array.isArray(
            datosCuotas
          )
            ? datosCuotas.map(
                (
                  cuota
                ) => ({
                  ...cuota,

                  pagada:
                    cuota.pagada ===
                      true ||
                    cuota.pagada ===
                      "true" ||
                    cuota.pagada ===
                      1 ||
                    cuota.pagada ===
                      "1",

                  monto:
                    Number(
                      cuota.monto ||
                      0
                    ),
                })
              )
            : [];


        setDashboard(
          datosDashboard
        );


        setTransacciones(
          Array.isArray(
            datosTransacciones
          )
            ? datosTransacciones
            : []
        );


        setCuotas(
          cuotasNormalizadas
        );

      } catch (error) {

        console.error(
          error
        );

        setError(
          "No fue posible conectar con el servidor."
        );

      } finally {

        setCargando(
          false
        );
      }
    };


  /*
   * =========================================
   * CARGA INICIAL
   * =========================================
   */

  useEffect(() => {
    cargarDatos(
      true,
      periodoAnalisis
    );

    // eslint-disable-next-line
  }, []);


  /*
   * =========================================
   * CAMBIAR PERÍODO
   * =========================================
   */

  const cambiarPeriodoAnalisis =
    async (
      nuevoPeriodo
    ) => {

      setPeriodoAnalisis(
        nuevoPeriodo
      );

      await cargarDatos(
        false,
        nuevoPeriodo
      );
    };


  /*
   * =========================================
   * PRESUPUESTOS DESDE DASHBOARD
   * =========================================
   */

  const abrirPresupuestoDesdeDashboard = (
    categoria
  ) => {

    setCategoriaPresupuesto(
      categoria
    );

    setVista(
      "presupuestos"
    );
  };


  /*
   * =========================================
   * NAVEGACIÓN
   * =========================================
   */

  const cambiarVista = (
    nuevaVista
  ) => {

    if (
      nuevaVista ===
      "presupuestos"
    ) {
      setCategoriaPresupuesto(
        null
      );
    }

    setVista(
      nuevaVista
    );
  };


  /*
   * =========================================
   * CAMBIAR FORMULARIO
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
   * CAMBIAR TIPO
   * =========================================
   */

  const cambiarTipo = (
    tipo
  ) => {

    setFormulario(
      (
        anterior
      ) => ({
        ...anterior,

        tipo,

        medio_pago:
          tipo ===
          "ingreso"
            ? "transferencia"
            : "debito",

        categoria:
          tipo ===
          "ingreso"
            ? "Remuneración"
            : "Otros",

        numero_cuotas:
          1,
      })
    );
  };


  /*
   * =========================================
   * GUARDAR MOVIMIENTO
   * =========================================
   */

  const guardarMovimiento =
    async (
      evento
    ) => {

      evento.preventDefault();

      try {

        const monto =
          Number(
            formulario.monto
          );


        if (
          !Number.isFinite(
            monto
          ) ||
          monto <= 0
        ) {
          throw new Error(
            "El monto debe ser mayor que cero."
          );
        }


        if (
          !formulario.fecha
        ) {
          throw new Error(
            "Debes indicar la fecha del movimiento."
          );
        }


        const datos = {

          ...formulario,

          fecha:
            formulario.fecha,

          monto,

          numero_cuotas:
            formulario
              .medio_pago ===
            "credito"
              ? Number(
                  formulario
                    .numero_cuotas
                )
              : 1,
        };


        const respuesta =
          await fetch(
            `${API}/transacciones`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  datos
                ),
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
              "No se pudo guardar el movimiento."
          );
        }


        await cargarDatos(
          false,
          periodoAnalisis
        );


        setMostrarFormulario(
          false
        );


        setVista(
          "dashboard"
        );


        setFormulario(
          crearFormularioVacio()
        );


        mostrarMensajeExito(
          "Movimiento guardado correctamente"
        );

      } catch (error) {

        console.error(
          error
        );

        alert(
          error.message
        );
      }
    };


  /*
   * =========================================
   * ABRIR DETALLE
   * =========================================
   */

  const abrirDetalle =
    async (
      id
    ) => {

      try {

        const respuesta =
          await fetch(
            `${API}/transacciones/${id}`,
            {
              cache:
                "no-store",
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
              "No se pudo cargar el detalle."
          );
        }


        setDetalleTransaccion(
          resultado
        );

      } catch (error) {

        console.error(
          error
        );

        alert(
          error.message
        );
      }
    };


  /*
   * =========================================
   * EDITAR TRANSACCIÓN
   * =========================================
   */

  const editarTransaccion =
    async (
      id,
      datosActualizados
    ) => {

      try {

        const respuesta =
          await fetch(
            `${API}/transacciones/${id}`,
            {
              method:
                "PUT",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  datosActualizados
                ),
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
              "No se pudo actualizar la transacción."
          );
        }


        await cargarDatos(
          false,
          periodoAnalisis
        );


        setDetalleTransaccion(
          null
        );


        setVista(
          "dashboard"
        );


        mostrarMensajeExito(
          "Cambios guardados correctamente"
        );


        return true;

      } catch (error) {

        console.error(
          error
        );

        alert(
          error.message
        );


        return false;
      }
    };


  /*
   * =========================================
   * ELIMINAR TRANSACCIÓN
   * =========================================
   */

  const eliminarTransaccion =
    async (
      id,
      confirmarHistorial = false
    ) => {

      try {

        const respuesta =
          await fetch(
            `${API}/transacciones/${id}`,
            {
              method:
                "DELETE",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  confirmar_historial:
                    confirmarHistorial,
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
              "No se pudo eliminar el movimiento."
          );
        }


        await cargarDatos(
          false,
          periodoAnalisis
        );


        setDetalleTransaccion(
          null
        );


        setVista(
          "dashboard"
        );


        mostrarMensajeExito(
          "Movimiento eliminado correctamente"
        );


        return true;

      } catch (error) {

        console.error(
          error
        );

        alert(
          error.message
        );


        return false;
      }
    };


  /*
   * =========================================
   * ACTUALIZAR CUOTA
   * =========================================
   */

  const actualizarCuota =
    async (
      cuotaId,
      pagada
    ) => {

      try {

        const respuesta =
          await fetch(
            `${API}/cuotas/${cuotaId}`,
            {
              method:
                "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  pagada,
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
              "No se pudo actualizar la cuota."
          );
        }


        await cargarDatos(
          false,
          periodoAnalisis
        );


        if (
          detalleTransaccion
        ) {
          await abrirDetalle(
            detalleTransaccion
              .transaccion
              .id
          );
        }


        mostrarMensajeExito(
          pagada
            ? "Cuota marcada como pagada"
            : "Cuota marcada como pendiente"
        );


        return true;

      } catch (error) {

        console.error(
          error
        );

        alert(
          error.message
        );


        return false;
      }
    };


  /*
   * =========================================
   * CARGANDO
   * =========================================
   */

  if (
    cargando &&
    !dashboard
  ) {

    return (
      <div className="pantalla-cargando">

        <div className="spinner" />

        <p>
          Cargando Control Financiero...
        </p>

      </div>
    );
  }


  /*
   * =========================================
   * INTERFAZ
   * =========================================
   */

  return (
    <div className="app">

      {mensajeExito && (

        <div
          className="notificacion-exito"
          role="status"
          aria-live="polite"
        >

          <span className="notificacion-icono">
            ✓
          </span>

          <span>
            {mensajeExito}
          </span>

        </div>

      )}


      <header className="encabezado">

        <div className="marca-aplicacion">

          <p className="subtitulo">
            Finanzas personales
          </p>

          <h1>
            Control Financiero
          </h1>

        </div>


        <div className="acciones-header">

          <nav
            className="navegacion"
            aria-label="Navegación principal"
          >

            <button
              type="button"
              className={
                vista ===
                "dashboard"
                  ? "nav-activo"
                  : ""
              }
              aria-current={
                vista ===
                "dashboard"
                  ? "page"
                  : undefined
              }
              onClick={() =>
                cambiarVista(
                  "dashboard"
                )
              }
            >
              Panel
            </button>


            <button
              type="button"
              className={
                vista ===
                "historial"
                  ? "nav-activo"
                  : ""
              }
              aria-current={
                vista ===
                "historial"
                  ? "page"
                  : undefined
              }
              onClick={() =>
                cambiarVista(
                  "historial"
                )
              }
            >
              Historial
            </button>


            <button
              type="button"
              className={
                vista ===
                "presupuestos"
                  ? "nav-activo"
                  : ""
              }
              aria-current={
                vista ===
                "presupuestos"
                  ? "page"
                  : undefined
              }
              onClick={() =>
                cambiarVista(
                  "presupuestos"
                )
              }
            >
              Presupuestos
            </button>


            <button
              type="button"
              className={
                vista ===
                "configuracion"
                  ? "nav-activo"
                  : ""
              }
              aria-current={
                vista ===
                "configuracion"
                  ? "page"
                  : undefined
              }
              onClick={() =>
                cambiarVista(
                  "configuracion"
                )
              }
            >
              Configuración
            </button>

          </nav>


          <button
            type="button"
            className="
              boton-principal
              boton-nuevo-movimiento
            "
            onClick={
              abrirNuevoMovimiento
            }
            aria-label="Registrar nuevo movimiento"
          >

            <span
              className="boton-nuevo-icono"
              aria-hidden="true"
            >
              +
            </span>

            <span className="boton-nuevo-texto">
              Nuevo movimiento
            </span>

          </button>

        </div>

      </header>


      {error && (

        <div
          className="mensaje-error"
          role="alert"
        >
          {error}
        </div>

      )}


      <main className="contenido">

        {vista ===
          "dashboard" && (

          <Dashboard
            dashboard={
              dashboard
            }

            formatoCLP={
              formatoCLP
            }

            API={
              API
            }

            periodo={
              periodoAnalisis
            }

            periodoMaximo={
              periodoActual
            }

            onCambiarPeriodo={
              cambiarPeriodoAnalisis
            }

            onAbrirPresupuesto={
              abrirPresupuestoDesdeDashboard
            }
          />

        )}


        {vista ===
          "historial" && (

          <Historial
            transacciones={
              transacciones
            }

            cuotas={
              cuotas
            }

            formatoCLP={
              formatoCLP
            }

            onSeleccionar={
              abrirDetalle
            }
          />

        )}


        {vista ===
          "presupuestos" && (

          <Presupuestos
            API={
              API
            }

            formatoCLP={
              formatoCLP
            }

            periodoExterno={
              periodoAnalisis
            }

            onCambiarPeriodoExterno={
              cambiarPeriodoAnalisis
            }

            categoriaInicial={
              categoriaPresupuesto
            }
          />

        )}


        {vista ===
          "configuracion" && (

          <Configuracion
            API={
              API
            }

            formatoCLP={
              formatoCLP
            }

            onConfiguracionGuardada={() =>
              cargarDatos(
                false,
                periodoAnalisis
              )
            }
          />

        )}

      </main>


      {/* =====================================
          NUEVO MOVIMIENTO
          ===================================== */}

      {mostrarFormulario && (

        <div
          className="
            modal-fondo
            nuevo-movimiento-fondo
          "
          onMouseDown={() =>
            setMostrarFormulario(
              false
            )
          }
        >

          <div
            className="nuevo-movimiento-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-nuevo-movimiento"
            onMouseDown={(
              evento
            ) =>
              evento.stopPropagation()
            }
          >

            <div className="nuevo-movimiento-header">

              <div>

                <p className="nuevo-movimiento-etiqueta">
                  Registrar movimiento
                </p>

                <h2 id="titulo-nuevo-movimiento">
                  Nuevo movimiento
                </h2>

                <p className="nuevo-movimiento-subtitulo">
                  Registra ingresos, gastos con débito
                  o compras realizadas con crédito.
                </p>

              </div>


              <button
                type="button"
                className="nuevo-movimiento-cerrar"
                onClick={() =>
                  setMostrarFormulario(
                    false
                  )
                }
                aria-label="Cerrar nuevo movimiento"
              >
                ×
              </button>

            </div>


            <form
              onSubmit={
                guardarMovimiento
              }
            >

              <div className="nuevo-selector-tipo">

                <button
                  type="button"
                  className={
                    formulario.tipo ===
                    "gasto"
                      ? "nuevo-tipo-opcion nuevo-tipo-gasto activo"
                      : "nuevo-tipo-opcion nuevo-tipo-gasto"
                  }
                  aria-pressed={
                    formulario.tipo ===
                    "gasto"
                  }
                  onClick={() =>
                    cambiarTipo(
                      "gasto"
                    )
                  }
                >

                  <span className="nuevo-tipo-icono">
                    ↑
                  </span>

                  <span>
                    <strong>
                      Gasto
                    </strong>

                    <small>
                      Dinero que sale
                    </small>
                  </span>

                </button>


                <button
                  type="button"
                  className={
                    formulario.tipo ===
                    "ingreso"
                      ? "nuevo-tipo-opcion nuevo-tipo-ingreso activo"
                      : "nuevo-tipo-opcion nuevo-tipo-ingreso"
                  }
                  aria-pressed={
                    formulario.tipo ===
                    "ingreso"
                  }
                  onClick={() =>
                    cambiarTipo(
                      "ingreso"
                    )
                  }
                >

                  <span className="nuevo-tipo-icono">
                    ↓
                  </span>

                  <span>
                    <strong>
                      Ingreso
                    </strong>

                    <small>
                      Dinero que entra
                    </small>
                  </span>

                </button>

              </div>


              <div className="nuevo-campo">

                <label htmlFor="nuevo-descripcion">
                  Descripción
                </label>

                <input
                  id="nuevo-descripcion"
                  name="descripcion"
                  value={
                    formulario.descripcion
                  }
                  onChange={
                    cambiarFormulario
                  }
                  placeholder="Ej. Supermercado"
                  required
                />

              </div>


              <div className="nuevo-grid-dos">

                <div className="nuevo-campo">

                  <label htmlFor="nuevo-monto">
                    Monto
                  </label>

                  <div className="nuevo-input-monto">

                    <span>
                      $
                    </span>

                    <input
                      id="nuevo-monto"
                      name="monto"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="off"
                      value={
                        formulario.monto
                      }
                      onChange={
                        cambiarFormulario
                      }
                      placeholder="30000"
                      required
                    />

                  </div>

                  {formulario.monto && (

                    <small className="nuevo-ayuda">
                      Valor ingresado:{" "}
                      {formatoCLP(
                        formulario.monto
                      )}
                    </small>

                  )}

                </div>


                <div className="nuevo-campo">

                  <label htmlFor="nuevo-fecha">
                    Fecha
                  </label>

                  <input
                    id="nuevo-fecha"
                    name="fecha"
                    type="date"
                    value={
                      formulario.fecha
                    }
                    onChange={
                      cambiarFormulario
                    }
                    required
                  />

                  <small className="nuevo-ayuda">
                    Fecha en que se realizó el movimiento.
                  </small>

                </div>

              </div>


              {formulario.tipo ===
                "gasto" && (
                <>

                  <section className="nuevo-seccion">

                    <div className="nuevo-seccion-titulo">

                      <div>

                        <span>
                          Datos del gasto
                        </span>

                        <small>
                          Indica cómo pagaste y
                          la categoría correspondiente.
                        </small>

                      </div>

                    </div>


                    <div className="nuevo-grid-dos">

                      <div className="nuevo-campo nuevo-campo-sin-margen">

                        <label htmlFor="nuevo-medio-pago">
                          Medio de pago
                        </label>

                        <select
                          id="nuevo-medio-pago"
                          name="medio_pago"
                          value={
                            formulario.medio_pago
                          }
                          onChange={
                            cambiarFormulario
                          }
                        >

                          <option value="debito">
                            Débito
                          </option>

                          <option value="credito">
                            Crédito
                          </option>

                        </select>

                      </div>


                      <div className="nuevo-campo nuevo-campo-sin-margen">

                        <label htmlFor="nuevo-categoria-gasto">
                          Categoría
                        </label>

                        <select
                          id="nuevo-categoria-gasto"
                          name="categoria"
                          value={
                            formulario.categoria
                          }
                          onChange={
                            cambiarFormulario
                          }
                        >

                          <option>
                            Alimentación
                          </option>

                          <option>
                            Crédito de consumo
                          </option>

                          <option>
                            Combustible
                          </option>

                          <option>
                            Transporte
                          </option>

                          <option>
                            Hogar
                          </option>

                          <option>
                            Salud
                          </option>

                          <option>
                            Entretenimiento
                          </option>

                          <option>
                            Compras
                          </option>

                          <option>
                            Educación
                          </option>

                          <option>
                            Otros
                          </option>

                        </select>

                      </div>

                    </div>

                  </section>


                  {formulario.medio_pago ===
                    "credito" && (

                    <section className="nuevo-credito">

                      <div className="nuevo-credito-cabecera">

                        <div className="nuevo-credito-icono">
                          ◇
                        </div>

                        <div>

                          <strong>
                            Compra con crédito
                          </strong>

                          <p>
                            Registrar esta compra no disminuye
                            inmediatamente tu saldo disponible.
                            El dinero se descontará cuando marques
                            cada cuota como pagada.
                          </p>

                        </div>

                      </div>


                      <div className="nuevo-grid-dos nuevo-credito-grid">

                        <div className="nuevo-campo nuevo-campo-sin-margen">

                          <label htmlFor="nuevo-numero-cuotas">
                            Número de cuotas
                          </label>

                          <input
                            id="nuevo-numero-cuotas"
                            name="numero_cuotas"
                            type="number"
                            min="1"
                            max="48"
                            value={
                              formulario.numero_cuotas
                            }
                            onChange={
                              cambiarFormulario
                            }
                          />

                        </div>


                        <div className="nuevo-cuota-estimada">

                          <span>
                            Valor aproximado por cuota
                          </span>

                          <strong>
                            {formatoCLP(
                              Number(
                                formulario.monto ||
                                0
                              ) /
                              Number(
                                formulario.numero_cuotas ||
                                1
                              )
                            )}
                          </strong>

                          <small>
                            La última cuota puede variar
                            algunos pesos por redondeo.
                          </small>

                        </div>

                      </div>

                    </section>

                  )}

                </>
              )}


              {formulario.tipo ===
                "ingreso" && (

                <section className="nuevo-seccion nuevo-seccion-ingreso">

                  <div className="nuevo-seccion-titulo">

                    <div>

                      <span>
                        Datos del ingreso
                      </span>

                      <small>
                        Selecciona el origen del dinero.
                      </small>

                    </div>

                  </div>


                  <div className="nuevo-campo nuevo-campo-sin-margen">

                    <label htmlFor="nuevo-categoria-ingreso">
                      Tipo de ingreso
                    </label>

                    <select
                      id="nuevo-categoria-ingreso"
                      name="categoria"
                      value={
                        formulario.categoria
                      }
                      onChange={
                        cambiarFormulario
                      }
                    >

                      <option>
                        Remuneración
                      </option>

                      <option>
                        Transferencia
                      </option>

                      <option>
                        Otro
                      </option>

                    </select>

                  </div>

                </section>

              )}


              <div className="nuevo-campo nuevo-notas">

                <label htmlFor="nuevo-notas">
                  Notas

                  <span>
                    Opcional
                  </span>
                </label>

                <textarea
                  id="nuevo-notas"
                  name="notas"
                  value={
                    formulario.notas
                  }
                  onChange={
                    cambiarFormulario
                  }
                  placeholder="Agrega algún detalle si lo necesitas..."
                />

              </div>


              <div className="nuevo-movimiento-pie">

                <button
                  type="button"
                  className="nuevo-boton-cancelar"
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
                  className={
                    formulario.tipo ===
                    "ingreso"
                      ? "nuevo-boton-guardar nuevo-boton-guardar-ingreso"
                      : "nuevo-boton-guardar"
                  }
                >

                  <span
                    className="nuevo-boton-guardar-icono"
                    aria-hidden="true"
                  >
                    ✓
                  </span>

                  Guardar movimiento

                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {detalleTransaccion && (

        <DetalleTransaccion
          detalle={
            detalleTransaccion
          }

          formatoCLP={
            formatoCLP
          }

          onCerrar={() =>
            setDetalleTransaccion(
              null
            )
          }

          onActualizarCuota={
            actualizarCuota
          }

          onEditar={
            editarTransaccion
          }

          onEliminar={
            eliminarTransaccion
          }
        />

      )}

    </div>
  );
}


export default App;