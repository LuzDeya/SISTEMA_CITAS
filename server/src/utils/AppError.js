/** Error de negocio con código HTTP. El errorHandler lo convierte en { message }. */
class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const MSG = {
  UNAUTHENTICATED: 'No autenticado',
  FORBIDDEN: 'No tienes permisos para realizar esta acción',
  NOT_FOUND: 'Recurso no encontrado',
};

module.exports = { AppError, MSG };
