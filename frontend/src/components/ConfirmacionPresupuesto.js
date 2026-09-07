import "./ConfirmacionPresupuesto.css";


function ConfirmacionPresupuesto({
  datos,
  formatoCLP,
  guardando,
  onCancelar,
  onConfirmar,
}) {
  if (!datos) {
    return null;
  }

  const {
    categoria,
    presupuesto,
    gastadoActual,
    montoNuevo,
    gastadoProyectado,
    disponibleProyectado,
    porcentajeActual,
    porcentajeProyectado,
    superado,
    presupuestoCero,
  } = datos;


  return (
    <div
      className="
        modal-fondo
        confirmacion-presupuesto-fondo
      "

      onMouseDown={() => {
        if (!guardando) {
          onCancelar();
        }
      }}
    >

      <div
        className="
          modal
          confirmacion-presupuesto
        "

        onMouseDown={(e) =>
          e.stopPropagation()
        }
      >

        {/* =====================================
            ÍCONO
            ===================================== */}

        <div
          className={
            superado
              ? "confirmacion-presupuesto-icono confirmacion-icono-rojo"
              : "confirmacion-presupuesto-icono confirmacion-icono-amarillo"
          }
        >
          !
        </div>


        {/* =====================================
            CABECERA
            ===================================== */}

        <p
          className={
            superado
              ? "etiqueta confirmacion-etiqueta-roja"
              : "etiqueta confirmacion-etiqueta-amarilla"
          }
        >
          {superado
            ? "Presupuesto superado"
            : "Cerca del límite"}
        </p>

        <h2>
          Revisar antes de guardar
        </h2>

        <p className="confirmacion-presupuesto-intro">
          Este gasto tendrá impacto
          en el presupuesto de{" "}

          <strong>
            {categoria}
          </strong>.
        </p>


        {/* =====================================
            MOVIMIENTO
            ===================================== */}

        <div className="confirmacion-presupuesto-movimiento">

          <div>

            <span>
              Nuevo gasto
            </span>

            <strong>
              {formatoCLP(
                montoNuevo
              )}
            </strong>

          </div>

          <span className="confirmacion-presupuesto-suma">
            +
          </span>

          <div>

            <span>
              Gastado actualmente
            </span>

            <strong>
              {formatoCLP(
                gastadoActual
              )}
            </strong>

          </div>

          <span className="confirmacion-presupuesto-suma">
            =
          </span>

          <div>

            <span>
              Nuevo total
            </span>

            <strong>
              {formatoCLP(
                gastadoProyectado
              )}
            </strong>

          </div>

        </div>


        {/* =====================================
            PRESUPUESTO
            ===================================== */}

        <div
          className={
            superado
              ? "confirmacion-presupuesto-impacto impacto-rojo"
              : "confirmacion-presupuesto-impacto impacto-amarillo"
          }
        >

          <div className="confirmacion-impacto-superior">

            <div>

              <span>
                Presupuesto
              </span>

              <strong>
                {formatoCLP(
                  presupuesto
                )}
              </strong>

            </div>

            <div>

              <span>
                Uso actual
              </span>

              <strong>
                {presupuestoCero
                  ? "—"
                  : `${porcentajeActual.toFixed(
                      0
                    )}%`}
              </strong>

            </div>

            <div>

              <span>
                Después del gasto
              </span>

              <strong>
                {presupuestoCero
                  ? "Superado"
                  : `${porcentajeProyectado.toFixed(
                      0
                    )}%`}
              </strong>

            </div>

          </div>


          {!presupuestoCero && (

            <div className="confirmacion-barra-fondo">

              <div
                className={
                  superado
                    ? "confirmacion-barra confirmacion-barra-roja"
                    : "confirmacion-barra confirmacion-barra-amarilla"
                }

                style={{
                  width:
                    `${Math.min(
                      Math.max(
                        porcentajeProyectado,
                        0
                      ),
                      100
                    )}%`,
                }}
              />

            </div>

          )}


          <div className="confirmacion-impacto-pie">

            {superado ? (

              <p>
                Con este movimiento
                superarás el presupuesto en{" "}

                <strong>
                  {formatoCLP(
                    Math.abs(
                      disponibleProyectado
                    )
                  )}
                </strong>.
              </p>

            ) : (

              <p>
                Después de registrar
                este movimiento todavía
                tendrás{" "}

                <strong>
                  {formatoCLP(
                    disponibleProyectado
                  )}
                </strong>

                {" "}disponibles en esta
                categoría.
              </p>

            )}

          </div>

        </div>


        {/* =====================================
            ADVERTENCIA
            ===================================== */}

        <div
          className={
            superado
              ? "confirmacion-presupuesto-aviso aviso-rojo"
              : "confirmacion-presupuesto-aviso aviso-amarillo"
          }
        >

          <strong>
            {superado
              ? "El movimiento puede guardarse, pero excederá tu planificación."
              : "La categoría quedará cerca de su límite mensual."}
          </strong>

          <p>
            Puedes cancelar para revisar
            el monto o continuar si el
            gasto es correcto.
          </p>

        </div>


        {/* =====================================
            BOTONES
            ===================================== */}

        <div className="acciones-modal">

          <button
            type="button"

            className="boton-secundario"

            disabled={
              guardando
            }

            onClick={
              onCancelar
            }
          >
            Volver y revisar
          </button>

          <button
            type="button"

            className={
              superado
                ? "confirmacion-boton-rojo"
                : "confirmacion-boton-amarillo"
            }

            disabled={
              guardando
            }

            onClick={
              onConfirmar
            }
          >
            {guardando
              ? "Guardando..."
              : "Guardar de todas formas"}
          </button>

        </div>

      </div>

    </div>
  );
}


export default ConfirmacionPresupuesto;