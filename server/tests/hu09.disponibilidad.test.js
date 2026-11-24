const dayjs = require('dayjs');
const {
  api, bearer, useDatabase, centro, createEmployee, createService, createAppointment, allDays, at, day,
} = require('./helpers');

describe('HU-09 Consultar disponibilidad', () => {
  useDatabase();
  let b;
  const query = (token, employeeId, serviceId, date) =>
    api().get(`/api/availability?employeeId=${employeeId}&serviceId=${serviceId}&date=${date}`).set(bearer(token));
  beforeEach(async () => {
    b = await centro();
  });

  test('PA-HU09-E1: horarios libres excluyendo la cita de las 10:00', async () => {
    const carlos = await createEmployee(b.admin.token, 'Carlos 9-12', [b.consulta._id], allDays('09:00', '12:00'));
    await createAppointment(b.recep.token, {
      clientId: b.maria._id, employeeId: carlos._id, serviceId: b.consulta._id, startAt: at(1, '10:00'),
    });
    const res = await query(b.recep.token, carlos._id, b.consulta._id, day(1));
    expect(res.status).toBe(200);
    expect(res.body.slots).toEqual(['09:00', '09:30', '10:30', '11:00', '11:30']);
  });

  test('PA-HU09-E2: día sin citas con un servicio de 60 minutos', async () => {
    const largo = await createService(b.admin.token, 'Chequeo preventivo', 60, 35);
    const carlos = await createEmployee(b.admin.token, 'Carlos 9-11', [largo._id], allDays('09:00', '11:00'));
    const res = await query(b.recep.token, carlos._id, largo._id, day(1));
    expect(res.status).toBe(200);
    expect(res.body.slots).toEqual(['09:00', '09:30', '10:00']);
  });

  test('PA-HU09-E3: fecha pasada responde 400', async () => {
    const res = await query(b.recep.token, b.carlos._id, b.consulta._id, day(-1));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('No se puede consultar una fecha pasada');
  });

  test('PA-HU09-E4: día que el empleado no trabaja devuelve lista vacía', async () => {
    const manana = dayjs().add(1, 'day').day();
    const schedule = allDays('09:00', '13:00').filter((s) => s.day !== manana);
    const carlos = await createEmployee(b.admin.token, 'Carlos descansa', [b.consulta._id], schedule);
    const res = await query(b.recep.token, carlos._id, b.consulta._id, day(1));
    expect(res.status).toBe(200);
    expect(res.body.slots).toEqual([]);
  });
});
