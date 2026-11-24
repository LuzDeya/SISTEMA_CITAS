const {
  api, bearer, useDatabase, centro, createUser, createEmployee, createAppointment, setStatus, at,
} = require('./helpers');

describe('HU-13 Cambiar estado de la cita', () => {
  useDatabase();
  let b;
  let carlosUser;
  let cita;
  const status = (token, id, value) =>
    api().patch(`/api/appointments/${id}/status`).set(bearer(token)).send({ status: value });
  beforeEach(async () => {
    b = await centro();
    carlosUser = await createUser(b.admin.token, { name: 'Carlos Ramírez', email: 'carlos@saludandina.pe', role: 'profesional' });
    await api().put(`/api/employees/${b.carlos._id}`).set(bearer(b.admin.token)).send({ userId: carlosUser.id });
    cita = await createAppointment(b.recep.token, {
      clientId: b.maria._id, employeeId: b.carlos._id, serviceId: b.consulta._id, startAt: at(1, '09:00'),
    });
  });

  test('PA-HU13-E1: el profesional marca como completada una cita confirmada', async () => {
    await setStatus(carlosUser.token, cita._id, 'confirmada');
    const res = await status(carlosUser.token, cita._id, 'completada');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('completada');
  });

  test('PA-HU13-E2: el profesional confirma una cita programada', async () => {
    const res = await status(carlosUser.token, cita._id, 'confirmada');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('confirmada');
  });

  test('PA-HU13-E3: de completada a programada no está permitido', async () => {
    await setStatus(carlosUser.token, cita._id, 'confirmada');
    await setStatus(carlosUser.token, cita._id, 'completada');
    const res = await status(carlosUser.token, cita._id, 'programada');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Cambio de estado no permitido');
  });

  test('PA-HU13-E4: un profesional no puede cambiar la cita de otro profesional', async () => {
    const jorge = await createEmployee(b.admin.token, 'Jorge Soto', [b.consulta._id]);
    const deJorge = await createAppointment(b.recep.token, {
      clientId: b.maria._id, employeeId: jorge._id, serviceId: b.consulta._id, startAt: at(1, '10:00'),
    });
    const res = await status(carlosUser.token, deJorge._id, 'completada');
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('No tienes permisos para realizar esta acción');
  });
});
