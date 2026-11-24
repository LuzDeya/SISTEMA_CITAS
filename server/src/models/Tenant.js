const { Schema, model } = require('mongoose');

const tenantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = model('Tenant', tenantSchema);
