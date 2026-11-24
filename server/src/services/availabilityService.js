const dayjs = require('dayjs');
const { AppError, MSG } = require('../utils/AppError');
const { assertCan } = require('../policies/permissions');
const { employeeRepository, serviceRepository, appointmentRepository } = require('../repositories');
const { toMinutes, minutesOfDay, parseDay, overlaps } = require('../utils/time');

const SLOT_STEP = 30; // minutos entre bloques

/** El intervalo [start, start+duration) está completo dentro de un turno de la jornada */
function isWithinSchedule(employee, start, durationMin) {
  const s = dayjs(start);
  const startMin = minutesOfDay(s);
  const endMin = startMin + durationMin;
  return (employee.schedule || []).some(
    (sh) => sh.day === s.day() && startMin >= toMinutes(sh.start) && endMin <= toMinutes(sh.end)
  );
}

async function loadActive(ctx, employeeId, serviceId) {
  const employee = await employeeRepository.findById(ctx.tenantId, employeeId);
  if (!employee) throw new AppError(404, MSG.NOT_FOUND);
  if (!employee.active) throw new AppError(400, 'El empleado no está activo');
  const service = await serviceRepository.findById(ctx.tenantId, serviceId);
  if (!service) throw new AppError(404, MSG.NOT_FOUND);
  if (!service.active) throw new AppError(400, 'El servicio no está activo');
  if (!(employee.services || []).map(String).includes(String(service._id))) {
    throw new AppError(400, 'El empleado no atiende este servicio');
  }
  return { employee, service };
}

/** HU-09: horarios libres de un empleado para un servicio en una fecha */
async function getAvailability(ctx, { employeeId, serviceId, date } = {}) {
  assertCan(ctx.user, 'availability:read');
  const day = parseDay(date);
  if (day.isBefore(dayjs().startOf('day'))) {
    throw new AppError(400, 'No se puede consultar una fecha pasada');
  }
  const { employee, service } = await loadActive(ctx, employeeId, serviceId);

  const shifts = (employee.schedule || []).filter((s) => s.day === day.day());
  if (shifts.length === 0) return { date, slots: [] };

  const busy = await appointmentRepository.findBusy(
    ctx.tenantId,
    employee._id,
    day.toDate(),
    day.add(1, 'day').toDate()
  );
  const now = dayjs();
  const slots = [];
  shifts
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
    .forEach((shift) => {
      const end = toMinutes(shift.end);
      for (let t = toMinutes(shift.start); t + service.duration <= end; t += SLOT_STEP) {
        const slotStart = day.add(t, 'minute');
        const slotEnd = slotStart.add(service.duration, 'minute');
        if (slotStart.isBefore(now)) continue; // eslint-disable-line no-continue
        const taken = busy.some((a) => overlaps(slotStart.toDate(), slotEnd.toDate(), a.startAt, a.endAt));
        if (!taken) slots.push(slotStart.format('HH:mm'));
      }
    });
  return { date, slots };
}

module.exports = { getAvailability, isWithinSchedule, loadActive, SLOT_STEP };
