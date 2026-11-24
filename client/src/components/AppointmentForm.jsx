import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import Modal from './Modal.jsx';
import { appointmentsApi, availabilityApi, clientsApi, employeesApi, servicesApi } from '../api';
import { errorMessage } from '../api/http';
import { confirm, notifyError, notifyOk } from '../utils/alerts';
import { money } from '../utils/format';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * HU-09 / HU-10 / HU-11: registrar o reprogramar una cita.
 * Pasos: cliente → servicio → empleado → fecha → hora libre (consultada a la API) → confirmar.
 */
export default function AppointmentForm({ appointment, initialDate, onClose, onSaved }) {
  const { user } = useAuth();
  const isClient = user.role === 'cliente';
  const editing = Boolean(appointment);

  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    clientId: appointment ? String(appointment.clientId) : '',
    serviceId: appointment ? String(appointment.serviceId) : '',
    employeeId: appointment ? String(appointment.employeeId) : '',
    date: dayjs(appointment ? appointment.startAt : initialDate || dayjs().add(1, 'day')).format('YYYY-MM-DD'),
    time: '',
    notes: appointment ? appointment.notes || '' : '',
  });
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    servicesApi.list().then(setServices).catch((e) => notifyError(errorMessage(e)));
    employeesApi.list().then(setEmployees).catch((e) => notifyError(errorMessage(e)));
    if (!isClient) clientsApi.list().then(setClients).catch((e) => notifyError(errorMessage(e)));
  }, [isClient]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v, ...(k !== 'time' && k !== 'notes' ? { time: '' } : {}) }));
  const employeesForService = employees.filter((e) => !form.serviceId || e.services.map(String).includes(form.serviceId));
  const service = services.find((s) => s._id === form.serviceId);

  // HU-09: consulta de horarios libres
  useEffect(() => {
    if (!form.serviceId || !form.employeeId || !form.date) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    availabilityApi
      .get({ employeeId: form.employeeId, serviceId: form.serviceId, date: form.date })
      .then((r) => setSlots(r.slots))
      .catch((e) => {
        setSlots([]);
        notifyError(errorMessage(e));
      })
      .finally(() => setLoadingSlots(false));
  }, [form.serviceId, form.employeeId, form.date, reload]);

  const submit = async (e) => {
    e.preventDefault();
    if (!isClient && !form.clientId) return notifyError('Seleccione un cliente');
    if (!form.serviceId || !form.employeeId || !form.time) return notifyError('Complete servicio, empleado y hora');
    if (dayjs(form.date).isBefore(dayjs(), 'day')) return notifyError('No se puede reservar en una fecha u hora pasada');
    const ok = await confirm(
      editing ? '¿Reprogramar la cita?' : '¿Confirmar la reserva?',
      `${service ? service.name : ''} el ${dayjs(form.date).format('DD/MM/YYYY')} a las ${form.time}`
    );
    if (!ok) return undefined;

    const [h, m] = form.time.split(':').map(Number);
    const startAt = dayjs(form.date).hour(h).minute(m).second(0).toISOString();
    const body = { serviceId: form.serviceId, employeeId: form.employeeId, startAt, notes: form.notes };
    if (!isClient) body.clientId = form.clientId;
    setSaving(true);
    try {
      if (editing) await appointmentsApi.update(appointment._id, body);
      else await appointmentsApi.create(body);
      notifyOk(editing ? 'Cita reprogramada' : 'Cita registrada');
      onSaved();
    } catch (err) {
      notifyError(errorMessage(err));
      // E3: si el horario se ocupó, se recargan los horarios libres
      if (err.response && err.response.status === 409) {
        set('time', '');
        setReload((n) => n + 1);
      }
    } finally {
      setSaving(false);
    }
    return undefined;
  };

  return (
    <Modal title={editing ? 'Modificar / reprogramar cita' : 'Nueva cita'} onClose={onClose} wide>
      <form className="form" onSubmit={submit}>
        {!isClient && (
          <label>
            Cliente
            <select value={form.clientId} onChange={(e) => set('clientId', e.target.value)} disabled={editing}>
              <option value="">Seleccione…</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>{c.name} — DNI {c.dni}</option>
              ))}
            </select>
          </label>
        )}
        <div className="row">
          <label>
            Servicio
            <select value={form.serviceId} onChange={(e) => set('serviceId', e.target.value)}>
              <option value="">Seleccione…</option>
              {services.map((s) => (
                <option key={s._id} value={s._id}>{s.name} · {s.duration} min · {money(s.price)}</option>
              ))}
            </select>
          </label>
          <label>
            Empleado
            <select value={form.employeeId} onChange={(e) => set('employeeId', e.target.value)}>
              <option value="">Seleccione…</option>
              {employeesForService.map((emp) => (
                <option key={emp._id} value={emp._id}>{emp.name}</option>
              ))}
            </select>
          </label>
          <label>
            Fecha
            <input type="date" value={form.date} min={dayjs().format('YYYY-MM-DD')} onChange={(e) => set('date', e.target.value)} />
          </label>
        </div>
        <div>
          <span className="label">Horarios libres</span>
          {loadingSlots && <p className="muted">Consultando disponibilidad…</p>}
          {!loadingSlots && form.employeeId && form.serviceId && slots.length === 0 && (
            <p className="muted">No hay horarios libres para esta fecha.</p>
          )}
          <div className="slots">
            {slots.map((t) => (
              <button type="button" key={t} className={`slot ${form.time === t ? 'on' : ''}`} onClick={() => set('time', t)}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <label>
          Nota (opcional)
          <input value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Ej. Trae resultados de análisis" />
        </label>
        <div className="actions">
          <button type="button" className="btn ghost" onClick={onClose}>Cerrar</button>
          <button className="btn" disabled={saving}>{editing ? 'Guardar cambios' : 'Reservar'}</button>
        </div>
      </form>
    </Modal>
  );
}
