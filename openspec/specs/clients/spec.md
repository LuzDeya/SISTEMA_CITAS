# clients Specification

## Purpose
Gestión de clientes (pacientes) del centro médico.

## Requirements

### Requirement: HU-05 Registrar, consultar, actualizar y eliminar clientes
Como recepcionista, quiero registrar, consultar, actualizar y eliminar clientes, para tener los datos de contacto correctos al registrar citas.

El sistema SHALL cumplir estas reglas de negocio:
- RN-01: Campos obligatorios: nombres, DNI (8 dígitos), teléfono (9 dígitos); correo opcional con formato válido.
- RN-02: El DNI es único dentro del mismo negocio (puede repetirse en otro negocio).
- RN-03: No se puede eliminar un cliente con citas programadas o confirmadas.
- RN-04: Roles permitidos: admin, recepcionista.

#### Scenario: PA-HU05-E1 Registro de un cliente
- **GIVEN** No existe en el negocio un cliente con DNI 71234567
- **WHEN** Registra a "María Quispe" con DNI 71234567, teléfono 964123456 y correo maria@mail.com (`POST /api/clients`)
- **THEN** El sistema responde 201 y el cliente aparece en el listado

#### Scenario: PA-HU05-E2 Actualización del teléfono
- **GIVEN** Existe la cliente "María Quispe"
- **WHEN** Actualiza su teléfono a 987654321 (`PUT /api/clients/:id`)
- **THEN** El sistema responde 200 y la cliente queda con el teléfono 987654321

#### Scenario: PA-HU05-E3 DNI duplicado en el mismo negocio
- **GIVEN** Ya existe en el negocio un cliente con DNI 71234567
- **WHEN** Intenta registrar otro cliente con ese DNI (`POST /api/clients`)
- **THEN** El sistema responde 409 con el mensaje "Ya existe un cliente con este DNI"

#### Scenario: PA-HU05-E4 Eliminar cliente con citas pendientes
- **GIVEN** La cliente "María Quispe" tiene una cita "programada" para mañana
- **WHEN** Intenta eliminarla (`DELETE /api/clients/:id`)
- **THEN** El sistema responde 409 con el mensaje "No se puede eliminar: el cliente tiene citas pendientes"
