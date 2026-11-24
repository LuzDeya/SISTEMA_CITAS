const { api, bearer, useDatabase, centro } = require('./helpers');

describe('HU-07 Jornada laboral del empleado', () => {
  useDatabase();
  let b;
  const put = (schedule) =>
    api().put(`/api/employees/${b.carlos._id}/schedule`).set(bearer(b.admin.token)).send({ schedule });
  beforeEach(async () => {
    b = await centro();
  });

  test('PA-HU07-E1: registro de jornada de lunes a sábado 09:00–13:00', async () => {
    const schedule = [1, 2, 3, 4, 5, 6].map((day) => ({ day, start: '09:00', end: '13:00' }));
    const res = await put(schedule);
    expect(res.status).toBe(200);
    expect(res.body.schedule).toHaveLength(6);
  });

  test('PA-HU07-E2: dos turnos en un mismo día', async () => {
    const res = await put([
      { day: 1, start: '09:00', end: '13:00' },
      { day: 1, start: '15:00', end: '19:00' },
    ]);
    expect(res.status).toBe(200);
    expect(res.body.schedule.filter((s) => s.day === 1)).toHaveLength(2);
  });

  test('PA-HU07-E3: hora de fin anterior a la de inicio responde 400', async () => {
    const res = await put([{ day: 1, start: '18:00', end: '14:00' }]);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('La hora de fin debe ser posterior a la hora de inicio');
  });

  test('PA-HU07-E4: turnos que se cruzan responden 400', async () => {
    const res = await put([
      { day: 1, start: '09:00', end: '13:00' },
      { day: 1, start: '12:00', end: '16:00' },
    ]);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Los turnos no pueden cruzarse');
  });
});
