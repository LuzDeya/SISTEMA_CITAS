const { api, bearer, useDatabase, centro, createAppointment, at } = require('./helpers');

describe('HU-05 Gestión de clientes (CRUD)', () => {
  useDatabase();
  let b;
  beforeEach(async () => {
    b = await centro(); // ya existe "María Quispe" con DNI 71234567
  });

  test('PA-HU05-E1: registro de un cliente nuevo', async () => {
    const res = await api()
      .post('/api/clients')
      .set(bearer(b.recep.token))
      .send({ name: 'Juan Pérez', dni: '70000001', phone: '964123456', email: 'juan@mail.com' });
    expect(res.status).toBe(201);
    const list = await api().get('/api/clients').set(bearer(b.recep.token));
    expect(list.body.map((c) => c.name)).toContain('Juan Pérez');
  });

  test('PA-HU05-E2: actualización del teléfono', async () => {
    const res = await api().put(`/api/clients/${b.maria._id}`).set(bearer(b.recep.token)).send({ phone: '987654321' });
    expect(res.status).toBe(200);
    expect(res.body.phone).toBe('987654321');
  });

  test('PA-HU05-E3: DNI duplicado en el mismo negocio responde 409', async () => {
    const res = await api()
      .post('/api/clients')
      .set(bearer(b.recep.token))
      .send({ name: 'Otra Persona', dni: '71234567', phone: '964123456' });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Ya existe un cliente con este DNI');
  });

  test('PA-HU05-E4: no se elimina un cliente con citas pendientes', async () => {
    await createAppointment(b.recep.token, {
      clientId: b.maria._id, employeeId: b.carlos._id, serviceId: b.consulta._id, startAt: at(1, '09:00'),
    });
    const res = await api().delete(`/api/clients/${b.maria._id}`).set(bearer(b.recep.token));
    expect(res.status).toBe(409);
    expect(res.body.message).toBe('No se puede eliminar: el cliente tiene citas pendientes');
  });
});
