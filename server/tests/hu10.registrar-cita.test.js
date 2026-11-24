const { api, bearer, useDatabase, centro, createUser, createAppointment, at, hhmm } = require('./helpers');

describe('HU-10 Registrar cita', () => {
  useDatabase();
  let b;
  const book = (token, startAt, extra = {}) =>
    api()
      .post('/api/appointments')
      .set(bearer(token))
      .send({ clientId: b.maria._id, employeeId: b.carlos._id, serviceId: b.consulta._id, startAt, ...extra });
  beforeEach(async () => {
    b = await centro(); // Carlos trabaja 09:00–13:00, Consulta general 30 min S/ 25
  });

  test('PA-HU10-E1: registro exitoso con estado programada, fin 09:30 y costo 25', async () => {
    const res = await book(b.recep.token, at(1, '09:00'));
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('programada');
    expect(hhmm(res.body.endAt)).toBe('09:30');
    expect(res.body.price).toBe(25);
  });

  test('PA-HU10-E2: el usuario cliente reserva y la cita se asigna a su ficha', async () => {
    const cliente = await createUser(b.admin.token, {
      name: 'María Quispe', email: 'maria@mail.com', role: 'cliente', clientId: b.maria._id,
    });
    const res = await api()
      .post('/api/appointments')
      .set(bearer(cliente.token))
      .send({ employeeId: b.carlos._id, serviceId: b.consulta._id, startAt: at(1, '11:00') });
    expect(res.status).toBe(201);
    expect(String(res.body.clientId)).toBe(String(b.maria._id));
  });

  test('PA-HU10-E3: reserva duplicada del mismo empleado y horario responde 409', async () => {
    await createAppointment(b.recep.token, {
      clientId: b.maria._id, employeeId: b.carlos._id, serviceId: b.consulta._id, startAt: at(1, '09:00'),
    });
    const res = await book(b.recep.token, at(1, '09:15'));
    expect(res.status).toBe(409);
    expect(res.body.message).toBe('El empleado ya tiene una cita en ese horario');
  });

  test('PA-HU10-E4: horario fuera de la jornada responde 400', async () => {
    const res = await book(b.recep.token, at(1, '12:45'));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('El horario está fuera de la jornada del empleado');
  });
});
