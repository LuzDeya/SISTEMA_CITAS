const jwt = require('jsonwebtoken');
const { api, bearer, useDatabase, registerBusiness, createUser } = require('./helpers');

describe('HU-02 Iniciar sesión', () => {
  useDatabase();
  let lucia;
  beforeEach(async () => {
    const admin = await registerBusiness();
    lucia = await createUser(admin.token, { name: 'Lucía Medina', email: 'lucia@saludandina.pe', role: 'recepcionista' });
  });

  test('PA-HU02-E1: inicio de sesión exitoso devuelve JWT con userId, rol y tenantId', async () => {
    const res = await api().post('/api/auth/login').send({ email: 'lucia@saludandina.pe', password: 'Salud2026' });
    expect(res.status).toBe(200);
    const payload = jwt.decode(res.body.token);
    expect(payload.sub).toBe(lucia.id);
    expect(payload.role).toBe('recepcionista');
    expect(payload.tenantId).toBeDefined();
  });

  test('PA-HU02-E2: consulta de perfil con el token sin devolver la contraseña', async () => {
    const res = await api().get('/api/auth/me').set(bearer(lucia.token));
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Lucía Medina');
    expect(res.body.email).toBe('lucia@saludandina.pe');
    expect(res.body.role).toBe('recepcionista');
    expect(res.body.password).toBeUndefined();
  });

  test('PA-HU02-E3: contraseña incorrecta responde 401', async () => {
    const res = await api().post('/api/auth/login').send({ email: 'lucia@saludandina.pe', password: 'Otra2026X' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Correo o contraseña incorrectos');
  });

  test('PA-HU02-E4: ruta protegida sin token o con token alterado responde 401', async () => {
    const sinToken = await api().get('/api/clients');
    expect(sinToken.status).toBe(401);
    expect(sinToken.body.message).toBe('No autenticado');
    const alterado = await api().get('/api/clients').set(bearer(`${lucia.token}x`));
    expect(alterado.status).toBe(401);
    expect(alterado.body.message).toBe('No autenticado');
  });
});
