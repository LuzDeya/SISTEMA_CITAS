const dayjs = require('dayjs');
const mongoose = require('mongoose');
const { AppError, MSG } = require('../utils/AppError');
const { assertCan } = require('../policies/permissions');
const {
  appointmentRepository,
  clientRepository,
  employeeRepository,
  serviceRepository,
} = require('../repositories');
const { parseDateTime, parseDay } = require('../utils/time');
const { isWithinSchedule, loadActive } = require('./availabilityService');
const { str } = require('../validators/common');

const EDITABLE = ['programada', 'confirmada'];

/** HU-13: transiciones de estado permitidas */
const TRANSITIONS = {
  programada: ['confirmada', 'cancelada'],
  confirmada: ['completada', 'no_asistio', 'cancelada'],
  completada: [],
  cancelada: [],
  no_asistio: [],
};

async function getOr404(ctx, id) {
  const a = await appointmentRepository.findById(ctx.tenantId, id);
  if (!a) throw new AppError(404, MSG.NOT_FOUND);
  return a;
}

/**
 * Reglas comunes de registro y reprogramación (HU-10 / HU-11):
 * fecha no pasada, empleado y servicio activos, dentro de la jornada y sin cruce con otra cita.
 */
async function validateSlot(ctx, { employeeId, serviceId, startAt, excludeId = null }) {
  const start = parseDateTime(startAt);
  // No se reserva en días anteriores ni en una hora de hoy que ya pasó
  if (start.isBefore(dayjs())) throw new AppError(400, 'No se puede reservar en una fecha u hora pasada');
  const { employee, service } = await loadActive(ctx, employeeId, serviceId);
  if (!isWithinSchedule(employee, start, service.duration)) {
    throw new AppError(400, 'El horario está fuera de la jornada del empleado');
  }
  const end = start.add(service.duration, 'minute');
  const busy = await appointmentRepository.findBusy(
    ctx.tenantId,
    employee._id,
    start.toDate(),
    end.toDate(),
    excludeId
  );
  if (busy.length > 0) throw new AppError(409, 'El empleado ya tiene una cita en ese horario');
  return { employee, service, start: start.toDate(), end: end.toDate() };
}

/** Agrega nombres de cliente, empleado y servicio para mostrar en pantalla */
async function withNames(ctx, appointments) {
  const [clients, employees, services] = await Promise.all([
    clientRepository.find(ctx.tenantId),
    employeeRepository.find(ctx.tenantId),
    serviceRepository.find(ctx.tenantId),
  ]);
  const name = (list) => new Map(list.map((x) => [String(x._id), x.name]));
  const c = name(clients);
  const e = name(employees);
  const s = name(services);
  return appointments.map((a) => ({
    ...a,
    clientName: c.get(String(a.clientId)) || '',
    employeeName: e.get(String(a.employeeId)) || '',
    serviceName: s.get(String(a.serviceId)) || '',
  }));
}

/** HU-10: registrar cita */
async function create(ctx, data = {}) {
  assertCan(ctx.user, 'appointments:create');

  let { clientId } = data;
  if (ctx.user.role === 'cliente') {
    if (!ctx.user.clientId) throw new AppError(400, 'Tu usuario no está vinculado a un cliente');
    clientId = ctx.user.clientId; // E2: el cliente solo reserva para sí mismo
  }
  if (!clientId || !data.employeeId || !data.serviceId || !data.startAt) {
    throw new AppError(400, 'Cliente, servicio, empleado y horario son obligatorios');
  }
  const client = await clientRepository.findById(ctx.tenantId, clientId);
  if (!client) throw new AppError(404, MSG.NOT_FOUND);

  const slot = await validateSlot(ctx, data);
  return appointmentRepository.create(ctx.tenantId, {
    clientId: client._id,
    employeeId: slot.employee._id,
    serviceId: slot.service._id,
    startAt: slot.start,
    endAt: slot.end,
    price: slot.service.price,
    status: 'programada',
    notes: str(data.notes),
    createdBy: ctx.user.id,
  });
}

/** HU-11: modificar / reprogramar (fecha, hora, empleado o servicio) */
async function update(ctx, id, data = {}) {
  assertCan(ctx.user, 'appointments:update');
  const current = await getOr404(ctx, id);
  if (!EDITABLE.includes(current.status)) {
    throw new AppError(400, 'Solo se pueden modificar citas programadas o confirmadas');
  }
  const next = {
    employeeId: data.employeeId || String(current.employeeId),
    serviceId: data.serviceId || String(current.serviceId),
    startAt: data.startAt || current.startAt,
  };
  const slot = await validateSlot(ctx, { ...next, excludeId: current._id });

  const history = [
    ...(current.history || []),
    {
      startAt: current.startAt,
      endAt: current.endAt,
      employeeId: current.employeeId,
      serviceId: current.serviceId,
      changedBy: ctx.user.id,
      changedAt: new Date(),
    },
  ];
  const changes = {
    employeeId: slot.employee._id,
    serviceId: slot.service._id,
    startAt: slot.start,
    endAt: slot.end,
    history,
  };
  if (String(slot.service._id) !== String(current.serviceId)) changes.price = slot.service.price;
  if (data.notes !== undefined) changes.notes = str(data.notes);
  return appointmentRepository.update(ctx.tenantId, id, changes);
}

/** HU-12: cancelar con motivo */
async function cancel(ctx, id, reason) {
  assertCan(ctx.user, 'appointments:cancel');
  const a = await getOr404(ctx, id);
  if (ctx.user.role === 'cliente' && String(a.clientId) !== String(ctx.user.clientId)) {
    throw new AppError(403, MSG.FORBIDDEN);
  }
  if (!str(reason)) throw new AppError(400, 'El motivo es obligatorio');
  if (a.status === 'completada') throw new AppError(400, 'No se puede cancelar una cita completada');
  if (!EDITABLE.includes(a.status)) throw new AppError(400, 'La cita ya no puede cancelarse');
  return appointmentRepository.update(ctx.tenantId, id, {
    status: 'cancelada',
    cancelReason: str(reason),
    cancelledBy: ctx.user.id,
    cancelledAt: new Date(),
  });
}

/** HU-13: cambio de estado */
async function changeStatus(ctx, id, status) {
  assertCan(ctx.user, 'appointments:status');
  const a = await getOr404(ctx, id);
  if (ctx.user.role === 'profesional') {
    const own = await employeeRepository.findOne(ctx.tenantId, { userId: ctx.user.id });
    if (!own || String(own._id) !== String(a.employeeId)) throw new AppError(403, MSG.FORBIDDEN);
  }
  if (!Object.keys(TRANSITIONS).includes(status)) throw new AppError(400, 'Estado no válido');
  if (!TRANSITIONS[a.status].includes(status)) throw new AppError(400, 'Cambio de estado no permitido');
  const changes = { status };
  if (status === 'cancelada') {
    Object.assign(changes, { cancelReason: 'Cancelada desde agenda', cancelledBy: ctx.user.id, cancelledAt: new Date() });
  }
  return appointmentRepository.update(ctx.tenantId, id, changes);
}

/** HU-15: búsqueda y filtros (cliente, empleado, servicio, rango de fechas) */
async function search(ctx, q = {}) {
  assertCan(ctx.user, 'appointments:search');
  const filter = {};
  ['clientId', 'employeeId', 'serviceId'].forEach((k) => {
    if (q[k]) filter[k] = q[k];
  });
  if (q.status) filter.status = q.status;
  const from = q.from ? parseDay(q.from) : null;
  const to = q.to ? parseDay(q.to) : null;
  if (from && to && to.isBefore(from)) {
    throw new AppError(400, 'La fecha final no puede ser anterior a la inicial');
  }
  if (from || to) {
    filter.startAt = {};
    if (from) filter.startAt.$gte = from.toDate();
    if (to) filter.startAt.$lt = to.add(1, 'day').toDate(); // "hasta" incluye todo ese día
  }
  for (const k of ['clientId', 'employeeId', 'serviceId']) {
    if (filter[k] && !mongoose.isValidObjectId(filter[k])) return [];
  }
  const list = await appointmentRepository.find(ctx.tenantId, filter, { startAt: -1 });
  return withNames(ctx, list);
}

/** Citas del propio cliente (rol cliente) */
async function mine(ctx) {
  assertCan(ctx.user, 'appointments:own');
  if (!ctx.user.clientId) return [];
  const list = await appointmentRepository.find(ctx.tenantId, { clientId: ctx.user.clientId }, { startAt: -1 });
  return withNames(ctx, list);
}

async function get(ctx, id) {
  const a = await getOr404(ctx, id);
  if (ctx.user.role === 'cliente' && String(a.clientId) !== String(ctx.user.clientId)) {
    throw new AppError(404, MSG.NOT_FOUND);
  }
  const [withN] = await withNames(ctx, [a]);
  return withN;
}

module.exports = { create, update, cancel, changeStatus, search, mine, get, withNames, TRANSITIONS };
