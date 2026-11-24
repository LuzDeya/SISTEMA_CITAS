const { AppError, MSG } = require('../utils/AppError');
const { assertCan } = require('../policies/permissions');
const { employeeRepository, serviceRepository, userRepository } = require('../repositories');
const { validateSchedule } = require('../validators/scheduleValidator');
const { str } = require('../validators/common');

async function list(ctx, { all } = {}) {
  assertCan(ctx.user, 'employees:read');
  const filter = String(all) === 'true' ? {} : { active: true };
  return employeeRepository.find(ctx.tenantId, filter, { name: 1 });
}

async function get(ctx, id) {
  assertCan(ctx.user, 'employees:read');
  const e = await employeeRepository.findById(ctx.tenantId, id);
  if (!e) throw new AppError(404, MSG.NOT_FOUND);
  return e;
}

/** Todos los servicios asignados deben existir y estar activos en el mismo negocio */
async function checkServices(ctx, services) {
  if (!Array.isArray(services) || services.length === 0) {
    throw new AppError(400, 'Debe asignar al menos un servicio');
  }
  const unique = [...new Set(services.map(String))];
  for (const id of unique) {
    const s = await serviceRepository.findById(ctx.tenantId, id);
    if (!s || !s.active) throw new AppError(400, 'Servicio no válido');
  }
  return unique;
}

async function checkUser(ctx, userId) {
  if (!userId) return null;
  const u = await userRepository.findById(ctx.tenantId, userId);
  if (!u || u.role !== 'profesional') throw new AppError(400, 'El usuario vinculado debe tener rol profesional');
  return u._id;
}

/** HU-06 E1 / E3 */
async function create(ctx, data = {}) {
  assertCan(ctx.user, 'employees:write');
  if (!str(data.name)) throw new AppError(400, 'El nombre es obligatorio');
  const services = await checkServices(ctx, data.services);
  const userId = await checkUser(ctx, data.userId);
  return employeeRepository.create(ctx.tenantId, {
    name: str(data.name),
    phone: str(data.phone),
    email: str(data.email).toLowerCase(),
    services,
    userId,
    schedule: [],
    active: true,
  });
}

/** HU-06 E2 (servicios) y desactivación (active: false) */
async function update(ctx, id, data = {}) {
  assertCan(ctx.user, 'employees:write');
  await get(ctx, id);
  const changes = {};
  if (data.name !== undefined) {
    if (!str(data.name)) throw new AppError(400, 'El nombre es obligatorio');
    changes.name = str(data.name);
  }
  if (data.phone !== undefined) changes.phone = str(data.phone);
  if (data.email !== undefined) changes.email = str(data.email).toLowerCase();
  if (data.services !== undefined) changes.services = await checkServices(ctx, data.services);
  if (data.userId !== undefined) changes.userId = await checkUser(ctx, data.userId);
  if (data.active !== undefined) changes.active = Boolean(data.active);
  return employeeRepository.update(ctx.tenantId, id, changes);
}

/** HU-07: reemplaza la jornada semanal completa */
async function setSchedule(ctx, id, schedule) {
  assertCan(ctx.user, 'employees:write');
  await get(ctx, id);
  const clean = validateSchedule(schedule);
  return employeeRepository.update(ctx.tenantId, id, { schedule: clean });
}

module.exports = { list, get, create, update, setSchedule };
