const {
  api, bearer, useDatabase, centro, createUser, createClient, createAppointment, setStatus, at, day,
} = require('./helpers');

describe('HU-12 Cancelar cita', () => {
  useDatabase();
  let b;
  let cita;
  const cancel = (token, id, reason = 'Viaje imprevisto') =>
    api().patch(`/api/appointments/${id}/cancel`).set(bearer(token)).send({ reason });
  beforeEach(async () => {
    b = await centro();
    cita = await createAppointment(b.recep.token, {
      clientId: b.maria._id, employeeId: b.carlos._id, serviceId: b.consulta._id, startAt: at(1, '09:00'),
    });
  });

  test('PA-HU12-E1: cancelación con motivo y el horario vuelve a estar libre', async () => {
    const res = await cancel(b.recep.token, cita._id);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelada');
    expect(res.body.cancelReason).toBe('Viaje imprevisto');
    const disp = await api()
      .get(`/api/availability?employeeId=${b.carlos._id}&serviceId=${b.consulta._id}&date=${day(1)}`)
      .set(bearer(b.recep.token));
    expect(disp.body.slots).toContain('09:00');
  });

  test('PA-HU12-E2: el cliente cancela su propia cita', async () => {
    const cliente = await createUser(b.admin.token, {
      name: 'María Quispe', email: 'maria@mail.com', role: 'cliente', clientId: b.maria._id,
    });
    const res = await cancel(cliente.token, cita._id, 'No podré asistir');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelada');
  });

  test('PA-HU12-E3: no se puede cancelar una cita completada', async () => {
    await setStatus(b.admin.token, cita._id, 'confirmada');
    await setStatus(b.admin.token, cita._id, 'completada');
    const res = await cancel(b.recep.token, cita._id);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('No se puede cancelar una cita completada');
  });

  test('PA-HU12-E4: un cliente no puede cancelar una cita ajena (403)', async () => {
    const juan = await createClient(b.recep.token, 'Juan Pérez', '70000001');
    const otro = await createUser(b.admin.token, {
      name: 'Juan Pérez', email: 'juan@mail.com', role: 'cliente', clientId: juan._id,
    });
    const res = await cancel(otro.token, cita._id);
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('No tienes permisos para realizar esta acción');
  });
});
