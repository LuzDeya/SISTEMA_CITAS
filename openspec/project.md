# Contexto del proyecto — Sistema Web de Reservas de Citas

## Propósito
Aplicación web SaaS (multiinquilino) para que pequeños negocios con atención por citas
(ej. un centro médico) gestionen clientes, empleados, servicios, jornada laboral y citas,
con control de acceso por roles (RBAC).

## Stack
- server/ (API): Node.js + Express + Mongoose, MongoDB **local** (`mongodb://127.0.0.1:27017/reservas`)
- client/ (web): React + Vite, FullCalendar, Day.js, SweetAlert2, React-Toastify, Validator.js, Recharts
- Autenticación: JWT (jsonwebtoken) con `userId`, `role`, `tenantId`
- Pruebas: Jest + Supertest contra la base `reservas_test`

## Convenciones
- Arquitectura por capas: routes → controllers → services → repositories → models.
- Los controllers no tienen lógica de negocio.
- La autorización está centralizada en `src/policies/permissions.js` y se valida en el middleware **y** en cada servicio.
- Los repositorios agregan siempre `tenantId` (tomado del JWT) a cada consulta; nunca se acepta del body.
- Errores con formato `{ "message": "..." }` y códigos 400, 401, 403, 404, 409.
- Los mensajes de error son exactamente los de los criterios de aceptación.
- Cada escenario de `specs/` tiene una prueba con el mismo ID (`PA-HUxx-Ey`) en `server/tests/`.
  Si se cambia una spec, se cambia su prueba; nunca al revés.
