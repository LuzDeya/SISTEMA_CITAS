const mongoose = require('mongoose');

/**
 * Repositorio base multiinquilino.
 * TODAS las operaciones reciben el tenantId (tomado del JWT) y lo agregan al filtro,
 * así un negocio nunca puede leer ni modificar datos de otro (aislamiento a nivel de repositorio).
 * Cualquier tenantId que venga en los datos se descarta.
 */
class BaseRepository {
  constructor(Model) {
    this.Model = Model;
  }

  static isId(id) {
    return mongoose.isValidObjectId(id);
  }

  static clean(data = {}) {
    const { tenantId, _id, ...rest } = data; // eslint-disable-line no-unused-vars
    return rest;
  }

  scope(tenantId, filter = {}) {
    return { ...filter, tenantId };
  }

  find(tenantId, filter = {}, sort = { createdAt: -1 }) {
    return this.Model.find(this.scope(tenantId, filter)).sort(sort).lean();
  }

  findOne(tenantId, filter = {}) {
    return this.Model.findOne(this.scope(tenantId, filter)).lean();
  }

  async findById(tenantId, id) {
    if (!BaseRepository.isId(id)) return null;
    return this.findOne(tenantId, { _id: id });
  }

  async create(tenantId, data) {
    const doc = await this.Model.create({ ...BaseRepository.clean(data), tenantId });
    return doc.toObject();
  }

  async update(tenantId, id, data) {
    if (!BaseRepository.isId(id)) return null;
    return this.Model.findOneAndUpdate(
      this.scope(tenantId, { _id: id }),
      { $set: BaseRepository.clean(data) },
      { new: true }
    ).lean();
  }

  async delete(tenantId, id) {
    if (!BaseRepository.isId(id)) return false;
    const r = await this.Model.deleteOne(this.scope(tenantId, { _id: id }));
    return r.deletedCount > 0;
  }

  count(tenantId, filter = {}) {
    return this.Model.countDocuments(this.scope(tenantId, filter));
  }
}

module.exports = BaseRepository;
