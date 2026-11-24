# users-roles Specification

## Purpose
Usuarios, control de acceso basado en roles (RBAC) y aislamiento multiinquilino.

## Requirements

### Requirement: HU-03 Crear usuarios de mi negocio y asignarles un rol (admin, recepcionista, profesional o cliente)
Como administrador, quiero crear usuarios de mi negocio y asignarles un rol (admin, recepcionista, profesional o cliente), para que cada persona realice solo las operaciones permitidas a su perfil (RBAC).

El sistema SHALL cumplir estas reglas de negocio:
- RN-01: Roles válidos: admin, recepcionista, profesional, cliente.
- RN-02: Permisos: admin → todo; recepcionista → clientes, citas, agenda, disponibilidad; profesional → su agenda y estado de sus citas; cliente → disponibilidad y sus propias citas.
- RN-03: El usuario creado hereda el tenantId del administrador que lo crea.
- RN-04: Solo el admin puede crear usuarios o cambiar roles.

#### Scenario: PA-HU03-E1 Creación de un usuario con rol
- **GIVEN** El administrador inició sesión
- **WHEN** Crea a "Lucía Medina" (lucia@saludandina.pe) con rol "recepcionista" (`POST /api/users`)
- **THEN** El sistema responde 201 y el usuario queda registrado con ese rol en el mismo tenantId del administrador

#### Scenario: PA-HU03-E2 Cambio de rol
- **GIVEN** "Lucía Medina" tiene rol "recepcionista"
- **WHEN** El administrador le cambia el rol a "profesional" (`PATCH /api/users/:id/role`)
- **THEN** El sistema responde 200 y el usuario queda con rol "profesional"

#### Scenario: PA-HU03-E3 Operación no permitida para el rol
- **GIVEN** Un usuario con rol "profesional" inició sesión
- **WHEN** Intenta crear un empleado (`POST /api/employees`)
- **THEN** El sistema responde 403 con el mensaje "No tienes permisos para realizar esta acción"

#### Scenario: PA-HU03-E4 Rol inexistente
- **GIVEN** El administrador está creando un usuario
- **WHEN** Le asigna el rol "gerente", que no existe (`POST /api/users`)
- **THEN** El sistema responde 400 con el mensaje "Rol no válido"

### Requirement: HU-04 Que los datos de mi negocio estén aislados de los de otros negocios
Como administrador, quiero que los datos de mi negocio estén aislados de los de otros negocios, para que ningún usuario externo vea ni modifique mis clientes, empleados, servicios o citas.

El sistema SHALL cumplir estas reglas de negocio:
- RN-01: El middleware tenant toma el tenantId exclusivamente del JWT.
- RN-02: Los repositorios agregan { tenantId } a todo find, update y delete.
- RN-03: Un recurso de otro negocio responde 404 (no se revela que existe).
- RN-04: Cualquier tenantId enviado en el body se descarta.

#### Scenario: PA-HU04-E1 Listado filtrado por negocio
- **GIVEN** Existen "Centro Médico Salud Andina" con 3 clientes y "Policlínico Santa Rosa" con 2 clientes
- **WHEN** El administrador de Centro Médico Salud Andina lista los clientes (`GET /api/clients`)
- **THEN** El sistema responde 200 con solo sus 3 clientes

#### Scenario: PA-HU04-E2 tenantId asignado desde el token
- **GIVEN** La recepcionista de Centro Médico Salud Andina inició sesión
- **WHEN** Registra un cliente sin enviar ningún tenantId (`POST /api/clients`)
- **THEN** El sistema guarda el cliente con el tenantId de su token

#### Scenario: PA-HU04-E3 Acceso a un registro de otro negocio
- **GIVEN** El cliente con id X pertenece a "Policlínico Santa Rosa"
- **WHEN** El administrador de Centro Médico Salud Andina solicita ese cliente por su id (`GET /api/clients/:id`)
- **THEN** El sistema responde 404 con el mensaje "Recurso no encontrado"

#### Scenario: PA-HU04-E4 tenantId falso en el cuerpo de la petición
- **GIVEN** El administrador de Centro Médico Salud Andina conoce el tenantId de "Policlínico Santa Rosa"
- **WHEN** Registra un cliente enviando en el cuerpo el tenantId de "Policlínico Santa Rosa" (`POST /api/clients`)
- **THEN** El sistema ignora ese valor y guarda el cliente con el tenantId del token
