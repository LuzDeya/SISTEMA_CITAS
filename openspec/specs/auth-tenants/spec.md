# auth-tenants Specification

## Purpose
Registro de negocios (inquilinos) y autenticación con JWT.

## Requirements

### Requirement: HU-01 Registrar mi negocio (organización) junto con su usuario administrador
Como dueño de un negocio, quiero registrar mi negocio (organización) junto con su usuario administrador, para usar el sistema en un espacio propio, separado de otros negocios (SaaS).

El sistema SHALL cumplir estas reglas de negocio:
- RN-01: El correo del administrador es único en toda la plataforma.
- RN-02: Contraseña: mínimo 8 caracteres, al menos una mayúscula y un número (Validator.js).
- RN-03: La contraseña se guarda cifrada con bcrypt; nunca se devuelve en las respuestas.
- RN-04: Organización y usuario admin se crean juntos: si falla uno, no se crea ninguno.

#### Scenario: PA-HU01-E1 Registro exitoso del negocio
- **GIVEN** No existe ningún usuario con el correo admin@saludandina.pe
- **WHEN** Registra el negocio "Centro Médico Salud Andina" con nombre del administrador, correo admin@saludandina.pe y contraseña "Salud2026" (`POST /api/auth/register`)
- **THEN** El sistema responde 201, crea la organización con un tenantId y crea al usuario con rol "admin" asociado a ese tenantId

#### Scenario: PA-HU01-E2 Inicio de sesión inmediato tras el registro
- **GIVEN** El negocio "Centro Médico Salud Andina" acaba de registrarse
- **WHEN** El administrador inicia sesión con admin@saludandina.pe y "Salud2026" (`POST /api/auth/login`)
- **THEN** El sistema responde 200 con un token JWT cuyo rol es "admin"

#### Scenario: PA-HU01-E3 Correo ya registrado
- **GIVEN** Ya existe un usuario con el correo admin@saludandina.pe
- **WHEN** Se intenta registrar otro negocio con ese mismo correo (`POST /api/auth/register`)
- **THEN** El sistema responde 409 con el mensaje "El correo ya está registrado" y no crea la organización

#### Scenario: PA-HU01-E4 Contraseña débil
- **GIVEN** La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número
- **WHEN** Se intenta registrar un negocio con la contraseña "salud1" (`POST /api/auth/register`)
- **THEN** El sistema responde 400 con el mensaje "La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número"

### Requirement: HU-02 Iniciar sesión con mi correo y contraseña
Como usuario del negocio (administrador, recepcionista, profesional o cliente), quiero iniciar sesión con mi correo y contraseña, para acceder solo a las funciones de mi rol y de mi negocio.

El sistema SHALL cumplir estas reglas de negocio:
- RN-01: El JWT expira a las 8 horas (JWT_EXPIRES).
- RN-02: El mensaje de error no indica si falló el correo o la contraseña.
- RN-03: GET /api/auth/me nunca devuelve el campo password.
- RN-04: Cerrar sesión = el frontend borra el token (JWT sin estado).

#### Scenario: PA-HU02-E1 Inicio de sesión exitoso
- **GIVEN** Existe la usuaria lucia@saludandina.pe con rol "recepcionista"
- **WHEN** Inicia sesión con su correo y contraseña correctos (`POST /api/auth/login`)
- **THEN** El sistema responde 200 con un token JWT que contiene userId, rol "recepcionista" y tenantId

#### Scenario: PA-HU02-E2 Consulta de mi perfil con el token
- **GIVEN** La usuaria inició sesión y tiene un token válido
- **WHEN** Consulta su perfil enviando el token (`GET /api/auth/me`)
- **THEN** El sistema responde 200 con su nombre, correo y rol, sin incluir la contraseña

#### Scenario: PA-HU02-E3 Contraseña incorrecta
- **GIVEN** Existe la usuaria lucia@saludandina.pe
- **WHEN** Inicia sesión con una contraseña incorrecta (`POST /api/auth/login`)
- **THEN** El sistema responde 401 con el mensaje "Correo o contraseña incorrectos"

#### Scenario: PA-HU02-E4 Ruta protegida sin token o con token inválido
- **GIVEN** La usuaria no envía token, o envía un token alterado
- **WHEN** Solicita el listado de clientes (`GET /api/clients`)
- **THEN** El sistema responde 401 con el mensaje "No autenticado"
