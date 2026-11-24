import { useEffect, useState } from 'react';
import { clientsApi } from '../api';
import { errorMessage } from '../api/http';
import { confirm, notifyError, notifyOk } from '../utils/alerts';
import { isDni, isEmail, isPhone } from '../utils/validate';
import Modal from '../components/Modal.jsx';

const EMPTY = { name: '', dni: '', phone: '', email: '' };

// HU-05: gestión de clientes (CRUD)
export default function Clientes() {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(null); // null = cerrado

  const load = () => clientsApi.list(search).then(setList).catch((e) => notifyError(errorMessage(e)));
  useEffect(() => { load(); }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return notifyError('El nombre es obligatorio');
    if (!isDni(form.dni)) return notifyError('El DNI debe tener 8 dígitos');
    if (!isPhone(form.phone)) return notifyError('El teléfono debe tener 9 dígitos');
    if (form.email && !isEmail(form.email)) return notifyError('Correo no válido');
    try {
      const { _id, name, dni, phone, email } = form;
      if (_id) await clientsApi.update(_id, { name, dni, phone, email });
      else await clientsApi.create({ name, dni, phone, email });
      notifyOk(_id ? 'Cliente actualizado' : 'Cliente registrado');
      setForm(null);
      load();
    } catch (err) {
      notifyError(errorMessage(err));
    }
    return undefined;
  };

  const remove = async (c) => {
    if (!(await confirm('¿Eliminar cliente?', `${c.name} será eliminado`, 'Sí, eliminar'))) return;
    try {
      await clientsApi.remove(c._id);
      notifyOk('Cliente eliminado');
      load();
    } catch (err) {
      notifyError(errorMessage(err));
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <section>
      <div className="page-head">
        <h2>Clientes</h2>
        <div className="filters">
          <input placeholder="Buscar por nombre o DNI" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn" onClick={() => setForm(EMPTY)}>+ Nuevo cliente</button>
        </div>
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Nombre</th><th>DNI</th><th>Teléfono</th><th>Correo</th><th /></tr></thead>
          <tbody>
            {list.map((c) => (
              <tr key={c._id}>
                <td>{c.name}</td><td>{c.dni}</td><td>{c.phone}</td><td>{c.email}</td>
                <td className="right">
                  <button className="btn small ghost" onClick={() => setForm(c)}>Editar</button>
                  <button className="btn small danger" onClick={() => remove(c)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p className="muted">No hay clientes registrados.</p>}
      </div>
      {form && (
        <Modal title={form._id ? 'Editar cliente' : 'Nuevo cliente'} onClose={() => setForm(null)}>
          <form className="form" onSubmit={save}>
            <label>Nombres y apellidos<input value={form.name} onChange={set('name')} /></label>
            <div className="row">
              <label>DNI<input value={form.dni} maxLength={8} onChange={set('dni')} /></label>
              <label>Teléfono<input value={form.phone} maxLength={9} onChange={set('phone')} /></label>
            </div>
            <label>Correo (opcional)<input value={form.email} onChange={set('email')} /></label>
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
