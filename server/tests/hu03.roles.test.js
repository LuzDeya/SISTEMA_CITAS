const { api, bearer, useDatabase, registerBusiness, createUser, createService } = require('./helpers');

describe('HU-03 Usuarios y roles (RBAC)', () => {
  useDatabase();
  let admin;
  beforeEach(async () => {
    admin = await registerBusiness();
  });

  test('PA-HU03-E1: el administrador crea un usuario con rol recepcionista en su mismo tenant', async () => {
    const res = await api()
      .post('/api/users')
      .set(bearer(admin.token))
      .send({ name: 'Lucía Medina', email: 'lucia@saludandina.pe', password: 'Salud2026', role: 'recepcionista' });
    expect(res.status).toBe(201);
    expect(res.body.role).toBe('recepcionista');
    expect(res.body.tenantId).toBe(admin.tenantId);
  });

  test('PA-HU03-E2: cambio de rol a profesional', async () => {
    const lucia = await createUser(admin.token, { name: 'Lucía Medina', email: 'lucia@saludandina.pe', role: 'recepcionista' });
    const res = await api().patch(`/api/users/${lucia.id}/role`).set(bearer(admin.token)).send({ role: 'profesional' });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('profesional');
  });

  test('PA-HU03-E3: un profesional no puede crear empleados (403)', async () => {
    const consulta = await createService(admin.token, 'Consulta general');
    const pro = await createUser(admin.token, { name: 'Carlos', email: 'carlos@saludandina.pe', role: 'profesional' });
    const res = await api().post('/api/employees').set(bearer(pro.token)).send({ name: 'Nuevo', services: [consulta._id] });
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('No tienes permisos para realizar esta acción');
  });

  test('PA-HU03-E4: rol inexistente responde 400', async () => {
    const res = await api()
      .post('/api/users')
      .set(bearer(admin.token))
      .send({ name: 'Pedro', email: 'pedro@saludandina.pe', password: 'Salud2026', role: 'gerente' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Rol no válido');
  });
});
