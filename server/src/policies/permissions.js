const { AppError, MSG } = require('../utils/AppError');

/**
 * Política de autorización CENTRALIZADA (RBAC).
 * La usan el middleware de rutas (authorize) y también cada servicio (assertCan),
 * de modo que los permisos se validan en dos capas.
 */
const POLICIES = {
  'users:manage': ['admin'],
  'clients:read': ['admin', 'recepcionista'],
  'clients:write': ['admin', 'recepcionista'],
  'employees:read': ['admin', 'recepcionista', 'profesional', 'cliente'],
  'employees:write': ['admin'],
  'services:read': ['admin', 'recepcionista', 'profesional', 'cliente'],
  'services:write': ['admin'],
  'availability:read': ['admin', 'recepcionista', 'profesional', 'cliente'],
  'appointments:create': ['admin', 'recepcionista', 'cliente'],
  'appointments:update': ['admin', 'recepcionista'],
  'appointments:cancel': ['admin', 'recepcionista', 'cliente'],
  'appointments:status': ['admin', 'recepcionista', 'profesional'],
  'appointments:calendar': ['admin', 'recepcionista', 'profesional'],
  'appointments:search': ['admin', 'recepcionista'],
  'appointments:own': ['cliente'],
  'dashboard:read': ['admin'],
};

function can(user, action) {
  const roles = POLICIES[action];
  return Boolean(user && roles && roles.includes(user.role));
}

function assertCan(user, action) {
  if (!can(user, action)) throw new AppError(403, MSG.FORBIDDEN);
}

module.exports = { POLICIES, can, assertCan };
