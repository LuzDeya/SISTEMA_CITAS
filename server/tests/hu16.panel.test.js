const {
  api, bearer, useDatabase, centro, createClient, createService, createAppointment, at, day,
} = require('./helpers');

describe('HU-16 Panel de control con indicadores', () => {
  useDatabase();
  let b;
  let presion;
  let juan;
  const panel = (token) => api().get(`/api/dashboard?from=${day(1)}&to=${day(7)}`).set(bearer(token));
  const book = (clientId, serviceId, startAt) =>
    createAppointment(b.recep.token, { clientId, employeeId: b.carlos._id, serviceId, startAt });
  beforeEach(async () => {
    b = await centro();
    presion = await createService(b.admin.token, 'Toma de presión arterial', 30, 15);
    await api().put(`/api/employees/${b.carlos._id}`).set(bearer(b.admin.token)).send({ services: [b.consulta._id, presion._id] });
    juan = await createClient(b.recep.token, 'Juan Pérez', '70000001');
  });

  test('PA-HU16-E1: total de citas, servicios más solicitados y clientes frecuentes', async () => {
    await book(b.maria._id, b.consulta._id, at(1, '09:00'));
    await book(b.maria._id, b.consulta._id, at(2, '09:00'));
    await book(b.maria._id, presion._id, at(3, '09:00'));
    await book(juan._id, b.consulta._id, at(1, '10:00'));
    await book(juan._id, presion._id, at(2, '10:00'));
    const res = await panel(b.admin.token);
    expect(res.status).toBe(200);
    expect(res.body.totalProgramadas).toBe(5);
    expect(res.body.serviciosMasSolicitados[0]).toEqual(expect.objectContaining({ name: 'Consulta general', total: 3 }));
    expect(res.body.clientesFrecuentes[0]).toEqual(expect.objectContaining({ name: 'María Quispe', total: 3 }));
  });

  test('PA-HU16-E2: las citas canceladas no cuentan como programadas', async () => {
    const c1 = await book(b.maria._id, b.consulta._id, at(1, '09:00'));
    await book(b.maria._id, b.consulta._id, at(2, '09:00'));
    await book(b.maria._id, presion._id, at(3, '09:00'));
    await book(juan._id, b.consulta._id, at(1, '10:00'));
    await book(juan._id, presion._id, at(2, '10:00'));
    await api().patch(`/api/appointments/${c1._id}/cancel`).set(bearer(b.recep.token)).send({ reason: 'Viaje' });
    const res = await panel(b.admin.token);
    expect(res.status).toBe(200);
    expect(res.body.totalProgramadas).toBe(4);
    expect(res.body.totalCanceladas).toBe(1);
  });

  test('PA-HU16-E3: la recepcionista no puede ver el panel (403)', async () => {
    const res = await panel(b.recep.token);
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('No tienes permisos para realizar esta acción');
  });

  test('PA-HU16-E4: negocio sin citas muestra indicadores en 0', async () => {
    const res = await panel(b.admin.token);
    expect(res.status).toBe(200);
    expect(res.body.totalProgramadas).toBe(0);
    expect(res.body.totalCanceladas).toBe(0);
    expect(res.body.serviciosMasSolicitados).toEqual([]);
    expect(res.body.clientesFrecuentes).toEqual([]);
  });
});
