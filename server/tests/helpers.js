/**
 * Utilidades comunes de las pruebas de aceptación.
 * Base de datos: MongoDB LOCAL (MONGO_URI_TEST, por defecto reservas_test). Se limpia antes de cada prueba.
 * Las fechas son relativas (mañana, ayer…) para que las pruebas no caduquen.
 */
process.env.NODE_ENV = 'test';
const request = require('supertest');
const mongoose = require('mongoose');
const dayjs = require('dayjs');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');

const api = () => request(app);
const bearer = (token) => ({ Authorization: `Bearer ${token}` });

function useDatabase() {
  beforeAll(async () => {
    await connectDB();
  });
  beforeEach(async () => {
    const cols = Object.values(mongoose.connection.collections);
    await Promise.all(cols.map((c) => c.deleteMany({})));
  });
  afterAll(async () => {
    await disconnectDB();
  });
}

/** 'YYYY-MM-DD' desplazado n días desde hoy */
const day = (offset = 0) => dayjs().startOf('day').add(offset, 'day').format('YYYY-MM-DD');
/** ISO de una fecha relativa a una hora local "HH:mm" */
const at = (offset, hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return dayjs().startOf('day').add(offset, 'day').hour(h).minute(m).second(0).millisecond(0).toISOString();
};
const hhmm = (iso) => dayjs(iso).format('HH:mm');
const allDays = (start, end) => [0, 1, 2, 3, 4, 5, 6].map((d) => ({ day: d, start, end }));

async function login(email, password = 'Salud2026') {
  const res = await api().post('/api/auth/login').send({ email, password });
  if (res.status !== 200) throw new Error(`login ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.token;
}

/** Registra un negocio y devuelve el token de su administrador */
async function registerBusiness(businessName = 'Centro Médico Salud Andina', email = 'admin@saludandina.pe') {
  const res = await api()
    .post('/api/auth/register')
    .send({ businessName, name: 'Administrador', email, password: 'Salud2026' });
  if (res.status !== 201) throw new Error(`register: ${res.status} ${JSON.stringify(res.body)}`);
  return { token: await login(email), tenantId: res.body.tenant.id };
}

async function createUser(adminToken, { name, email, role, clientId }) {
  const res = await api()
    .post('/api/users')
    .set(bearer(adminToken))
    .send({ name, email, role, clientId, password: 'Salud2026' });
  if (res.status !== 201) throw new Error(`user: ${res.status} ${JSON.stringify(res.body)}`);
  return { id: res.body.id, token: await login(email) };
}

async function post(token, url, body, expected = 201) {
  const res = await api().post(url).set(bearer(token)).send(body);
  if (res.status !== expected) throw new Error(`${url}: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body;
}

const createService = (token, name, duration = 30, price = 25) =>
  post(token, '/api/services', { name, duration, price });

const createClient = (token, name, dni, phone = '964123456') =>
  post(token, '/api/clients', { name, dni, phone, email: '' });

async function createEmployee(token, name, services, schedule = allDays('09:00', '13:00'), userId) {
  const e = await post(token, '/api/employees', { name, services, userId });
  const res = await api().put(`/api/employees/${e._id}/schedule`).set(bearer(token)).send({ schedule });
  if (res.status !== 200) throw new Error(`schedule: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body;
}

const createAppointment = (token, { clientId, employeeId, serviceId, startAt }) =>
  post(token, '/api/appointments', { clientId, employeeId, serviceId, startAt });

async function setStatus(token, id, status) {
  const res = await api().patch(`/api/appointments/${id}/status`).set(bearer(token)).send({ status });
  if (res.status !== 200) throw new Error(`status: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body;
}

/**
 * Escenario base: Centro Médico Salud Andina con admin, recepcionista, servicio "Consulta general" (30 min, S/ 25),
 * empleado Carlos (todos los días 09:00–13:00) y la cliente María Quispe.
 */
async function centro() {
  const admin = await registerBusiness();
  const recep = await createUser(admin.token, { name: 'Lucía Medina', email: 'lucia@saludandina.pe', role: 'recepcionista' });
  const consulta = await createService(admin.token, 'Consulta general', 30, 25);
  const carlos = await createEmployee(admin.token, 'Carlos Ramírez', [consulta._id]);
  const maria = await createClient(recep.token, 'María Quispe', '71234567');
  return { admin, recep, consulta, carlos, maria };
}

module.exports = {
  api, bearer, useDatabase, day, at, hhmm, allDays, login, registerBusiness, createUser,
  createService, createClient, createEmployee, createAppointment, setStatus, centro, post,
};
