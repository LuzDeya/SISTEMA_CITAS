const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { AppError, MSG } = require('../utils/AppError');

/** Verifica el JWT y deja en req.user los datos del usuario (id, rol, tenantId, clientId). */
module.exports = function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const [type, token] = header.split(' ');
  if (type !== 'Bearer' || !token) return next(new AppError(401, MSG.UNAUTHENTICATED));
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = {
      id: payload.sub,
      role: payload.role,
      tenantId: payload.tenantId,
      clientId: payload.clientId || null,
      name: payload.name,
    };
    return next();
  } catch (e) {
    return next(new AppError(401, MSG.UNAUTHENTICATED));
  }
};
