const { api, bearer, useDatabase, centro, createService, at } = require('./helpers');

describe('HU-08 Gestión de servicios', () => {
  useDatabase();
  let b;
  beforeEach(async () => {
    b = await centro(); // ya existe "Consulta general"
  });

  test('PA-HU08-E1: registro de un servicio activo', async () => {
    const res = await api()
      .post('/api/services')
      .set(bearer(b.admin.token))
      .send({ name: 'Toma de presión arterial', duration: 30, price: 15 });
    expect(res.status).toBe(201);
    expect(res.body.active).toBe(true);
    expect(res.body.duration).toBe(30);
    expect(res.body.price).toBe(15);
  });

  test('PA-HU08-E2: búsqueda de servicios por nombre', async () => {
    await createService(b.admin.token, 'Consulta pediátrica', 40, 30);
    await createService(b.admin.token, 'Toma de presión arterial', 30, 15);
    const res = await api().get('/api/services?search=consulta').set(bearer(b.recep.token));
    expect(res.status).toBe(200);
    expect(res.body.map((s) => s.name).sort()).toEqual(['Consulta general', 'Consulta pediátrica']);
  });

  test('PA-HU08-E3: costo o duración inválidos responden 400', async () => {
    const costo = await api().post('/api/services').set(bearer(b.admin.token)).send({ name: 'Malo', duration: 30, price: -15 });
    expect(costo.status).toBe(400);
    expect(costo.body.message).toBe('El costo y la duración deben ser mayores a 0');
    const duracion = await api().post('/api/services').set(bearer(b.admin.token)).send({ name: 'Malo', duration: 0, price: 15 });
    expect(duracion.status).toBe(400);
    expect(duracion.body.message).toBe('El costo y la duración deben ser mayores a 0');
  });

  test('PA-HU08-E4: un servicio desactivado no admite nuevas citas', async () => {
    await api().put(`/api/services/${b.consulta._id}`).set(bearer(b.admin.token)).send({ active: false });
    const res = await api()
      .post('/api/appointments')
      .set(bearer(b.recep.token))
      .send({ clientId: b.maria._id, employeeId: b.carlos._id, serviceId: b.consulta._id, startAt: at(1, '09:00') });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('El servicio no está activo');
  });
});
