# dashboard Specification

## Purpose
Panel de control con indicadores.

## Requirements

### Requirement: HU-16 Ver un panel con indicadores básicos: citas programadas, servicios más solicitados y clientes frecuentes
Como administrador, quiero ver un panel con indicadores básicos: citas programadas, servicios más solicitados y clientes frecuentes, para tomar decisiones sobre personal y servicios con datos reales.

El sistema SHALL cumplir estas reglas de negocio:
- RN-01: totalProgramadas cuenta citas no canceladas del periodo; totalCanceladas se muestra aparte.
- RN-02: Rankings (top 5) calculados con agregación de MongoDB sobre citas no canceladas.
- RN-03: Si no se envía periodo, se usa el mes actual.
- RN-04: Negocio sin datos: indicadores en 0 y listas vacías.
- RN-05: Rol permitido: admin.

#### Scenario: PA-HU16-E1 Indicadores del periodo
- **GIVEN** En el periodo hay 5 citas programadas: 3 de "Consulta general" y 2 de "Toma de presión arterial"; "María Quispe" tiene 3 y "Juan Pérez" 2
- **WHEN** Consulta el panel para ese periodo (`GET /api/dashboard?from&to`)
- **THEN** El sistema responde 200 con totalProgramadas = 5, servicios más solicitados encabezado por "Consulta general" (3) y clientes frecuentes encabezado por "María Quispe" (3)

#### Scenario: PA-HU16-E2 Las citas canceladas no cuentan como programadas
- **GIVEN** De 5 citas del periodo, 1 está "cancelada"
- **WHEN** Consulta el panel (`GET /api/dashboard?from&to`)
- **THEN** El sistema responde 200 con totalProgramadas = 4 y totalCanceladas = 1

#### Scenario: PA-HU16-E3 Acceso sin permiso
- **GIVEN** Un usuario con rol "recepcionista" inició sesión
- **WHEN** Consulta el panel (`GET /api/dashboard`)
- **THEN** El sistema responde 403 con el mensaje "No tienes permisos para realizar esta acción"

#### Scenario: PA-HU16-E4 Negocio sin citas
- **GIVEN** El negocio no tiene ninguna cita
- **WHEN** El administrador consulta el panel (`GET /api/dashboard`)
- **THEN** El sistema responde 200 con todos los indicadores en 0 y listas vacías, sin errores
