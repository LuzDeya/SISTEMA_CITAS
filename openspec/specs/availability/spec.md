# availability Specification

## Purpose
Consulta de horarios libres por médico, servicio y fecha.

## Requirements

### Requirement: HU-09 Consultar los horarios libres de un empleado para un servicio en una fecha
Como recepcionista o cliente, quiero consultar los horarios libres de un empleado para un servicio en una fecha, para elegir una hora disponible sin tener que llamar o preguntar.

El sistema SHALL cumplir estas reglas de negocio:
- RN-01: Bloques cada 30 minutos desde el inicio de cada turno (Day.js).
- RN-02: Un bloque es válido si inicio + duración del servicio ≤ fin del turno.
- RN-03: Se descartan los bloques que se cruzan con citas programadas o confirmadas (las canceladas no ocupan).
- RN-04: No se consultan fechas pasadas; un día sin jornada devuelve lista vacía.
- RN-05: Roles: admin, recepcionista, cliente.

#### Scenario: PA-HU09-E1 Horarios libres de un día
- **GIVEN** Carlos trabaja mañana de 09:00 a 12:00, tiene una cita a las 10:00 y "Consulta general" dura 30 minutos
- **WHEN** Consulta la disponibilidad de Carlos para "Consulta general" mañana (`GET /api/availability?employeeId&serviceId&date`)
- **THEN** El sistema responde 200 con los horarios 09:00, 09:30, 10:30, 11:00 y 11:30

#### Scenario: PA-HU09-E2 Día sin citas
- **GIVEN** Carlos trabaja mañana de 09:00 a 11:00 y no tiene citas
- **WHEN** Consulta su disponibilidad para un servicio de 60 minutos (`GET /api/availability`)
- **THEN** El sistema responde 200 con los horarios 09:00, 09:30 y 10:00

#### Scenario: PA-HU09-E3 Fecha pasada
- **GIVEN** La fecha consultada es ayer
- **WHEN** Consulta la disponibilidad de Carlos (`GET /api/availability`)
- **THEN** El sistema responde 400 con el mensaje "No se puede consultar una fecha pasada"

#### Scenario: PA-HU09-E4 Día que el empleado no trabaja
- **GIVEN** Carlos no tiene jornada registrada para el día consultado
- **WHEN** Consulta su disponibilidad para ese día (`GET /api/availability`)
- **THEN** El sistema responde 200 con una lista vacía de horarios
