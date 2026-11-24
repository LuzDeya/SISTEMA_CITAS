import { useEffect, useState } from 'react';
import { employeesApi, servicesApi, usersApi } from '../api';
import { errorMessage } from '../api/http';
import { confirm, notifyError, notifyOk } from '../utils/alerts';
import { DAYS } from '../utils/format';
import Modal from '../components/Modal.jsx';

const EMPTY = { name: '', phone: '', email: '', services: [], userId: '' };

// HU-06: gestión de empleados · HU-07: jornada laboral
export default function Empleados() {
  const [list, setList] = useState([]);
  const [services, setServices] = useState([]);
  const [pros, setPros] = useState([]);
  const [form, setForm] = useState(null);
  const [scheduleOf, setScheduleOf] = useState(null);

  const load = () => employeesApi.list({ all: true }).then(setList).catch((e) => notifyError(errorMessage(e)));
  useEffect(() => {
    load();
    servicesApi.list().then(setServices).catch(() => {});
    usersApi.list().then((u) => setPros(u.filter((x) => x.role === 'profesional'))).catch(() => {});
  }, []);

  const serviceName = (id) => (services.find((s) => s._id === String(id)) || {}).name || '—';

  const save = async (e) => {
    e.preventDefault();
    if (form.services.length === 0) return notifyError('Debe asignar al menos un servicio');
    try {
      const body = { name: form.name, phone: form.phone, email: form.email, services: form.services, userId: form.userId || null };
      if (form._id) await employeesApi.update(form._id, body);
      else await employeesApi.create(body);
      notifyOk('Empleado guardado');
      setForm(null);
      load();
    } catch (err) {
      notifyError(errorMessage(err));
    }
    return undefined;
  };

  const toggle = async (emp) => {
    if (emp.active && !(await confirm('¿Desactivar empleado?', 'Ya no se podrán registrar nuevas citas con él. Sus citas actuales se conservan.'))) return;
    try {
      await employeesApi.update(emp._id, { active: !emp.active });
      notifyOk(emp.active ? 'Empleado desactivado' : 'Empleado activado');
      load();
    } catch (err) {
      notifyError(errorMessage(err));
    }
  };

  const toggleService = (id) =>
    setForm({ ...form, services: form.services.includes(id) ? form.services.filter((s) => s !== id) : [...form.services, id] });

  return (
    <section>
      <div className="page-head">
        <h2>Empleados</h2>
        <button className="btn" onClick={() => setForm(EMPTY)}>+ Nuevo empleado</button>
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Nombre</th><th>Servicios</th><th>Jornada</th><th>Estado</th><th /></tr></thead>
          <tbody>
            {list.map((emp) => (
              <tr key={emp._id} className={emp.active ? '' : 'off'}>
                <td>{emp.name}</td>
                <td>{emp.services.map(serviceName).join(', ')}</td>
                <td>{emp.schedule.length ? `${new Set(emp.schedule.map((s) => s.day)).size} días` : 'Sin jornada'}</td>
                <td>{emp.active ? 'Activo' : 'Inactivo'}</td>
                <td className="right">
                  <button className="btn small ghost" onClick={() => setForm({ ...emp, services: emp.services.map(String), userId: emp.userId ? String(emp.userId) : '' })}>Editar</button>
                  <button className="btn small ghost" onClick={() => setScheduleOf(emp)}>Jornada</button>
                  <button className="btn small ghost" onClick={() => toggle(emp)}>{emp.active ? 'Desactivar' : 'Activar'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {form && (
        <Modal title={form._id ? 'Editar empleado' : 'Nuevo empleado'} onClose={() => setForm(null)}>
          <form className="form" onSubmit={save}>
            <label>Nombre<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
            <div className="row">
              <label>Teléfono<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
              <label>Correo<input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            </div>
            <span className="label">Servicios que atiende</span>
            <div className="checks">
              {services.map((s) => (
                <label key={s._id} className="check">
                  <input type="checkbox" checked={form.services.includes(s._id)} onChange={() => toggleService(s._id)} /> {s.name}
                </label>
              ))}
            </div>
            <label>
              Usuario profesional vinculado (para que vea su agenda)
              <select value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
                <option value="">Ninguno</option>
                {pros.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
              </select>
            </label>
            <div className="actions">
              <button type="button" className="btn ghost" onClick={() => setForm(null)}>Cancelar</button>
              <button className="btn">Guardar</button>
            </div>
          </form>
        </Modal>
      )}
      {scheduleOf && <ScheduleEditor employee={scheduleOf} onClose={() => setScheduleOf(null)} onSaved={() => { setScheduleOf(null); load(); }} />}
    </section>
  );
}

/** HU-07: editor de jornada semanal (varios turnos por día) */
function ScheduleEditor({ employee, onClose, onSaved }) {
  const [shifts, setShifts] = useState(employee.schedule.map((s) => ({ ...s })));
  const add = (day) => setShifts([...shifts, { day, start: '09:00', end: '13:00' }]);
  const upd = (i, k, v) => setShifts(shifts.map((s, j) => (j === i ? { ...s, [k]: v } : s)));
  const del = (i) => setShifts(shifts.filter((_, j) => j !== i));

  const save = async () => {
    try {
      await employeesApi.setSchedule(employee._id, shifts);
      notifyOk('Jornada guardada');
      onSaved();
    } catch (err) {
      notifyError(errorMessage(err));
    }
  };

  return (
    <Modal title={`Jornada de ${employee.name}`} onClose={onClose} wide>
      <div className="schedule">
        {[1, 2, 3, 4, 5, 6, 0].map((day) => (
          <div key={day} className="sch-day">
            <strong>{DAYS[day]}</strong>
            <div>
              {shifts.map((s, i) => (s.day === day ? (
                <span key={i} className="shift">
                  <input type="time" value={s.start} onChange={(e) => upd(i, 'start', e.target.value)} />
                  a
                  <input type="time" value={s.end} onChange={(e) => upd(i, 'end', e.target.value)} />
                  <button className="x" onClick={() => del(i)} title="Quitar turno">×</button>
                </span>
              ) : null))}
              <button className="btn small ghost" onClick={() => add(day)}>+ Turno</button>
            </div>
          </div>
        ))}
      </div>
      <div className="actions">
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn" onClick={save}>Guardar jornada</button>
      </div>
    </Modal>
  );
}
