const { Schema, model } = require('mongoose');

// Turno de la jornada: day 0 (domingo) … 6 (sábado), horas "HH:mm"
const shiftSchema = new Schema(
  {
    day: { type: Number, min: 0, max: 6, required: true },
    start: { type: String, required: true },
    end: { type: String, required: true },
  },
  { _id: false }
);

const employeeSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    services: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
    schedule: { type: [shiftSchema], default: [] },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = model('Employee', employeeSchema);
