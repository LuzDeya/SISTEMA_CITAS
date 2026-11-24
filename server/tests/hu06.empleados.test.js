const { api, bearer, useDatabase, centro, createService, at } = require('./helpers');

describe('HU-06 Gestión de empleados', () => {
  useDatabase();
  let b;
  beforeEach(async () => {
    b = await centro();
  });

  test('PA-HU06-E1: registro de un empleado activo con su servicio', async () => {
    const res = await api()
      .post('/api/employees')
      .set(bearer(b.admin.token))
      .send({ name: 'Jorge Soto', services: [b.consulta._id] });
    expect(res.status).toBe(201);
    expect(res.body.active).toBe(true);
    expect(res.body.services.map(String)).toEqual([String(b.consulta._id)]);
  });

  test('PA-HU06-E2: agregar un segundo servicio al empleado', async () => {
    const presion = await createService(b.admin.token, 'Toma de presión arterial', 30, 15);
    const res = await api()
      .put(`/api/employees/${b.carlos._id}`)
      .set(bearer(b.admin.token))
      .send({ services: [b.consulta._id, presion._id] });
    expect(res.status).toBe(200);
    expect(res.body.services).toHaveLength(2);
  });

  test('PA-HU06-E3: empleado sin servicios responde 400', async () => {
    const res = await api().post('/api/employees').set(bearer(b.admin.token)).send({ name: 'Sin Servicios', services: [] });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Debe asignar al menos un servicio');
  });

  test('PA-HU06-E4: un empleado desactivado no recibe citas', async () => {
    await api().put(`/api/employees/${b.carlos._id}`).set(bearer(b.admin.token)).send({ active: false });
    const res = await api()
      .post('/api/appointments')
      .set(bearer(b.recep.token))
      .send({ clientId: b.maria._id, employeeId: b.carlos._id, serviceId: b.consulta._id, startAt: at(1, '09:00') });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('El empleado no está activo');
  });
});
