const { api, bearer, useDatabase, registerBusiness, createUser, createClient } = require('./helpers');

describe('HU-04 Aislamiento de datos por organización (multiinquilino)', () => {
  useDatabase();
  let centro;
  let santaRosa;
  beforeEach(async () => {
    centro = await registerBusiness('Centro Médico Salud Andina', 'admin@saludandina.pe');
    santaRosa = await registerBusiness('Policlínico Santa Rosa', 'admin@santarosa.pe');
  });

  test('PA-HU04-E1: cada negocio lista solo sus clientes', async () => {
    await createClient(centro.token, 'Cliente A1', '10000001');
    await createClient(centro.token, 'Cliente A2', '10000002');
    await createClient(centro.token, 'Cliente A3', '10000003');
    await createClient(santaRosa.token, 'Cliente B1', '20000001');
    await createClient(santaRosa.token, 'Cliente B2', '20000002');
    const res = await api().get('/api/clients').set(bearer(centro.token));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    res.body.forEach((c) => expect(c.tenantId).toBe(centro.tenantId));
  });

  test('PA-HU04-E2: el tenantId se asigna desde el token', async () => {
    const recep = await createUser(centro.token, { name: 'Lucía', email: 'lucia@saludandina.pe', role: 'recepcionista' });
    const res = await api()
      .post('/api/clients')
      .set(bearer(recep.token))
      .send({ name: 'María Quispe', dni: '71234567', phone: '964123456' });
    expect(res.status).toBe(201);
    expect(res.body.tenantId).toBe(centro.tenantId);
  });

  test('PA-HU04-E3: un registro de otro negocio responde 404', async () => {
    const ajeno = await createClient(santaRosa.token, 'Cliente B1', '20000001');
    const res = await api().get(`/api/clients/${ajeno._id}`).set(bearer(centro.token));
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Recurso no encontrado');
  });

  test('PA-HU04-E4: un tenantId falso en el body se ignora', async () => {
    const res = await api()
      .post('/api/clients')
      .set(bearer(centro.token))
      .send({ name: 'Intruso', dni: '30000001', phone: '964123456', tenantId: santaRosa.tenantId });
    expect(res.status).toBe(201);
    expect(res.body.tenantId).toBe(centro.tenantId);
    const deLucho = await api().get('/api/clients').set(bearer(santaRosa.token));
    expect(deLucho.body).toHaveLength(0);
  });
});
