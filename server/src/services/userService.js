const bcrypt = require('bcryptjs');
const { AppError, MSG } = require('../utils/AppError');
const { assertCan } = require('../policies/permissions');
const { userRepository, clientRepository } = require('../repositories');
const { ROLES } = require('../models/User');
const v = require('../validators/common');
const { publicUser } = require('./authService');

function checkRole(role) {
  if (!ROLES.includes(role)) throw new AppError(400, 'Rol no válido');
}

async function list(ctx) {
  assertCan(ctx.user, 'users:manage');
  const users = await userRepository.find(ctx.tenantId, {}, { name: 1 });
  return users.map(publicUser);
}

/** HU-03: crea un usuario del negocio con su rol */
async function create(ctx, data = {}) {
  assertCan(ctx.user, 'users:manage');
  checkRole(data.role);
  v.required([data.name, data.email, data.password]);
  v.email(data.email);
  v.password(data.password);
  if (await userRepository.findByEmail(data.email)) throw new AppError(409, 'El correo ya está registrado');

  let clientId = null;
  if (data.role === 'cliente' && data.clientId) {
    const client = await clientRepository.findById(ctx.tenantId, data.clientId);
    if (!client) throw new AppError(400, 'El cliente vinculado no existe');
    clientId = client._id;
  }

  const user = await userRepository.create(ctx.tenantId, {
    name: v.str(data.name),
    email: v.str(data.email).toLowerCase(),
    password: await bcrypt.hash(data.password, 10),
    role: data.role,
    clientId,
  });
  return publicUser(user);
}

/** HU-03 E2: cambio de rol */
async function changeRole(ctx, id, role) {
  assertCan(ctx.user, 'users:manage');
  checkRole(role);
  const user = await userRepository.update(ctx.tenantId, id, { role });
  if (!user) throw new AppError(404, MSG.NOT_FOUND);
  return publicUser(user);
}

module.exports = { list, create, changeRole };
