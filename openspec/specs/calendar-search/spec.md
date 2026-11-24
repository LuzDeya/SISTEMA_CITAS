# calendar-search Specification

## Purpose
Agenda en calendario y búsqueda de citas.

## Requirements

### Requirement: HU-14 Ver la agenda diaria, semanal y mensual en un calendario interactivo
Como recepcionista, quiero ver la agenda diaria, semanal y mensual en un calendario interactivo, para organizar la atención y ver rápidamente los horarios ocupados.

El sistema SHALL cumplir estas reglas de negocio:
- RN-01: Vistas válidas: day, week, month (rango calculado con Day.js).
- RN-02: Cada evento: id, title (cliente – servicio), start, end, estado, empleado.
- RN-03: El profesional solo recibe sus propias citas; admin y recepcionista, todas las del negocio.
- RN-04: Colores: programada azul, confirmada celeste, completada verde, cancelada gris, no_asistio rojo.

#### Scenario: PA-HU14-E1 Agenda del día
- **GIVEN** Hay 3 citas mañana y 1 cita pasado mañana
- **WHEN** Consulta la agenda del día de mañana (`GET /api/appointments/calendar?view=day&date`)
- **THEN** El sistema responde 200 con las 3 citas de ese día, cada una con cliente, empleado, servicio, hora de inicio, hora de fin y estado (formato de eventos para FullCalendar)

#### Scenario: PA-HU14-E2 Agenda de la semana y del mes
- **GIVEN** Hay citas en distintos días del mes
- **WHEN** Consulta la agenda con vista "week" y luego "month" (`GET /api/appointments/calendar?view=week|month&date`)
- **THEN** El sistema responde 200 con solo las citas comprendidas en esa semana y en ese mes, respectivamente

#### Scenario: PA-HU14-E3 Vista no válida
- **GIVEN** La recepcionista consulta la agenda
- **WHEN** Envía la vista "year" (`GET /api/appointments/calendar?view=year`)
- **THEN** El sistema responde 400 con el mensaje "Vista no válida: use day, week o month"

#### Scenario: PA-HU14-E4 El profesional solo ve su propia agenda
- **GIVEN** Mañana hay 2 citas de Carlos y 1 de Jorge
- **WHEN** Carlos (rol "profesional") consulta la agenda de mañana (`GET /api/appointments/calendar?view=day&date`)
- **THEN** El sistema responde 200 con solo sus 2 citas

### Requirement: HU-15 Buscar y filtrar citas por cliente, empleado, servicio o rango de fechas
Como recepcionista, quiero buscar y filtrar citas por cliente, empleado, servicio o rango de fechas, para responder rápido las consultas de los clientes.

El sistema SHALL cumplir estas reglas de negocio:
- RN-01: Todos los filtros son opcionales y se combinan con Y (AND).
- RN-02: Si se envían ambas fechas, la final no puede ser anterior a la inicial.
- RN-03: Orden: fecha de inicio descendente.
- RN-04: Roles: admin, recepcionista.

#### Scenario: PA-HU15-E1 Filtrar por cliente
- **GIVEN** "María Quispe" tiene 3 citas y otros clientes tienen 2
- **WHEN** Filtra las citas por "María Quispe" (`GET /api/appointments?clientId`)
- **THEN** El sistema responde 200 con sus 3 citas ordenadas de la más reciente a la más antigua

#### Scenario: PA-HU15-E2 Filtro combinado
- **GIVEN** Hay citas de Carlos y Jorge, de varios servicios, en los próximos 7 días
- **WHEN** Filtra por Carlos, "Consulta general" y el rango de mañana a dentro de 7 días (`GET /api/appointments?employeeId&serviceId&from&to`)
- **THEN** El sistema responde 200 con solo las citas que cumplen los tres filtros

#### Scenario: PA-HU15-E3 Rango de fechas inválido
- **GIVEN** La recepcionista arma el filtro de fechas
- **WHEN** Envía una fecha final anterior a la inicial (`GET /api/appointments?from&to`)
- **THEN** El sistema responde 400 con el mensaje "La fecha final no puede ser anterior a la inicial"

#### Scenario: PA-HU15-E4 Sin resultados
- **GIVEN** No hay citas de "Ecografía" en el rango elegido
- **WHEN** Filtra por ese servicio y rango (`GET /api/appointments?serviceId&from&to`)
- **THEN** El sistema responde 200 con una lista vacía
