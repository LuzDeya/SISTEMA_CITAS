const { AppError } = require('../utils/AppError');
const { HHMM, toMinutes } = require('../utils/time');

/** Valida la jornada semanal: [{ day: 0-6, start: "HH:mm", end: "HH:mm" }] */
function validateSchedule(schedule) {
  if (!Array.isArray(schedule)) throw new AppError(400, 'La jornada debe ser una lista de turnos');

  const shifts = schedule.map((s) => {
    const day = Number(s && s.day);
    if (!Number.isInteger(day) || day < 0 || day > 6) throw new AppError(400, 'Día no válido');
    if (!HHMM.test(s.start) || !HHMM.test(s.end)) throw new AppError(400, 'Formato de hora no válido (HH:mm)');
    if (toMinutes(s.end) <= toMinutes(s.start)) {
      throw new AppError(400, 'La hora de fin debe ser posterior a la hora de inicio');
    }
    return { day, start: s.start, end: s.end };
  });

  for (let d = 0; d <= 6; d += 1) {
    const ofDay = shifts.filter((s) => s.day === d).sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
    for (let i = 1; i < ofDay.length; i += 1) {
      if (toMinutes(ofDay[i].start) < toMinutes(ofDay[i - 1].end)) {
        throw new AppError(400, 'Los turnos no pueden cruzarse');
      }
    }
  }
  return shifts.sort((a, b) => a.day - b.day || toMinutes(a.start) - toMinutes(b.start));
}

module.exports = { validateSchedule };
