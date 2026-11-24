const { Schema, model } = require('mongoose');

const STATUSES = ['programada', 'confirmada', 'completada', 'cancelada', 'no_asistio'];

const historySchema = new Schema(
  {
    startAt: Date,
    endAt: Date,
    employeeId: Schema.Types.ObjectId,
    serviceId: Schema.Types.ObjectId,
    changedBy: Schema.Types.ObjectId,
    changedAt: Date,
  },
  { _id: false }
);

const appointmentSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    price: { type: Number, required: true },
    status: { type: String, enum: STATUSES, default: 'programada' },
    notes: { type: String, default: '' },
    cancelReason: { type: String, default: '' },
    cancelledBy: { type: Schema.Types.ObjectId, default: null },
    cancelledAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, default: null },
    history: { type: [historySchema], default: [] },
  },
  { timestamps: true }
);

appointmentSchema.index({ tenantId: 1, employeeId: 1, startAt: 1 });

module.exports = model('Appointment', appointmentSchema);
module.exports.STATUSES = STATUSES;
