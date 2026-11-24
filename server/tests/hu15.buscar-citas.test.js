const {
  api, bearer, useDatabase, centro, createClient, createEmployee, createService, createAppointment, at, day,
} = require('./helpers');

describe('HU-15 Buscar y filtrar citas', () => {
  useDatabase();
  let b;
  const search = (qs) => api().get(`/api/appointments?${qs}`).set(bearer(b.recep.token));
  const book = (clientId, employeeId, serviceId, startAt) =>
    createAppointment(b.recep.token, { clientId, employeeId, serviceId, startAt });
  beforeEach(async () => {
    b = await centro();
  });

  test('PA-HU15-E1: filtrar por cliente, de la más reciente a la más antigua', async () => {
    const juan = await createClient(b.recep.token, 'Juan Pérez', '70000001');
    await book(b.maria._id, b.carlos._id, b.consulta._id, at(1, '09:00'));
    await book(b.maria._id, b.carlos._id, b.consulta._id, at(3, '09:00'));
    await book(b.maria._id, b.carlos._id, b.consulta._id, at(2, '09:00'));
    await book(juan._id, b.carlos._id, b.consulta._id, at(1, '10:00'));
    await book(juan._id, b.carlos._id, b.consulta._id, at(2, '10:00'));
    const res = await search(`clientId=${b.maria._id}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    const times = res.body.map((a) => new Date(a.startAt).getTime());
    expect(times).toEqual([...times].sort((x, y) => y - x));
  });

  test('PA-HU15-E2: filtro combinado por empleado, servicio y rango de fechas', async () => {
    const presion = await createService(b.admin.token, 'Toma de presión arterial', 30, 15);
    await api().put(`/api/employees/${b.carlos._id}`).set(bearer(b.admin.token)).send({ services: [b.consulta._id, presion._id] });
    const jorge = await createEmployee(b.admin.token, 'Jorge Soto', [b.consulta._id]);
    await book(b.maria._id, b.carlos._id, b.consulta._id, at(1, '09:00')); // cumple
    await book(b.maria._id, b.carlos._id, b.consulta._id, at(5, '09:00')); // cumple
    await book(b.maria._id, b.carlos._id, presion._id, at(2, '09:00')); // otro servicio
    await book(b.maria._id, jorge._id, b.consulta._id, at(2, '09:00')); // otro empleado
    await book(b.maria._id, b.carlos._id, b.consulta._id, at(10, '09:00')); // fuera de rango
    const res = await search(`employeeId=${b.carlos._id}&serviceId=${b.consulta._id}&from=${day(1)}&to=${day(7)}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  test('PA-HU15-E3: fecha final anterior a la inicial responde 400', async () => {
    const res = await search(`from=${day(5)}&to=${day(1)}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('La fecha final no puede ser anterior a la inicial');
  });

  test('PA-HU15-E4: sin resultados devuelve lista vacía', async () => {
    const ecografia = await createService(b.admin.token, 'Ecografía', 60, 40);
    await book(b.maria._id, b.carlos._id, b.consulta._id, at(1, '09:00'));
    const res = await search(`serviceId=${ecografia._id}&from=${day(1)}&to=${day(7)}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
