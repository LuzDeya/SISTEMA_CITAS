const { Schema, model } = require('mongoose');

const serviceSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    duration: { type: Number, required: true }, // minutos
    price: { type: Number, required: true }, // soles
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

serviceSchema.index({ tenantId: 1, name: 1 }, { unique: true });

module.exports = model('Service', serviceSchema);
