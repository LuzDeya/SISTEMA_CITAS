import { useEffect, useState } from 'react';
import { servicesApi } from '../api';
import { errorMessage } from '../api/http';
import { notifyError, notifyOk } from '../utils/alerts';
import { money } from '../utils/format';
import Modal from '../components/Modal.jsx';

const EMPTY = { name: '', duration: 30, price: '' };

// HU-08: gestión de servicios
export default function Servicios() {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(null);

  const load = () => servicesApi.list({ search, all: true }).then(setList).catch((e) => notifyError(errorMessage(e)));
  useEffect(() => { load(); }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (e) => {
    e.preventDefault();
    if (!(Number(form.price) > 0) || !(Number(form.duration) > 0)) {
      return notifyError('El costo y la duración deben ser mayores a 0');
    }
    try {
      const body = { name: form.name, duration: Number(form.duration), price: Number(form.price) };
      if (form._id) await servicesApi.update(form._id, body);
      else await servicesApi.create(body);
      notifyOk('Servicio guardado');
      setForm(null);
      load();
    } catch (err) {
      notifyError(errorMessage(err));
    }
    return undefined;
  };

  const toggle = async (s) => {
    try {
      await servicesApi.update(s._id, { active: !s.active });
      notifyOk(s.active ? 'Servicio desactivado' : 'Servicio activado');
      load();
    } catch (err) {
      notifyError(errorMessage(err));
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <section>
      <div className="page-head">
        <h2>Servicios</h2>
        <div className="filters">
          <input placeholder="Buscar servicio" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn" onClick={() => setForm(EMPTY)}>+ Nuevo servicio</button>
        </div>
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Servicio</th><th>Duración</th><th>Costo</th><th>Estado</th><th /></tr></thead>
          <tbody>
            {list.map((s) => (
              <tr key={s._id} className={s.active ? '' : 'off'}>
                <td>{s.name}</td><td>{s.duration} min</td><td>{money(s.price)}</td>
                <td>{s.active ? 'Activo' : 'Inactivo'}</td>
                <td className="right">
                  <button className="btn small ghost" onClick={() => setForm(s)}>Editar</button>
                  <button className="btn small ghost" onClick={() => toggle(s)}>{s.active ? 'Desactivar' : 'Activar'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p className="muted">No se encontraron servicios con ese nombre.</p>}
      </div>
      {form && (
        <Modal title={form._id ? 'Editar servicio' : 'Nuevo servicio'} onClose={() => setForm(null)}>
          <form className="form" onSubmit={save}>
            <label>Nombre<input value={form.name} onChange={set('name')} required /></label>
            <div className="row">
              <label>Duración (min)<input type="number" min="5" step="5" value={form.duration} onChange={set('duration')} /></label>
              <label>Costo (S/)<input type="number" min="0" step="0.5" value={form.price} onChange={set('price')} /></label>
            </div>
            <div className="actions">
              <button type="button" className="btn ghost" onClick={() => setForm(null)}>Cancelar</button>
              <button className="btn">Guardar</button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}
