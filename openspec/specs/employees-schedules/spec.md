# employees-schedules Specification

## Purpose
Gestión de empleados (médicos) y su jornada laboral.

## Requirements

### Requirement: HU-06 Registrar, consultar, actualizar y desactivar empleados indicando los servicios que atienden
Como administrador, quiero registrar, consultar, actualizar y desactivar empleados indicando los servicios que atienden, para que solo se reserven citas con profesionales activos y que atienden ese servicio.

El sistema SHALL cumplir estas reglas de negocio:
- RN-01: Todo empleado debe tener al menos un servicio asignado.
- RN-02: Solo se pueden asignar servicios activos del mismo negocio.
- RN-03: Un empleado inactivo no aparece para nuevas citas; sus citas anteriores se conservan.
- RN-04: El empleado puede vincularse a un usuario con rol profesional.
- RN-05: Rol permitido: admin.

#### Scenario: PA-HU06-E1 Registro de un empleado
- **GIVEN** Existe el servicio activo "Consulta general"
- **WHEN** Registra a "Carlos Ramírez" asignándole "Consulta general" (`POST /api/employees`)
- **THEN** El sistema responde 201 y el empleado queda activo con ese servicio

#### Scenario: PA-HU06-E2 Agregar un servicio al empleado
- **GIVEN** "Carlos Ramírez" atiende solo "Consulta general" y existe el servicio "Toma de presión arterial"
- **WHEN** Le agrega "Toma de presión arterial" (`PUT /api/employees/:id`)
- **THEN** El sistema responde 200 y el empleado queda con los dos servicios

#### Scenario: PA-HU06-E3 Empleado sin servicios
- **GIVEN** El administrador completó los datos del empleado
- **WHEN** Intenta registrarlo sin ningún servicio (`POST /api/employees`)
- **THEN** El sistema responde 400 con el mensaje "Debe asignar al menos un servicio"

#### Scenario: PA-HU06-E4 Empleado desactivado no recibe citas
- **GIVEN** "Carlos Ramírez" fue desactivado
- **WHEN** Se intenta registrar una cita con él (`POST /api/appointments`)
- **THEN** El sistema responde 400 con el mensaje "El empleado no está activo"

### Requirement: HU-07 Registrar la jornada laboral semanal de cada empleado (días y horas)
Como administrador, quiero registrar la jornada laboral semanal de cada empleado (días y horas), para que solo se ofrezcan horarios en los que el empleado trabaja.

El sistema SHALL cumplir estas reglas de negocio:
- RN-01: Días: 0 (domingo) a 6 (sábado). Horas en formato HH:mm.
- RN-02: En cada turno la hora de fin debe ser mayor que la de inicio.
- RN-03: Los turnos de un mismo día no pueden cruzarse.
- RN-04: Guardar la jornada reemplaza la jornada anterior completa.
- RN-05: Rol permitido: admin.

#### Scenario: PA-HU07-E1 Registro de jornada
- **GIVEN** "Carlos Ramírez" está activo
- **WHEN** Registra su jornada de lunes a sábado de 09:00 a 13:00 (`PUT /api/employees/:id/schedule`)
- **THEN** El sistema responde 200 y guarda la jornada del empleado

#### Scenario: PA-HU07-E2 Dos turnos en un mismo día
- **GIVEN** "Carlos Ramírez" trabaja de 09:00 a 13:00
- **WHEN** Agrega un segundo turno de 15:00 a 19:00 el mismo día (`PUT /api/employees/:id/schedule`)
- **THEN** El sistema responde 200 y la jornada de ese día queda con los dos turnos

#### Scenario: PA-HU07-E3 Hora de fin anterior a la de inicio
- **GIVEN** El administrador edita la jornada de Carlos
- **WHEN** Registra un turno de 18:00 a 14:00 (`PUT /api/employees/:id/schedule`)
- **THEN** El sistema responde 400 con el mensaje "La hora de fin debe ser posterior a la hora de inicio"

#### Scenario: PA-HU07-E4 Turnos que se cruzan
- **GIVEN** El administrador edita la jornada de Carlos
- **WHEN** Registra el mismo día los turnos 09:00–13:00 y 12:00–16:00 (`PUT /api/employees/:id/schedule`)
- **THEN** El sistema responde 400 con el mensaje "Los turnos no pueden cruzarse"
