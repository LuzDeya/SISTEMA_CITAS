const { assertCan } = require('../policies/permissions');

/** Middleware RBAC: authorize('clients:write') */
module.exports = (action) => (req, res, next) => {
  try {
    assertCan(req.user, action);
    next();
  } catch (e) {
    next(e);
  }
};
