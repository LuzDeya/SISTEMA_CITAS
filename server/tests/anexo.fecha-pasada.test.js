// Prueba ADICIONAL del anexo (AX-06): regla de negocio RN de HU-10 / HU-11.
// No es un criterio de aceptación numerado; complementa las 64 pruebas mínimas.
const { api, bearer, useDatabase, centro, createAppointment, at } = require('./helpers');

describe('Anexo AX-06 No se reserva en fechas u horas pasadas', () => {
  useDatabase();
  let b;
  beforeEach(async () => {
    b = await centro();
  });

  test('AX-06a: registrar una cita para ayer responde 400', async () => {
    const res = await api()
      .post('/api/appointments')
      .set(bearer(b.recep.token))
      .send({ clientId: b.maria._id, employeeId: b.carlos._id, serviceId: b.consulta._id, startAt: at(-1, '09:00') });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('No se puede reservar en una fecha u hora pasada');
  });

  test('AX-06b: reprogramar una cita a ayer responde 400', async () => {
    const cita = await createAppointment(b.recep.token, {
      clientId: b.maria._id, employeeId: b.carlos._id, serviceId: b.consulta._id, startAt: at(1, '09:00'),
    });
    const res = await api().put(`/api/appointments/${cita._id}`).set(bearer(b.recep.token)).send({ startAt: at(-1, '09:00') });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('No se puede reservar en una fecha u hora pasada');
  });
});
