const { Router } = require('express');
const c = require('../controllers');
const auth = require('../middlewares/auth');
const tenant = require('../middlewares/tenant');
const authorize = require('../middlewares/authorize');
const h = require('../utils/asyncHandler');

const router = Router();

// ---- Públicas ----
router.post('/auth/register', h(c.auth.register)); // HU-01
router.post('/auth/login', h(c.auth.login)); // HU-02

// ---- Protegidas: JWT + aislamiento por organización ----
router.use(auth, tenant);

router.get('/auth/me', h(c.auth.me));

// HU-03 Usuarios y roles
router.get('/users', authorize('users:manage'), h(c.users.list));
router.post('/users', authorize('users:manage'), h(c.users.create));
router.patch('/users/:id/role', authorize('users:manage'), h(c.users.changeRole));

// HU-05 Clientes
router.get('/clients', authorize('clients:read'), h(c.clients.list));
router.get('/clients/:id', authorize('clients:read'), h(c.clients.get));
router.post('/clients', authorize('clients:write'), h(c.clients.create));
router.put('/clients/:id', authorize('clients:write'), h(c.clients.update));
router.delete('/clients/:id', authorize('clients:write'), h(c.clients.remove));

// HU-08 Servicios
router.get('/services', authorize('services:read'), h(c.services.list));
router.get('/services/:id', authorize('services:read'), h(c.services.get));
router.post('/services', authorize('services:write'), h(c.services.create));
router.put('/services/:id', authorize('services:write'), h(c.services.update));

// HU-06 Empleados y HU-07 Jornada
router.get('/employees', authorize('employees:read'), h(c.employees.list));
router.get('/employees/:id', authorize('employees:read'), h(c.employees.get));
router.post('/employees', authorize('employees:write'), h(c.employees.create));
router.put('/employees/:id', authorize('employees:write'), h(c.employees.update));
router.put('/employees/:id/schedule', authorize('employees:write'), h(c.employees.setSchedule));

// HU-09 Disponibilidad
router.get('/availability', authorize('availability:read'), h(c.availability.get));

// HU-10 a HU-15 Citas
router.get('/appointments', authorize('appointments:search'), h(c.appointments.search));
router.get('/appointments/mine', authorize('appointments:own'), h(c.appointments.mine));
router.get('/appointments/calendar', authorize('appointments:calendar'), h(c.appointments.calendar));
router.get('/appointments/:id', h(c.appointments.get));
router.post('/appointments', authorize('appointments:create'), h(c.appointments.create));
router.put('/appointments/:id', authorize('appointments:update'), h(c.appointments.update));
router.patch('/appointments/:id/cancel', authorize('appointments:cancel'), h(c.appointments.cancel));
router.patch('/appointments/:id/status', authorize('appointments:status'), h(c.appointments.status));

// HU-16 Panel
router.get('/dashboard', authorize('dashboard:read'), h(c.dashboard.get));

module.exports = router;
