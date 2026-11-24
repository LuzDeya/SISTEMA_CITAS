const BaseRepository = require('./BaseRepository');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Client = require('../models/Client');
const Service = require('../models/Service');
const Employee = require('../models/Employee');
const Appointment = require('../models/Appointment');

class UserRepository extends BaseRepository {
  /** Único acceso sin tenant: el login aún no conoce la organización del usuario. */
  findByEmail(email) {
    return this.Model.findOne({ email: String(email).toLowerCase().trim() }).lean();
  }
}

class TenantRepository {
  async create(data) {
    return (await Tenant.create(data)).toObject();
  }
  async delete(id) {
    await Tenant.deleteOne({ _id: id });
  }
}

const ACTIVE_STATUSES = ['programada', 'confirmada'];

class AppointmentRepository extends BaseRepository {
  /** Citas que ocupan horario (programadas o confirmadas) de un empleado en un intervalo */
  findBusy(tenantId, employeeId, start, end, excludeId = null) {
    const filter = {
      employeeId,
      status: { $in: ACTIVE_STATUSES },
      startAt: { $lt: new Date(end) },
      endAt: { $gt: new Date(start) },
    };
    if (excludeId) filter._id = { $ne: excludeId };
    return this.find(tenantId, filter, { startAt: 1 });
  }
}

module.exports = {
  tenantRepository: new TenantRepository(),
  userRepository: new UserRepository(User),
  clientRepository: new BaseRepository(Client),
  serviceRepository: new BaseRepository(Service),
  employeeRepository: new BaseRepository(Employee),
  appointmentRepository: new AppointmentRepository(Appointment),
  ACTIVE_STATUSES,
};
