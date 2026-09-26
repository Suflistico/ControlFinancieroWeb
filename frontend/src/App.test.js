import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import App from "./App";


jest.mock(
  "./components/Dashboard",
  () => function DashboardPrueba() {
    return <div>Resumen financiero cargado</div>;
  }
);

jest.mock(
  "./components/Historial",
  () => function HistorialPrueba() {
    return <div>Historial</div>;
  }
);

jest.mock(
  "./components/Configuracion",
  () => function ConfiguracionPrueba() {
    return <div>Configuración</div>;
  }
);

jest.mock(
  "./components/Presupuestos",
  () => function PresupuestosPrueba() {
    return <div>Presupuestos</div>;
  }
);

jest.mock(
  "./components/DetalleTransaccion",
  () => function DetallePrueba() {
    return <div>Detalle</div>;
  }
);


const respuestaJson = (
  datos
) =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve(datos),
  });


const prepararCargaCorrecta = () => {
  global.fetch = jest
    .fn()
    .mockImplementation(
      (url) => {
        if (
          String(url).includes(
            "/dashboard"
          )
        ) {
          return respuestaJson({
            saldo_disponible: 100000,
          });
        }

        return respuestaJson([]);
      }
    );
};


afterEach(() => {
  jest.restoreAllMocks();
});


test(
  "carga el panel financiero desde la API",
  async () => {
    prepararCargaCorrecta();

    render(<App />);

    expect(
      screen.getByText(
        "Cargando Control Financiero..."
      )
    ).toBeInTheDocument();

    expect(
      await screen.findByRole(
        "heading",
        {
          name:
            "Control Financiero",
        }
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Resumen financiero cargado"
      )
    ).toBeInTheDocument();

    expect(global.fetch).toHaveBeenCalledTimes(3);
  }
);


test(
  "muestra un estado seguro y permite reintentar si falla la API",
  async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(
        new Error("Sin conexión")
      );

    render(<App />);

    expect(
      await screen.findByRole(
        "heading",
        {
          name:
            "No pudimos cargar tus datos",
        }
      )
    ).toBeInTheDocument();

    prepararCargaCorrecta();

    fireEvent.click(
      screen.getByRole(
        "button",
        {
          name:
            "Reintentar conexión",
        }
      )
    );

    await waitFor(() => {
      expect(
        screen.getByRole(
          "heading",
          {
            name:
              "Control Financiero",
          }
        )
      ).toBeInTheDocument();
    });
  }
);
