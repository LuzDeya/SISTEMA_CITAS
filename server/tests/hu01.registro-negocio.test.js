const jwt = require('jsonwebtoken');
const { api, useDatabase, registerBusiness } = require('./helpers');

describe('HU-01 Registrar negocio (organización) con su administrador', () => {
  useDatabase();
  const body = {
    businessName: 'Centro Médico Salud Andina',
    name: 'Administrador',
    email: 'admin@saludandina.pe',
    password: 'Salud2026',
  };

  test('PA-HU01-E1: registro exitoso crea organización y usuario admin con el mismo tenantId', async () => {
    const res = await api().post('/api/auth/register').send(body);
    expect(res.status).toBe(201);
    expect(res.body.tenant.id).toBeDefined();
    expect(res.body.user.role).toBe('admin');
    expect(res.body.user.tenantId).toBe(res.body.tenant.id);
    expect(res.body.user.password).toBeUndefined();
  });

  test('PA-HU01-E2: el administrador inicia sesión inmediatamente y recibe JWT con rol admin', async () => {
    await api().post('/api/auth/register').send(body);
    const res = await api().post('/api/auth/login').send({ email: body.email, password: body.password });
    expect(res.status).toBe(200);
    expect(jwt.decode(res.body.token).role).toBe('admin');
  });

  test('PA-HU01-E3: correo ya registrado responde 409', async () => {
    await registerBusiness();
    const res = await api().post('/api/auth/register').send({ ...body, businessName: 'Otro Centro Médico' });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe('El correo ya está registrado');
  });

  test('PA-HU01-E4: contraseña débil responde 400', async () => {
    const res = await api().post('/api/auth/register').send({ ...body, password: 'salud1' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número');
  });
});
