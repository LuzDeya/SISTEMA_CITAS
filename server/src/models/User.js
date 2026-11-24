const { Schema, model } = require('mongoose');

const ROLES = ['admin', 'recepcionista', 'profesional', 'cliente'];

const userSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ROLES, required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = model('User', userSchema);
module.exports.ROLES = ROLES;
