const { Schema, model } = require('mongoose');

const clientSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    dni: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: '' },
  },
  { timestamps: true }
);

// El DNI es único dentro de cada organización (inquilino)
clientSchema.index({ tenantId: 1, dni: 1 }, { unique: true });

module.exports = model('Client', clientSchema);
