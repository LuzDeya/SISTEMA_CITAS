const { AppError, MSG } = require('../utils/AppError');
const { assertCan } = require('../policies/permissions');
const { clientRepository, appointmentRepository, ACTIVE_STATUSES } = require('../repositories');
const { validateClient } = require('../validators/clientValidator');

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function list(ctx, { search } = {}) {
  assertCan(ctx.user, 'clients:read');
  const filter = {};
  if (search && String(search).trim()) {
    const rx = { $regex: escapeRegex(String(search).trim()), $options: 'i' };
    filter.$or = [{ name: rx }, { dni: rx }];
  }
  return clientRepository.find(ctx.tenantId, filter, { name: 1 });
}

async function get(ctx, id) {
  assertCan(ctx.user, 'clients:read');
  const client = await clientRepository.findById(ctx.tenantId, id);
  if (!client) throw new AppError(404, MSG.NOT_FOUND);
  return client;
}

async function ensureUniqueDni(ctx, dni, exceptId = null) {
  const found = await clientRepository.findOne(ctx.tenantId, { dni });
  if (found && String(found._id) !== String(exceptId)) {
    throw new AppError(409, 'Ya existe un cliente con este DNI');
  }
}

/** HU-05 E1 */
async function create(ctx, data = {}) {
  assertCan(ctx.user, 'clients:write');
  const clean = validateClient(data);
  await ensureUniqueDni(ctx, clean.dni);
  return clientRepository.create(ctx.tenantId, clean);
}

/** HU-05 E2 */
async function update(ctx, id, data = {}) {
  assertCan(ctx.user, 'clients:write');
  await get(ctx, id);
  const clean = validateClient(data, true);
  if (clean.dni) await ensureUniqueDni(ctx, clean.dni, id);
  return clientRepository.update(ctx.tenantId, id, clean);
}

/** HU-05 E4: no se elimina si tiene citas pendientes */
async function remove(ctx, id) {
  assertCan(ctx.user, 'clients:write');
  await get(ctx, id);
  const pending = await appointmentRepository.count(ctx.tenantId, {
    clientId: id,
    status: { $in: ACTIVE_STATUSES },
  });
  if (pending > 0) throw new AppError(409, 'No se puede eliminar: el cliente tiene citas pendientes');
  await clientRepository.delete(ctx.tenantId, id);
  return { message: 'Cliente eliminado' };
}

module.exports = { list, get, create, update, remove, escapeRegex };
