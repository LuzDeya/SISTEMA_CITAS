const validator = require('validator');
const mongoose = require('mongoose');
const { AppError, MSG } = require('../utils/AppError');

const PASSWORD_MSG = 'La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número';

function str(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function required(values, message = 'Todos los campos son obligatorios') {
  if (values.some((v) => !str(v))) throw new AppError(400, message);
}

function email(value) {
  if (!validator.isEmail(str(value))) throw new AppError(400, 'Correo no válido');
}

function password(value) {
  const p = typeof value === 'string' ? value : '';
  if (p.length < 8 || !/[A-Z]/.test(p) || !/\d/.test(p)) throw new AppError(400, PASSWORD_MSG);
}

function objectId(value, status = 404, message = MSG.NOT_FOUND) {
  if (!mongoose.isValidObjectId(value)) throw new AppError(status, message);
}

module.exports = { str, required, email, password, objectId, PASSWORD_MSG };
