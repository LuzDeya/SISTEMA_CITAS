const { AppError } = require('../utils/AppError');
const { str } = require('./common');

const PRICE_DURATION_MSG = 'El costo y la duración deben ser mayores a 0';

function validateService(data, partial = false) {
  const out = {};
  const has = (k) => !partial || data[k] !== undefined;

  if (has('name')) {
    if (!str(data.name)) throw new AppError(400, 'El nombre es obligatorio');
    out.name = str(data.name);
  }
  if (has('duration')) {
    const d = Number(data.duration);
    if (!Number.isFinite(d) || d <= 0) throw new AppError(400, PRICE_DURATION_MSG);
    out.duration = Math.round(d);
  }
  if (has('price')) {
    const p = Number(data.price);
    if (!Number.isFinite(p) || p <= 0) throw new AppError(400, PRICE_DURATION_MSG);
    out.price = Math.round(p * 100) / 100;
  }
  if (data.active !== undefined) out.active = Boolean(data.active);
  return out;
}

module.exports = { validateService, PRICE_DURATION_MSG };
