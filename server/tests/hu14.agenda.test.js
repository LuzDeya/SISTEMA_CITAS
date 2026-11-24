const {
  api, bearer, useDatabase, centro, createUser, createEmployee, createAppointment, at, day,
} = require('./helpers');

describe('HU-14 Agenda en calendario (día, semana, mes)', () => {
  useDatabase();
  let b;
  const book = (employeeId, startAt) =>
    createAppointment(b.recep.token, { clientId: b.maria._id, employeeId, serviceId: b.consulta._id, startAt });
  const calendar = (token, view, date) =>
    api().get(`/api/appointments/calendar?view=${view}&date=${date}`).set(bearer(token));
  beforeEach(async () => {
    b = await centro();
  });

  test('PA-HU14-E1: agenda del día con datos para FullCalendar', async () => {
    await book(b.carlos._id, at(1, '09:00'));
    await book(b.carlos._id, at(1, '10:00'));
    await book(b.carlos._id, at(1, '11:00'));
    await book(b.carlos._id, at(2, '09:00'));
    const res = await calendar(b.recep.token, 'day', day(1));
    expect(res.status).toBe(200);
    expect(res.body.events).toHaveLength(3);
    const ev = res.body.events[0];
    ['id', 'title', 'start', 'end', 'status', 'employeeName', 'clientName', 'serviceName', 'color'].forEach((k) =>
      expect(ev[k]).toBeDefined());
    expect(ev.title).toBe('María Quispe – Consulta general');
  });

  test('PA-HU14-E2: agenda semanal y mensual solo con citas de ese rango', async () => {
    await book(b.carlos._id, at(1, '09:00'));
    await book(b.carlos._id, at(40, '09:00')); // fuera de la semana y del mes de mañana
    const week = await calendar(b.recep.token, 'week', day(1));
    expect(week.status).toBe(200);
    expect(week.body.events).toHaveLength(1);
    const month = await calendar(b.recep.token, 'month', day(1));
    expect(month.status).toBe(200);
    expect(month.body.events).toHaveLength(1);
  });

  test('PA-HU14-E3: vista no válida responde 400', async () => {
    const res = await calendar(b.recep.token, 'year', day(1));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Vista no válida: use day, week o month');
  });

  test('PA-HU14-E4: el profesional solo ve su propia agenda', async () => {
    const carlosUser = await createUser(b.admin.token, { name: 'Carlos', email: 'carlos@saludandina.pe', role: 'profesional' });
    await api().put(`/api/employees/${b.carlos._id}`).set(bearer(b.admin.token)).send({ userId: carlosUser.id });
    const jorge = await createEmployee(b.admin.token, 'Jorge Soto', [b.consulta._id]);
    await book(b.carlos._id, at(1, '09:00'));
    await book(b.carlos._id, at(1, '10:00'));
    await book(jorge._id, at(1, '09:00'));
    const res = await calendar(carlosUser.token, 'day', day(1));
    expect(res.status).toBe(200);
    expect(res.body.events).toHaveLength(2);
    res.body.events.forEach((e) => expect(e.employeeId).toBe(String(b.carlos._id)));
  });
});
