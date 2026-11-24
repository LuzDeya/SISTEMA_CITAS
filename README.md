# CitaFácil — Sistema Web de Reservas de Citas

Aplicación web **SaaS multiinquilino** con **control de acceso por roles (RBAC)** para pequeños negocios que atienden por citas, como centros médicos. Cada negocio gestiona sus clientes, empleados, servicios, jornadas y citas, sin ver los datos de otros negocios.

> Proyecto académico — Ingeniería Web , Universidad Continental.

## Índice

1. [Descripción](#descripción)
2. [Funcionalidades](#funcionalidades)
3. [Tecnologías](#tecnologías)
4. [Requisitos](#requisitos)
5. [Instalación y puesta en marcha](#instalación-y-puesta-en-marcha)
6. [Variables de entorno](#variables-de-entorno)
7. [Usuarios de demostración](#usuarios-de-demostración)
8. [Pruebas de aceptación](#pruebas-de-aceptación)
9. [Arquitectura](#arquitectura)
10. [Endpoints principales](#endpoints-principales)
11. [Estructura del repositorio](#estructura-del-repositorio)
12. [Desarrollo con OpenSpec (SDD)](#desarrollo-con-openspec-sdd)
13. [Autores](#autores)
14. [Licencia](#licencia)

## Descripción

Muchos negocios pequeños llevan sus citas en cuadernos o chats, lo que genera cruces de horarios, citas olvidadas y poco control. CitaFácil centraliza esa gestión en una sola aplicación web:

- Cada negocio (inquilino) tiene sus datos aislados.
- Los usuarios tienen roles con permisos distintos: administrador, recepcionista, profesional y cliente.
- El sistema calcula la disponibilidad según la jornada del empleado y la duración del servicio, evitando citas superpuestas.

## Funcionalidades

El sistema cubre 16 historias de usuario:

| Módulo | Historias |
|---|---|
| Autenticación y negocios | HU-01 Registrar negocio · HU-02 Iniciar sesión |
| Usuarios y seguridad | HU-03 Usuarios y roles · HU-04 Aislamiento por organización |
| Catálogos | HU-05 Clientes · HU-06 Empleados · HU-07 Jornada laboral · HU-08 Servicios |
| Citas | HU-09 Disponibilidad · HU-10 Registrar cita · HU-11 Modificar/reprogramar · HU-12 Cancelar · HU-13 Estados de la cita |
| Consulta y análisis | HU-14 Agenda (calendario día/semana/mes) · HU-15 Búsqueda y filtros · HU-16 Panel de control |

## Tecnologías

| Capa | Tecnologías |
|---|---|
| Frontend | React, Vite, FullCalendar, Day.js, SweetAlert2, React-Toastify, Validator.js, Recharts |
| Backend | Node.js, Express, Mongoose, JWT (jsonwebtoken), bcryptjs, Validator.js, Day.js |
| Base de datos | MongoDB Atlas (también funciona con MongoDB local) |
| Pruebas | Jest, Supertest |
| Metodología | Spec-Driven Development con OpenSpec |

## Requisitos

- Node.js 18 o superior.
- Una cuenta de MongoDB Atlas (cluster gratuito) con tu IP autorizada en *Network Access*.
- Opcional: MongoDB Community Server instalado, para usar una base local.

## Instalación y puesta en marcha

```bash
# 1) Clonar el repositorio
git clone https://github.com/[TU-USUARIO]/reservas-citas.git
cd reservas-citas

# 2) Servidor (API)
cd server
cp .env.example .env        # en Windows: copy .env.example .env
# edita .env y pega tu cadena de conexión de Atlas
npm install
npm run seed                # carga datos de demostración
npm run dev                 # API en http://localhost:4000/api

# 3) Cliente web (en otra terminal)
cd client
npm install
npm run dev                 # http://localhost:5173
```

Guía detallada con solución de problemas: [docs/INSTALACION.md](docs/INSTALACION.md).

## Variables de entorno

Se configuran en `server/.env` (usa `server/.env.example` como plantilla). **Nunca subas el archivo `.env` al repositorio.**

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto de la API | `4000` |
| `MONGO_URI` | Conexión a la base de datos principal | `<cadena-de-conexion-de-atlas>/reservas` |
| `MONGO_URI_TEST` | Conexión a la base usada por las pruebas (se limpia en cada prueba) | `<cadena-de-conexion-de-atlas>/reservas_test` |
| `JWT_SECRET` | Clave para firmar los tokens | una cadena larga y secreta |
| `JWT_EXPIRES` | Duración del token | `8h` |
| `CORS_ORIGIN` | Origen permitido del cliente | `http://localhost:5173` |

Para usar MongoDB local, cambia las dos URI por `mongodb://127.0.0.1:27017/reservas` y `mongodb://127.0.0.1:27017/reservas_test`.

## Usuarios de demostración

Se crean con `npm run seed`. Contraseña de todos: `Salud2026`.

| Rol | Correo | Negocio |
|---|---|---|
| Administrador | admin@saludandina.pe | Centro Médico Salud Andina |
| Recepcionista | lucia@saludandina.pe | Centro Médico Salud Andina |
| Profesional | carlos@saludandina.pe, jorge@saludandina.pe | Centro Médico Salud Andina |
| Cliente | maria@mail.com | Centro Médico Salud Andina |
| Administrador | admin@santarosa.pe | Policlínico Santa Rosa (sirve para probar el aislamiento entre negocios) |

## Pruebas de aceptación

Cada criterio de aceptación de las historias de usuario es una prueba automatizada con el mismo ID (de `PA-HU01-E1` a `PA-HU16-E4`, 64 en total). Cada historia tiene 4 escenarios: camino feliz, flujo alternativo, manejo de errores y caso de borde.

```bash
cd server
npm test              # resumen
npm run test:verbose  # lista cada prueba con su ID
```

Las pruebas usan la base `reservas_test`, que se limpia antes de cada prueba y no afecta los datos de la base principal.

## Arquitectura

```
server/src
├── config/        conexión a MongoDB y variables de entorno
├── models/        Tenant, User, Client, Employee, Service, Appointment
├── repositories/  único acceso a Mongoose; agrega siempre el tenantId del token
├── services/      reglas de negocio + assertCan() en cada operación
├── policies/      permissions.js: política RBAC centralizada
├── controllers/   traducen HTTP ↔ servicios
├── routes/        endpoints /api/... con authorize('permiso')
├── middlewares/   auth (JWT), tenant, authorize (RBAC), errorHandler
├── validators/    reglas de formato con Validator.js
└── utils/         Day.js, AppError
```

Flujo de una petición:
`ruta → auth (JWT) → tenant → authorize (RBAC) → controller → service (assertCan + reglas) → repository (filtra tenantId) → MongoDB`

**Decisiones de diseño**
- **Multiinquilino:** el `tenantId` sale siempre del token, nunca del body.
- **RBAC en dos capas:** se valida en el middleware de rutas y de nuevo en cada servicio.
- **SOLID:** una responsabilidad por capa (S), repositorios que extienden `BaseRepository` (O/L), un servicio pequeño por módulo (I) y servicios que dependen de repositorios, no de Mongoose (D).

## Endpoints principales

| Método | Ruta | Roles |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | público |
| GET | `/api/auth/me` | todos |
| GET/POST | `/api/users` · PATCH `/api/users/:id/role` | admin |
| GET/POST/PUT/DELETE | `/api/clients` | admin, recepcionista |
| GET · POST/PUT | `/api/services` | todos · admin |
| GET · POST/PUT | `/api/employees` · PUT `/api/employees/:id/schedule` | todos · admin |
| GET | `/api/availability?employeeId&serviceId&date` | todos |
| POST | `/api/appointments` | admin, recepcionista, cliente |
| PUT | `/api/appointments/:id` | admin, recepcionista |
| PATCH | `/api/appointments/:id/cancel` | admin, recepcionista, cliente (solo sus citas) |
| PATCH | `/api/appointments/:id/status` | admin, recepcionista, profesional (solo sus citas) |
| GET | `/api/appointments/calendar?view=day\|week\|month&date` | admin, recepcionista, profesional |
| GET | `/api/appointments?clientId&employeeId&serviceId&from&to` | admin, recepcionista |
| GET | `/api/appointments/mine` | cliente |
| GET | `/api/dashboard?from&to` | admin |

## Estructura del repositorio

```
.
├── client/      aplicación React + Vite
├── server/      API REST (Node.js + Express + Mongoose) y pruebas
├── openspec/    especificaciones por módulo (SDD)
├── docs/        guía de instalación y prompt de OpenCode
├── AGENTS.md    reglas para el asistente de código
└── README.md
```

## Desarrollo con OpenSpec (SDD)

Las especificaciones vigentes están en `openspec/specs/` y las reglas para el asistente en `AGENTS.md`.

```bash
npm install -g @fission-ai/openspec
openspec init        # elegir OpenCode
```

Flujo de trabajo en OpenCode: `/opsx:explore` → `/opsx:propose <nombre>` → `/opsx:apply` → `/opsx:archive`.

Más detalles en [docs/PROMPT_OPENCODE.md](docs/PROMPT_OPENCODE.md).



Curso: Ingeniería Web.

