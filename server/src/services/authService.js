const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { AppError, MSG } = require('../utils/AppError');
const { tenantRepository, userRepository } = require('../repositories');
const v = require('../validators/common');

function publicUser(u) {
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role,
    tenantId: String(u.tenantId),
    clientId: u.clientId ? String(u.clientId) : null,
  };
}

function signToken(u) {
  return jwt.sign(
    {
      sub: String(u._id),
      role: u.role,
      tenantId: String(u.tenantId),
      clientId: u.clientId ? String(u.clientId) : null,
      name: u.name,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpires }
  );
}

/** HU-01: registra el negocio (inquilino) y su usuario administrador */
async function registerTenant(data = {}) {
  const { businessName, name, email, password } = data;
  v.required([businessName, name, email, password]);
  v.email(email);
  v.password(password);
  if (await userRepository.findByEmail(email)) throw new AppError(409, 'El correo ya está registrado');

  const tenant = await tenantRepository.create({ name: v.str(businessName) });
  try {
    const user = await userRepository.create(String(tenant._id), {
      name: v.str(name),
      email: v.str(email).toLowerCase(),
      password: await bcrypt.hash(password, 10),
      role: 'admin',
    });
    return { tenant: { id: String(tenant._id), name: tenant.name }, user: publicUser(user) };
  } catch (err) {
    await tenantRepository.delete(tenant._id); // si falla el usuario no queda una organización huérfana
    if (err && err.code === 11000) throw new AppError(409, 'El correo ya está registrado');
    throw err;
  }
}

/** HU-02: inicio de sesión */
async function login(data = {}) {
  const { email, password } = data;
  const fail = new AppError(401, 'Correo o contraseña incorrectos');
  if (!v.str(email) || typeof password !== 'string') throw fail;
  const user = await userRepository.findByEmail(email);
  if (!user || !user.active) throw fail;
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw fail;
  return { token: signToken(user), user: publicUser(user) };
}

async function me(ctx) {
  const user = await userRepository.findById(ctx.tenantId, ctx.user.id);
  if (!user) throw new AppError(401, MSG.UNAUTHENTICATED);
  return publicUser(user);
}

module.exports = { registerTenant, login, me, publicUser };
