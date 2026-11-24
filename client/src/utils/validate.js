import validator from 'validator';

// Validaciones en el cliente (las mismas reglas que valida el servidor (server))
export const isDni = (v) => /^\d{8}$/.test(v || '');
export const isPhone = (v) => /^\d{9}$/.test(v || '');
export const isEmail = (v) => validator.isEmail(v || '');
export const isStrongPassword = (p = '') => p.length >= 8 && /[A-Z]/.test(p) && /\d/.test(p);
export const PASSWORD_MSG = 'La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número';
