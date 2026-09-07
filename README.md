# Control Financiero Web

Aplicación web de finanzas personales desarrollada para registrar, visualizar y analizar ingresos, gastos, compras a crédito, cuotas y presupuestos mensuales.

El sistema permite mantener un saldo financiero acumulado, controlar obligaciones de crédito y analizar gastos reales por período sin requerir cuentas de usuario ni autenticación.

---

## Características principales

### Panel financiero

El panel principal permite visualizar:

- Saldo disponible actual.
- Saldo inicial configurado.
- Ingresos del período.
- Egresos reales del período.
- Crédito pendiente.
- Cuotas pagadas acumuladas.
- Resultado mensual.
- Evolución de ingresos y gastos.
- Gastos por categoría.
- Estado de presupuestos.
- Alertas de presupuesto.
- Próximas cuotas.

---

## Movimientos

La aplicación permite registrar:

### Ingresos

Los ingresos aumentan inmediatamente el saldo disponible.

Ejemplos:

- Remuneración.
- Transferencias.
- Otros ingresos.

### Gastos con débito

Los gastos realizados con débito disminuyen inmediatamente el saldo disponible.

### Compras con crédito

Una compra realizada con crédito registra la obligación completa, pero no disminuye inmediatamente el saldo disponible.

El monto se divide en cuotas y solamente se descuenta del saldo cuando una cuota es marcada como pagada.

---

## Modelo financiero

La aplicación utiliza el siguiente cálculo para determinar el saldo disponible:

```text
Saldo disponible =
Saldo inicial
+ Ingresos acumulados
- Gastos con débito acumulados
- Cuotas de crédito pagadas acumuladas
