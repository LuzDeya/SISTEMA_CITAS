# services Specification

## Purpose
Catálogo de servicios médicos con duración y costo.

## Requirements

### Requirement: HU-08 Registrar, consultar, actualizar y desactivar los servicios con su duración y costo
Como administrador, quiero registrar, consultar, actualizar y desactivar los servicios con su duración y costo, para que cada cita use la duración y el costo correctos.

El sistema SHALL cumplir estas reglas de negocio:
- RN-01: Nombre obligatorio y único dentro del negocio.
- RN-02: Duración (minutos) y costo (soles) deben ser mayores a 0.
- RN-03: Un servicio no se elimina: se desactiva; uno inactivo no admite nuevas citas.
- RN-04: Búsqueda por nombre sin distinguir mayúsculas, solo servicios activos.
- RN-05: Crear/editar: admin. Consultar: todos los roles.

#### Scenario: PA-HU08-E1 Registro de un servicio
- **GIVEN** No existe el servicio "Toma de presión arterial"
- **WHEN** Lo registra con duración 30 minutos y costo 15.00 (`POST /api/services`)
- **THEN** El sistema responde 201 y el servicio queda activo

#### Scenario: PA-HU08-E2 Búsqueda de servicios por nombre
- **GIVEN** Existen los servicios activos "Consulta general", "Consulta pediátrica" y "Toma de presión arterial"
- **WHEN** Busca "consulta" (`GET /api/services?search=consulta`)
- **THEN** El sistema responde 200 con solo "Consulta general" y "Consulta pediátrica"

#### Scenario: PA-HU08-E3 Costo o duración inválidos
- **GIVEN** El administrador registra un servicio
- **WHEN** Ingresa costo -15 o duración 0 (`POST /api/services`)
- **THEN** El sistema responde 400 con el mensaje "El costo y la duración deben ser mayores a 0"

#### Scenario: PA-HU08-E4 Servicio desactivado
- **GIVEN** "Ecografía" fue desactivado
- **WHEN** Se intenta registrar una cita con ese servicio (`POST /api/appointments`)
- **THEN** El sistema responde 400 con el mensaje "El servicio no está activo"
