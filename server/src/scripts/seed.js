/**
 * Carga datos de demostración en MongoDB LOCAL.
 * Uso: npm run seed   (vacía la base "reservas" y la vuelve a llenar)
 * Todas las contraseñas: Salud2026
 */
const mongoose = require('mongoose');
const dayjs = require('dayjs');
const { connectDB, disconnectDB } = require('../config/db');
const authService = require('../services/authService');
const userService = require('../services/userService');
const clientService = require('../services/clientService');
const catalogService = require('../services/catalogService');
const employeeService = require('../services/employeeService');
const appointmentService = require('../services/appointmentService');

const PASS = 'Salud2026';
const at = (offset, hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return dayjs().startOf('day').add(offset, 'day').hour(h).minute(m).toDate();
};

async function main() {
  await connectDB();
  // Se vacían las colecciones (funciona igual en MongoDB local y en Atlas;
  // en Atlas el usuario readWrite no tiene permiso para dropDatabase)
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));

  // ---------- Organización 1 ----------
  const reg = await authService.registerTenant({
    businessName: 'Centro Médico Salud Andina', name: 'Administrador Salud Andina', email: 'admin@saludandina.pe', password: PASS,
  });
  const admin = { id: reg.user.id, role: 'admin', tenantId: reg.tenant.id };
  const ctx = { tenantId: reg.tenant.id, user: admin };

  const consulta = await catalogService.create(ctx, { name: 'Consulta general', duration: 30, price: 25 });
  const pediatria = await catalogService.create(ctx, { name: 'Consulta pediátrica', duration: 30, price: 30 });
  const presion = await catalogService.create(ctx, { name: 'Toma de presión arterial', duration: 30, price: 15 });
  const chequeo = await catalogService.create(ctx, { name: 'Chequeo preventivo', duration: 60, price: 35 });

  const maria = await clientService.create(ctx, { name: 'María Quispe', dni: '71234567', phone: '964123456', email: 'maria@mail.com' });
  const juan = await clientService.create(ctx, { name: 'Juan Pérez', dni: '70000001', phone: '987654321', email: 'juan@mail.com' });
  const rosa = await clientService.create(ctx, { name: 'Rosa Huamán', dni: '72000002', phone: '955111222' });
  const luis = await clientService.create(ctx, { name: 'Luis Cárdenas', dni: '73000003', phone: '944333444' });

  await userService.create(ctx, { name: 'Lucía Medina', email: 'lucia@saludandina.pe', password: PASS, role: 'recepcionista' });
  const uCarlos = await userService.create(ctx, { name: 'Dr. Carlos Ramírez', email: 'carlos@saludandina.pe', password: PASS, role: 'profesional' });
  const uJorge = await userService.create(ctx, { name: 'Dr. Jorge Soto', email: 'jorge@saludandina.pe', password: PASS, role: 'profesional' });
  await userService.create(ctx, { name: 'María Quispe', email: 'maria@mail.com', password: PASS, role: 'cliente', clientId: maria._id });

  const lunSab = (start, end) => [1, 2, 3, 4, 5, 6].map((day) => ({ day, start, end }));
  const carlos = await employeeService.create(ctx, {
    name: 'Dr. Carlos Ramírez', services: [consulta._id, pediatria._id, presion._id, chequeo._id], userId: uCarlos.id,
  });
  await employeeService.setSchedule(ctx, carlos._id, [...lunSab('09:00', '13:00'), ...lunSab('15:00', '19:00')]);
  const jorge = await employeeService.create(ctx, { name: 'Dr. Jorge Soto', services: [consulta._id, presion._id], userId: uJorge.id });
  await employeeService.setSchedule(ctx, jorge._id, [...lunSab('10:00', '14:00'), ...lunSab('16:00', '20:00')]);

  // Citas de demostración en los próximos días laborables
  const plan = [
    [maria, carlos, consulta, 1, '09:00'], [juan, carlos, presion, 1, '10:00'], [rosa, jorge, consulta, 1, '10:00'],
    [luis, jorge, presion, 1, '16:00'], [maria, carlos, chequeo, 2, '15:00'], [juan, jorge, consulta, 2, '11:00'],
    [rosa, carlos, pediatria, 3, '09:30'], [maria, jorge, consulta, 4, '10:30'], [luis, carlos, consulta, 5, '11:00'],
  ];
  let creadas = 0;
  for (const [cl, emp, srv, d, h] of plan) {
    try {
      await appointmentService.create(ctx, { clientId: cl._id, employeeId: emp._id, serviceId: srv._id, startAt: at(d, h) });
      creadas += 1;
    } catch (e) {
      // domingo u horario fuera de jornada: se omite
    }
  }

  // ---------- Organización 2 (para evidenciar el aislamiento) ----------
  const reg2 = await authService.registerTenant({
    businessName: 'Policlínico Santa Rosa', name: 'Administrador Santa Rosa', email: 'admin@santarosa.pe', password: PASS,
  });
  const ctx2 = { tenantId: reg2.tenant.id, user: { id: reg2.user.id, role: 'admin', tenantId: reg2.tenant.id } };
  await catalogService.create(ctx2, { name: 'Control de vacunas', duration: 20, price: 12 });
  await clientService.create(ctx2, { name: 'Paciente de Santa Rosa', dni: '71234567', phone: '900000000' });

  console.log(`Datos cargados. Citas creadas: ${creadas}`); // eslint-disable-line no-console
  console.log('Usuarios (contraseña Salud2026): admin@saludandina.pe, lucia@saludandina.pe, carlos@saludandina.pe, jorge@saludandina.pe, maria@mail.com, admin@santarosa.pe'); // eslint-disable-line no-console
  await disconnectDB();
}

main().catch(async (e) => {
  console.error(e); // eslint-disable-line no-console
  await disconnectDB();
  process.exit(1);
});
