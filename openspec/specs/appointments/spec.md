# appointments Specification

## Purpose
Registro, modificación, cancelación y estados de las citas.

## Requirements

### Requirement: HU-10 Registrar una cita eligiendo cliente, servicio, empleado y horario libre
Como recepcionista o cliente, quiero registrar una cita eligiendo cliente, servicio, empleado y horario libre, para asegurar la atención sin cruces de horario.

El sistema SHALL cumplir estas reglas de negocio:
- RN-01: Hora de fin = inicio + duración del servicio; costo copiado del servicio.
- RN-02: Empleado y servicio deben estar activos, y el empleado debe atender ese servicio.
- RN-03: La cita debe quedar completa dentro de un turno de la jornada.
- RN-04: No puede cruzarse con otra cita programada/confirmada del mismo empleado.
- RN-05: No se registran citas en una fecha u hora pasada (400 «No se puede reservar en una fecha u hora pasada»); el calendario tampoco lo permite.
- RN-06: Estado inicial: programada. Si el rol es cliente, la cita se asigna a su propia ficha.
- RN-07: Roles: admin, recepcionista, cliente.

#### Scenario: PA-HU10-E1 Registro exitoso
- **GIVEN** Carlos trabaja mañana de 09:00 a 13:00 y no tiene citas a las 09:00
- **WHEN** La recepcionista registra para "María Quispe" un "Consulta general" (30 min) con Carlos mañana a las 09:00 (`POST /api/appointments`)
- **THEN** El sistema responde 201 y crea la cita con estado "programada", hora de fin 09:30 y costo 25.00

#### Scenario: PA-HU10-E2 El cliente reserva su propia cita
- **GIVEN** Existe un usuario con rol "cliente" vinculado a la cliente "María Quispe"
- **WHEN** Ese usuario registra una cita mañana a las 11:00 sin indicar el cliente (`POST /api/appointments`)
- **THEN** El sistema responde 201 y asigna la cita automáticamente a "María Quispe"

#### Scenario: PA-HU10-E3 Reserva duplicada (mismo empleado y horario)
- **GIVEN** Carlos ya tiene una cita mañana de 09:00 a 09:30
- **WHEN** Se intenta registrar otra cita con Carlos mañana a las 09:15 (`POST /api/appointments`)
- **THEN** El sistema responde 409 con el mensaje "El empleado ya tiene una cita en ese horario"

#### Scenario: PA-HU10-E4 Horario fuera de la jornada
- **GIVEN** Carlos trabaja mañana solo de 09:00 a 13:00
- **WHEN** Se intenta registrar una cita con él mañana a las 12:45 para un servicio de 30 minutos (`POST /api/appointments`)
- **THEN** El sistema responde 400 con el mensaje "El horario está fuera de la jornada del empleado"

### Requirement: HU-11 Modificar o reprogramar una cita (fecha, hora, empleado o servicio)
Como recepcionista, quiero modificar o reprogramar una cita (fecha, hora, empleado o servicio), para adaptarla a los cambios del cliente sin cancelarla y volver a registrarla.

El sistema SHALL cumplir estas reglas de negocio:
- RN-01: Solo se modifican citas programadas o confirmadas.
- RN-02: Se recalculan hora de fin y costo si cambia el servicio.
- RN-03: Se revalida jornada y cruce de horario (sin contar la propia cita); no se puede mover a una fecha u hora pasada.
- RN-04: Se guarda en el historial de la cita la fecha/hora anterior.
- RN-05: Roles: admin, recepcionista.

#### Scenario: PA-HU11-E1 Reprogramación a otro horario libre
- **GIVEN** Existe una cita "programada" mañana a las 09:00 con Carlos y Carlos está libre mañana a las 11:00
- **WHEN** La reprograma para mañana a las 11:00 (`PUT /api/appointments/:id`)
- **THEN** El sistema responde 200, la cita queda a las 11:00 y el horario de las 09:00 vuelve a estar libre

#### Scenario: PA-HU11-E2 Cambio de empleado
- **GIVEN** Existe una cita mañana a las 09:00 con Carlos y Jorge, que atiende el mismo servicio, está libre a esa hora
- **WHEN** Cambia el empleado a Jorge (`PUT /api/appointments/:id`)
- **THEN** El sistema responde 200 y la cita queda asignada a Jorge a las 09:00

#### Scenario: PA-HU11-E3 Nuevo horario ocupado
- **GIVEN** Carlos tiene otra cita mañana a las 11:00
- **WHEN** Intenta reprogramar una cita a mañana a las 11:00 con Carlos (`PUT /api/appointments/:id`)
- **THEN** El sistema responde 409 con el mensaje "El empleado ya tiene una cita en ese horario" y la cita original no cambia

#### Scenario: PA-HU11-E4 Cita cancelada o completada
- **GIVEN** La cita está en estado "cancelada"
- **WHEN** Intenta reprogramarla (`PUT /api/appointments/:id`)
- **THEN** El sistema responde 400 con el mensaje "Solo se pueden modificar citas programadas o confirmadas"

### Requirement: HU-12 Cancelar una cita indicando el motivo
Como recepcionista o cliente, quiero cancelar una cita indicando el motivo, para liberar el horario y que otra persona pueda usarlo.

El sistema SHALL cumplir estas reglas de negocio:
- RN-01: Motivo obligatorio.
- RN-02: Solo se cancelan citas programadas o confirmadas; completadas no.
- RN-03: Una cita cancelada no ocupa horario en la disponibilidad.
- RN-04: Se registra quién canceló y cuándo.
- RN-05: Roles: admin, recepcionista, cliente (solo sus citas).

#### Scenario: PA-HU12-E1 Cancelación exitosa
- **GIVEN** Existe una cita "programada" mañana a las 09:00 con Carlos
- **WHEN** La recepcionista la cancela con el motivo "Viaje imprevisto" (`PATCH /api/appointments/:id/cancel`)
- **THEN** El sistema responde 200, la cita queda "cancelada" con su motivo y el horario de las 09:00 vuelve a aparecer como libre

#### Scenario: PA-HU12-E2 El cliente cancela su propia cita
- **GIVEN** El usuario con rol "cliente" tiene una cita "programada"
- **WHEN** La cancela con un motivo (`PATCH /api/appointments/:id/cancel`)
- **THEN** El sistema responde 200 y la cita queda "cancelada"

#### Scenario: PA-HU12-E3 Cancelar una cita completada
- **GIVEN** La cita está en estado "completada"
- **WHEN** Intenta cancelarla (`PATCH /api/appointments/:id/cancel`)
- **THEN** El sistema responde 400 con el mensaje "No se puede cancelar una cita completada"

#### Scenario: PA-HU12-E4 Cliente intenta cancelar una cita ajena
- **GIVEN** Un usuario con rol "cliente" intenta cancelar una cita de otro cliente
- **WHEN** Envía la cancelación (`PATCH /api/appointments/:id/cancel`)
- **THEN** El sistema responde 403 con el mensaje "No tienes permisos para realizar esta acción"

### Requirement: HU-13 Cambiar el estado de mis citas a confirmada, completada o no asistió
Como profesional, quiero cambiar el estado de mis citas a confirmada, completada o no asistió, para que la agenda y los indicadores muestren lo que realmente ocurrió.

El sistema SHALL cumplir estas reglas de negocio:
- RN-01: Transiciones permitidas: programada → confirmada | cancelada; confirmada → completada | no_asistio | cancelada.
- RN-02: completada, cancelada y no_asistio son estados finales.
- RN-03: Un profesional solo cambia el estado de sus propias citas; admin y recepcionista, de cualquiera.
- RN-04: Roles: admin, recepcionista, profesional.

#### Scenario: PA-HU13-E1 Marcar como completada
- **GIVEN** Carlos tiene una cita "confirmada"
- **WHEN** La marca como "completada" (`PATCH /api/appointments/:id/status`)
- **THEN** El sistema responde 200 y la cita queda "completada"

#### Scenario: PA-HU13-E2 Confirmar una cita programada
- **GIVEN** Carlos tiene una cita "programada"
- **WHEN** La marca como "confirmada" (`PATCH /api/appointments/:id/status`)
- **THEN** El sistema responde 200 y la cita queda "confirmada"

#### Scenario: PA-HU13-E3 Cambio de estado no permitido
- **GIVEN** La cita está "completada"
- **WHEN** Intenta cambiarla a "programada" (`PATCH /api/appointments/:id/status`)
- **THEN** El sistema responde 400 con el mensaje "Cambio de estado no permitido" (permitidos: programada→confirmada/cancelada; confirmada→completada/no_asistio/cancelada)

#### Scenario: PA-HU13-E4 Profesional intenta cambiar una cita de otro profesional
- **GIVEN** La cita pertenece a Jorge
- **WHEN** Carlos intenta marcarla como "completada" (`PATCH /api/appointments/:id/status`)
- **THEN** El sistema responde 403 con el mensaje "No tienes permisos para realizar esta acción"
