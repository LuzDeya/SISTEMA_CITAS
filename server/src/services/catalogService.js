// Servicios ofrecidos por el negocio (se llama "catalog" para no confundir con la capa services/)
const { AppError, MSG } = require('../utils/AppError');
const { assertCan, can } = require('../policies/permissions');
const { serviceRepository } = require('../repositories');
const { validateService } = require('../validators/serviceValidator');
const { escapeRegex } = require('./clientService');

/** HU-08 E2: búsqueda por nombre; solo activos salvo que el admin pida todos */
async function list(ctx, { search, all } = {}) {
  assertCan(ctx.user, 'services:read');
  const filter = {};
  if (!(String(all) === 'true' && can(ctx.user, 'services:write'))) filter.active = true;
  if (search && String(search).trim()) {
    filter.name = { $regex: escapeRegex(String(search).trim()), $options: 'i' };
  }
  return serviceRepository.find(ctx.tenantId, filter, { name: 1 });
}

async function get(ctx, id) {
  assertCan(ctx.user, 'services:read');
  const s = await serviceRepository.findById(ctx.tenantId, id);
  if (!s) throw new AppError(404, MSG.NOT_FOUND);
  return s;
}

async function ensureUniqueName(ctx, name, exceptId = null) {
  const rx = { $regex: `^${escapeRegex(name)}$`, $options: 'i' };
  const found = await serviceRepository.findOne(ctx.tenantId, { name: rx });
  if (found && String(found._id) !== String(exceptId)) {
    throw new AppError(409, 'Ya existe un servicio con ese nombre');
  }
}

/** HU-08 E1 / E3 */
async function create(ctx, data = {}) {
  assertCan(ctx.user, 'services:write');
  const clean = validateService(data);
  await ensureUniqueName(ctx, clean.name);
  return serviceRepository.create(ctx.tenantId, { ...clean, active: true });
}

/** Actualizar costo/duración o desactivar (active: false). No se elimina. */
async function update(ctx, id, data = {}) {
  assertCan(ctx.user, 'services:write');
  await get(ctx, id);
  const clean = validateService(data, true);
  if (clean.name) await ensureUniqueName(ctx, clean.name, id);
  return serviceRepository.update(ctx.tenantId, id, clean);
}

module.exports = { list, get, create, update };
