const { api, bearer, useDatabase, centro, createEmployee, createAppointment, at, day, hhmm } = require('./helpers');

describe('HU-11 Modificar o reprogramar cita', () => {
  useDatabase();
  let b;
  let cita;
  beforeEach(async () => {
    b = await centro();
    cita = await createAppointment(b.recep.token, {
      clientId: b.maria._id, employeeId: b.carlos._id, serviceId: b.consulta._id, startAt: at(1, '09:00'),
    });
  });

  test('PA-HU11-E1: reprogramación a las 11:00 y el horario de las 09:00 queda libre', async () => {
    const res = await api().put(`/api/appointments/${cita._id}`).set(bearer(b.recep.token)).send({ startAt: at(1, '11:00') });
    expect(res.status).toBe(200);
    expect(hhmm(res.body.startAt)).toBe('11:00');
    expect(res.body.history).toHaveLength(1);
    const disp = await api()
      .get(`/api/availability?employeeId=${b.carlos._id}&serviceId=${b.consulta._id}&date=${day(1)}`)
      .set(bearer(b.recep.token));
    expect(disp.body.slots).toContain('09:00');
    expect(disp.body.slots).not.toContain('11:00');
  });

  test('PA-HU11-E2: cambio de empleado a Jorge a la misma hora', async () => {
    const jorge = await createEmployee(b.admin.token, 'Jorge Soto', [b.consulta._id]);
    const res = await api().put(`/api/appointments/${cita._id}`).set(bearer(b.recep.token)).send({ employeeId: jorge._id });
    expect(res.status).toBe(200);
    expect(String(res.body.employeeId)).toBe(String(jorge._id));
    expect(hhmm(res.body.startAt)).toBe('09:00');
  });

  test('PA-HU11-E3: nuevo horario ocupado responde 409 y la cita no cambia', async () => {
    await createAppointment(b.recep.token, {
      clientId: b.maria._id, employeeId: b.carlos._id, serviceId: b.consulta._id, startAt: at(1, '11:00'),
    });
    const res = await api().put(`/api/appointments/${cita._id}`).set(bearer(b.recep.token)).send({ startAt: at(1, '11:00') });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe('El empleado ya tiene una cita en ese horario');
    const actual = await api().get(`/api/appointments/${cita._id}`).set(bearer(b.recep.token));
    expect(hhmm(actual.body.startAt)).toBe('09:00');
  });

  test('PA-HU11-E4: una cita cancelada no se puede reprogramar', async () => {
    await api().patch(`/api/appointments/${cita._id}/cancel`).set(bearer(b.recep.token)).send({ reason: 'Viaje' });
    const res = await api().put(`/api/appointments/${cita._id}`).set(bearer(b.recep.token)).send({ startAt: at(1, '11:00') });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Solo se pueden modificar citas programadas o confirmadas');
  });
});
