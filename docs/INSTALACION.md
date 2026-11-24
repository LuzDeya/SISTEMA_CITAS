# Guía de instalación — CitaFácil (Sistema Web de Reservas de Citas)

Base de datos: **MongoDB**. Recomendamos MongoDB local, que es lo que indicó el docente.
También funciona con MongoDB Atlas cambiando solo el archivo `.env`.

---

## 1. Programas necesarios

| Programa | Versión | Para qué |
|---|---|---|
| Node.js | 18 o superior (LTS) | Ejecutar el servidor (server) y el cliente web (client) |
| MongoDB Community Server | 7 u 8 | Base de datos local |
| MongoDB Compass | incluido en el instalador | Ver los datos gráficamente |
| Visual Studio Code y OpenCode | — | Desarrollo (SDD) |

Comprueba Node en una terminal:

```bash
node -v
npm -v
```

---

## 2A. Opción recomendada: MongoDB local (Windows)

1. Descarga **MongoDB Community Server** desde mongodb.com/try/download/community (MSI para Windows).
2. En el instalador, elige **Complete** y marca:
   - ✅ *Install MongoDB as a Service* (así arranca solo con Windows)
   - ✅ *Install MongoDB Compass*
3. Termina la instalación y abre **MongoDB Compass**.
4. Conéctate a `mongodb://127.0.0.1:27017` con el botón *Connect*. Si conecta, Mongo está funcionando.

Si no conecta:
- Abre `services.msc` y comprueba que el servicio **MongoDB Server** esté *En ejecución*. Si no lo está, haz clic derecho y elige *Iniciar*.
- Usa `127.0.0.1` en lugar de `localhost`.

> En macOS: `brew tap mongodb/brew && brew install mongodb-community && brew services start mongodb-community`.
> En Linux (Ubuntu): sigue la guía oficial "Install MongoDB Community on Ubuntu" y luego ejecuta `sudo systemctl start mongod`.

No hace falta crear la base de datos: se crea sola la primera vez que el sistema guarda datos.

---

## 2B. Opción alternativa: MongoDB Atlas (en la nube)

1. Crea una cuenta en mongodb.com/atlas y luego un cluster **M0 (gratis)**.
2. En **Database Access**, crea un usuario con contraseña (por ejemplo `citas` / `Citas2026`).
3. En **Network Access**, agrega tu IP. En clase puedes usar `0.0.0.0/0`, que permite conexiones desde cualquier lugar.
4. En **Connect → Drivers**, copia la cadena `mongodb+srv://...`.
5. En `server/.env`, comenta las líneas de Mongo local, descomenta las de Atlas y pega tu cadena:
   - `/reservas` para la base normal.
   - `/reservas_test` para la base de pruebas.

> Atlas necesita internet y el cluster gratuito puede pausarse si no se usa. Por eso, para la exposición conviene usar el local.

---

## 3. Servidor (carpeta server)

```bash
cd server
copy .env.example .env        # macOS/Linux: cp .env.example .env
npm install
npm test                      # deben pasar las 64 pruebas de aceptación
npm run seed                  # carga datos de demostración
npm run dev                   # API en http://localhost:4000/api
```

Prueba rápida: abre http://localhost:4000/api/health. Debe responder `{"status":"ok"}`.

> `npm test` usa la base `reservas_test` y la limpia en cada prueba. **No** borra los datos de `reservas`.
> `npm run seed` **sí** reinicia la base `reservas` con los datos de demostración.

## 4. Cliente web (carpeta client, en otra terminal)

```bash
cd client
npm install
npm run dev                   # abre http://localhost:5173
```

## 5. Usuarios de demostración (contraseña: `Salud2026`)

| Rol | Correo |
|---|---|
| Administrador | admin@saludandina.pe |
| Recepcionista | lucia@saludandina.pe |
| Profesional | carlos@saludandina.pe · jorge@saludandina.pe |
| Cliente | maria@mail.com |
| Administrador de otro negocio | admin@santarosa.pe |

El usuario `admin@santarosa.pe` pertenece a otro negocio y sirve para demostrar el aislamiento multiinquilino: no ve ningún dato de "Centro Médico Salud Andina".

## 6. Problemas frecuentes

| Mensaje | Solución |
|---|---|
| `No se pudo conectar a MongoDB local` | El servicio MongoDB no está iniciado (ver punto 2A) o la cadena del `.env` está mal escrita. |
| `ECONNREFUSED ::1:27017` | Usa `127.0.0.1` en lugar de `localhost` en el `.env`. |
| `bad auth` (Atlas) | El usuario o la contraseña de Database Access son incorrectos. |
| Atlas: timeout | Falta autorizar tu IP en Network Access. |
| La página de login no carga datos | El servidor (server) no está corriendo en el puerto 4000. |
| `npm test` muy lento con Atlas | Es normal por la red; con Mongo local tarda pocos segundos. |
