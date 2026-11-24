const validator = require('validator');
const { AppError } = require('../utils/AppError');
const { str } = require('./common');

/** partial = true en actualizaciones: solo valida los campos enviados */
function validateClient(data, partial = false) {
  const out = {};
  const has = (k) => !partial || data[k] !== undefined;

  if (has('name')) {
    if (!str(data.name)) throw new AppError(400, 'El nombre es obligatorio');
    out.name = str(data.name);
  }
  if (has('dni')) {
    if (!/^\d{8}$/.test(str(data.dni))) throw new AppError(400, 'El DNI debe tener 8 dígitos');
    out.dni = str(data.dni);
  }
  if (has('phone')) {
    if (!/^\d{9}$/.test(str(data.phone))) throw new AppError(400, 'El teléfono debe tener 9 dígitos');
    out.phone = str(data.phone);
  }
  if (data.email !== undefined && str(data.email) !== '') {
    if (!validator.isEmail(str(data.email))) throw new AppError(400, 'Correo no válido');
    out.email = str(data.email).toLowerCase();
  } else if (data.email !== undefined) {
    out.email = '';
  }
  return out;
}

module.exports = { validateClient };
