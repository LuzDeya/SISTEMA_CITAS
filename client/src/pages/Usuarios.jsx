import { useEffect, useState } from 'react';
import { clientsApi, usersApi } from '../api';
import { errorMessage } from '../api/http';
import { notifyError, notifyOk } from '../utils/alerts';
import { ROLE_LABEL } from '../utils/format';
import { isEmail, isStrongPassword, PASSWORD_MSG } from '../utils/validate';
import Modal from '../components/Modal.jsx';

const EMPTY = { name: '', email: '', password: '', role: 'recepcionista', clientId: '' };

// HU-03: usuarios y roles (RBAC)
export default function Usuarios() {
  const [list, setList] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(null);

  const load = () => usersApi.list().then(setList).catch((e) => notifyError(errorMessage(e)));
  useEffect(() => {
    load();
    clientsApi.list().then(setClients).catch(() => {});
  }, []);

  const save = async (e) => {
    e.preventDefault();
    if (!isEmail(form.email)) return notifyError('Correo no válido');
    if (!isStrongPassword(form.password)) return notifyError(PASSWORD_MSG);
    try {
      await usersApi.create({ ...form, clientId: form.role === 'cliente' ? form.clientId || undefined : undefined });
      notifyOk('Usuario creado');
      setForm(null);
      load();
    } catch (err) {
      notifyError(errorMessage(err));
    }
    return undefined;
  };

  const changeRole = async (u, role) => {
    try {
      await usersApi.changeRole(u.id, role);
      notifyOk('Rol actualizado');
      load();
    } catch (err) {
      notifyError(errorMessage(err));
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <section>
      <div className="page-head">
        <h2>Usuarios y roles</h2>
        <button className="btn" onClick={() => setForm(EMPTY)}>+ Nuevo usuario</button>
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th></tr></thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td><td>{u.email}</td>
                <td>
                  <select value={u.role} onChange={(e) => changeRole(u, e.target.value)}>
                    {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {form && (
        <Modal title="Nuevo usuario" onClose={() => setForm(null)}>
          <form className="form" onSubmit={save}>
            <label>Nombre<input value={form.name} onChange={set('name')} required /></label>
            <label>Correo<input type="email" value={form.email} onChange={set('email')} required /></label>
            <label>Contraseña<input type="password" value={form.password} onChange={set('password')} required /></label>
            <label>
              Rol
              <select value={form.role} onChange={set('role')}>
                {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            {form.role === 'cliente' && (
              <label>
                Ficha de cliente vinculada
                <select value={form.clientId} onChange={set('clientId')}>
                  <option value="">Seleccione…</option>
                  {clients.map((c) => <option key={c._id} value={c._id}>{c.name} — DNI {c.dni}</option>)}
                </select>
              </label>
            )}
            <div className="actions">
              <button type="button" className="btn ghost" onClick={() => setForm(null)}>Cancelar</button>
              <button className="btn">Crear</button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}
