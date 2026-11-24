const { AppError, MSG } = require('../utils/AppError');

/**
 * Multiinquilino: el tenantId SIEMPRE sale del token, nunca del body ni de la URL.
 * Además se elimina cualquier tenantId que el cliente intente enviar.
 */
module.exports = function tenant(req, res, next) {
  if (!req.user || !req.user.tenantId) return next(new AppError(401, MSG.UNAUTHENTICATED));
  req.tenantId = req.user.tenantId;
  if (req.body && typeof req.body === 'object') delete req.body.tenantId;
  return next();
};
