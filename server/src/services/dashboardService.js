const dayjs = require('dayjs');
const { AppError } = require('../utils/AppError');
const { assertCan } = require('../policies/permissions');
const { appointmentRepository } = require('../repositories');
const { parseDay } = require('../utils/time');
const { withNames } = require('./appointmentService');

function ranking(list, key, label) {
  const map = new Map();
  list.forEach((a) => {
    const id = String(a[key]);
    const item = map.get(id) || { id, name: a[label], total: 0 };
    item.total += 1;
    map.set(id, item);
  });
  return [...map.values()].sort((x, y) => y.total - x.total || x.name.localeCompare(y.name)).slice(0, 5);
}

/** HU-16: indicadores básicos del periodo (por defecto, el mes actual) */
async function getDashboard(ctx, { from, to } = {}) {
  assertCan(ctx.user, 'dashboard:read');
  const start = from ? parseDay(from) : dayjs().startOf('month');
  const endDay = to ? parseDay(to) : dayjs().startOf('month').add(1, 'month').subtract(1, 'day');
  if (endDay.isBefore(start)) throw new AppError(400, 'La fecha final no puede ser anterior a la inicial');

  const all = await appointmentRepository.find(
    ctx.tenantId,
    { startAt: { $gte: start.toDate(), $lt: endDay.add(1, 'day').toDate() } },
    { startAt: 1 }
  );
  const active = all.filter((a) => a.status !== 'cancelada');
  const named = await withNames(ctx, active);
  const count = (st) => all.filter((a) => a.status === st).length;

  return {
    from: start.format('YYYY-MM-DD'),
    to: endDay.format('YYYY-MM-DD'),
    totalProgramadas: active.length,
    totalCanceladas: count('cancelada'),
    totalCompletadas: count('completada'),
    totalNoAsistio: count('no_asistio'),
    serviciosMasSolicitados: ranking(named, 'serviceId', 'serviceName'),
    clientesFrecuentes: ranking(named, 'clientId', 'clientName'),
  };
}

module.exports = { getDashboard };
