const dayjs = require('dayjs');
const { AppError } = require('../utils/AppError');
const { assertCan } = require('../policies/permissions');
const { appointmentRepository, employeeRepository } = require('../repositories');
const { parseDay } = require('../utils/time');
const { withNames } = require('./appointmentService');

const VIEWS = ['day', 'week', 'month'];
const COLORS = {
  programada: '#16697a',
  confirmada: '#e9a23b',
  completada: '#3a7d44',
  cancelada: '#a8a29e',
  no_asistio: '#c2410c',
};

/** Rango [inicio, fin) de la vista; la semana empieza el lunes */
function rangeFor(view, day) {
  if (view === 'day') return [day, day.add(1, 'day')];
  if (view === 'week') {
    const start = day.subtract((day.day() + 6) % 7, 'day');
    return [start, start.add(7, 'day')];
  }
  const start = day.startOf('month');
  return [start, start.add(1, 'month')];
}

/** HU-14: agenda en formato de eventos para FullCalendar */
async function getCalendar(ctx, { view = 'week', date, employeeId } = {}) {
  assertCan(ctx.user, 'appointments:calendar');
  if (!VIEWS.includes(view)) throw new AppError(400, 'Vista no válida: use day, week o month');
  const day = date ? parseDay(date) : dayjs().startOf('day');
  const [start, end] = rangeFor(view, day);

  const filter = { startAt: { $gte: start.toDate(), $lt: end.toDate() } };
  if (ctx.user.role === 'profesional') {
    const own = await employeeRepository.findOne(ctx.tenantId, { userId: ctx.user.id });
    if (!own) return { view, start: start.toDate(), end: end.toDate(), events: [] };
    filter.employeeId = own._id; // E4: el profesional solo ve su agenda
  } else if (employeeId) {
    filter.employeeId = employeeId;
  }

  const list = await withNames(ctx, await appointmentRepository.find(ctx.tenantId, filter, { startAt: 1 }));
  const events = list.map((a) => ({
    id: String(a._id),
    title: `${a.clientName} – ${a.serviceName}`,
    start: a.startAt,
    end: a.endAt,
    status: a.status,
    employeeId: String(a.employeeId),
    employeeName: a.employeeName,
    clientName: a.clientName,
    serviceName: a.serviceName,
    color: COLORS[a.status],
  }));
  return { view, start: start.toDate(), end: end.toDate(), events };
}

module.exports = { getCalendar, rangeFor, VIEWS };
