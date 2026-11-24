require('dotenv').config();

const isTest = process.env.NODE_ENV === 'test';

module.exports = {
  port: Number(process.env.PORT) || 4000,
  mongoUri: isTest
    ? process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/reservas_test'
    : process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/reservas',
  jwtSecret: process.env.JWT_SECRET || 'clave_de_desarrollo',
  jwtExpires: process.env.JWT_EXPIRES || '8h',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
