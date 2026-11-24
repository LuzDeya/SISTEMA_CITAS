const dayjs = require('dayjs');
const { AppError } = require('./AppError');

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const YMD = /^\d{4}-\d{2}-\d{2}$/;

/** "09:30" -> 570 */
function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** Minutos transcurridos desde la medianoche (hora local) */
function minutesOfDay(date) {
  const d = dayjs(date);
  return d.hour() * 60 + d.minute();
}

/** Valida "YYYY-MM-DD" y devuelve dayjs al inicio del día (hora local) */
function parseDay(value, message = 'Fecha no válida') {
  if (typeof value !== 'string' || !YMD.test(value)) throw new AppError(400, message);
  const d = dayjs(value);
  if (!d.isValid() || d.format('YYYY-MM-DD') !== value) throw new AppError(400, message);
  return d.startOf('day');
}

/** Valida una fecha-hora ISO y devuelve dayjs */
function parseDateTime(value, message = 'Fecha y hora no válidas') {
  const d = dayjs(value);
  if (!value || !d.isValid()) throw new AppError(400, message);
  return d;
}

/** Dos intervalos [aStart, aEnd) y [bStart, bEnd) se cruzan */
function overlaps(aStart, aEnd, bStart, bEnd) {
  return new Date(aStart) < new Date(bEnd) && new Date(aEnd) > new Date(bStart);
}

module.exports = { HHMM, toMinutes, minutesOfDay, parseDay, parseDateTime, overlaps };
