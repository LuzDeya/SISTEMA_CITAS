const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/db');

connectDB()
  .then(() => {
    app.listen(env.port, () => {
      console.log(`API lista en http://localhost:${env.port}/api`); // eslint-disable-line no-console
    });
  })
  .catch((err) => {
    console.error('No se pudo conectar a MongoDB local:', err.message); // eslint-disable-line no-console
    process.exit(1);
  });
