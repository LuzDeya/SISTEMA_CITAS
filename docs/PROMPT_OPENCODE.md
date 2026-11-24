# Prompt para OpenCode: ordenar el proyecto en server/ y client/

Úsalo en el repositorio que generaron antes con vibe coding, donde quedaron carpetas que no cumplen el estándar.
El objetivo es dejar el proyecto igual que este: **`server/`** para la API y **`client/`** para la aplicación web.

## Paso 1. Explorar (no cambia nada)

```
/opsx:explore
Analiza este repositorio. Las carpetas actuales se generaron con vibe coding y no cumplen
el estándar. La estructura objetivo es:
- server/ : API Node + Express + MongoDB, con server/src en capas: config, models,
  repositories, services, policies, controllers, routes, middlewares, validators, utils;
  y server/tests para las pruebas.
- client/ : React + Vite, con client/src en: api, context, routes, components, pages, utils.
Indica qué archivo va a cada carpeta, qué lógica de negocio está en el lugar equivocado
(por ejemplo, dentro de rutas o controladores), qué consultas a MongoDB no filtran por
tenantId y qué imports, scripts o rutas se romperían al mover las carpetas.
```

## Paso 2. Proponer el cambio

```
/opsx:propose reestructurar-server-client
Mueve todo el código de la API a la carpeta server/ y todo el código React a la carpeta
client/, usando "git mv" para conservar el historial. Elimina las carpetas que quedaron fuera
del estándar. Reorganiza server/src por capas (config, models, repositories, services,
policies, controllers, routes, middlewares, validators, utils). Reglas:
1) Los controllers solo reciben req/res y llaman a un service.
2) Los services tienen las reglas de negocio y validan permisos con policies/permissions.js.
3) Los repositories son el único lugar que usa Mongoose y siempre filtran por el tenantId del JWT.
4) Errores con formato { "message": "..." } y códigos 400, 401, 403, 404, 409.
5) Conexión a MongoDB local por defecto (MONGO_URI en .env); Atlas solo cambiando MONGO_URI.
Actualiza imports, los scripts de package.json, .env.example, el proxy /api de
client/vite.config.js y el README. No agregues funcionalidades nuevas. Al terminar,
server y client deben arrancar igual que antes.
```

## Paso 3. Revisar y aplicar

1. Revisa los archivos que genera: `proposal.md`, `design.md` y `tasks.md`.
2. Ejecuta `/opsx:apply`.
3. Prueba con `cd server && npm test` y luego `cd client && npm run dev`.
4. Cuando todo funcione, ejecuta `/opsx:archive`.

> Si tienen instalado **Superpowers**, pueden empezar con su *brainstorming* para comparar alternativas antes del `/opsx:propose`.
