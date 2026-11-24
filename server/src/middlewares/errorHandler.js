const { AppError, MSG } = require('../utils/AppError');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) return res.status(err.status).json({ message: err.message });
  if (err && err.name === 'CastError') return res.status(404).json({ message: MSG.NOT_FOUND });
  if (err && err.code === 11000) return res.status(409).json({ message: 'El registro ya existe' });
  if (err && err.name === 'ValidationError') return res.status(400).json({ message: 'Datos no válidos' });
  if (err && err.type === 'entity.parse.failed') return res.status(400).json({ message: 'JSON no válido' });
  if (process.env.NODE_ENV !== 'test') console.error(err); // eslint-disable-line no-console
  return res.status(500).json({ message: 'Error interno del servidor' });
}

function notFound(req, res) {
  res.status(404).json({ message: 'Ruta no encontrada' });
}

module.exports = { errorHandler, notFound };
