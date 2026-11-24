# Instrucciones para el asistente (OpenCode)

Este proyecto sigue Spec-Driven Development con OpenSpec. Antes de cambiar código:

1. Lee `openspec/project.md` y la spec del módulo en `openspec/specs/<modulo>/spec.md`.
2. Para cambios nuevos usa `/opsx:explore` y luego `/opsx:propose <nombre>`; implementa con `/opsx:apply`.
3. Respeta la arquitectura por capas de `server/src` (routes → controllers → services → repositories → models).
4. Nunca leas `tenantId` del body: siempre de `req.user` (JWT). Todo acceso a datos pasa por `src/repositories`.
5. Los permisos se definen solo en `src/policies/permissions.js`.
6. Al terminar, `cd server && npm test` debe pasar las 64 pruebas de aceptación (PA-HU01-E1 … PA-HU16-E4).
