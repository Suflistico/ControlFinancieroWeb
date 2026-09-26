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
```

Las compras con crédito se consideran deuda pendiente hasta que cada cuota se marca como pagada.

---

## Tecnologías

- Frontend: React y Create React App.
- Backend: Node.js, Express y PostgreSQL.
- Despliegue previsto: Netlify para el frontend y Render para la API.

---

## Puesta en marcha local

### 1. Base de datos

Crea una base PostgreSQL para la aplicación. Si ya cuentas con un respaldo, restáuralo antes de iniciar la API.

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Completa en `.env` la conexión mediante `DATABASE_URL` o las variables `DB_*`. La API se inicia por defecto en `http://localhost:3001` y su verificación de estado está disponible en `/api/health`.

### 3. Frontend

En otra terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm start
```

La aplicación se abre en `http://localhost:3000`.

---

## Verificación

```bash
cd backend && npm test
cd frontend && npm test -- --watchAll=false
cd frontend && npm run build
```

Las pruebas cubren la disponibilidad básica de la API, las cabeceras de seguridad, el límite de solicitudes y los estados principales de conexión del frontend.

---

## Variables de producción

- Backend: `DATABASE_URL`, `FRONTEND_URL`, `NODE_ENV=production` y `PORT` (Render la proporciona automáticamente).
- Frontend: `REACT_APP_API_URL`, apuntando a la URL pública de la API seguida de `/api`.

Nunca publiques archivos `.env` ni respaldos de la base de datos en el repositorio.
