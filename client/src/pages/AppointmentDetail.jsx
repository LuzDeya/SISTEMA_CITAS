import { useEffect, useState } from 'react';
import Modal from '../components/Modal.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import AppointmentForm from '../components/AppointmentForm.jsx';
import { appointmentsApi } from '../api';
import { errorMessage } from '../api/http';
import { askReason, confirm, notifyError, notifyOk } from '../utils/alerts';
import { fmtDateTime, fmtTime, money } from '../utils/format';
import { useAuth } from '../context/AuthContext.jsx';

// Transiciones permitidas (HU-13), iguales a las del servidor (server)
const NEXT = {
  programada: [['confirmada', 'Confirmar']],
  confirmada: [['completada', 'Completar'], ['no_asistio', 'No asistió']],
};

/** Detalle de una cita: cambiar estado (HU-13), reprogramar (HU-11), cancelar (HU-12) */
export default function AppointmentDetail({ id, onClose, onChanged }) {
  const { user } = useAuth();
  const [a, setA] = useState(null);
  const [editing, setEditing] = useState(false);

  const load = () => appointmentsApi.get(id).then(setA).catch((e) => notifyError(errorMessage(e)));
  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const done = (msg) => {
    notifyOk(msg);
    load();
    onChanged();
  };

  const changeStatus = async (status, label) => {
    if (!(await confirm(`¿${label}?`, 'Se actualizará el estado de la cita'))) return;
    try {
      await appointmentsApi.status(id, status);
      done('Estado actualizado');
    } catch (e) {
      notifyError(errorMessage(e));
    }
  };

  const cancel = async () => {
    const reason = await askReason();
    if (!reason) return;
    try {
      await appointmentsApi.cancel(id, reason);
      done('Cita cancelada');
    } catch (e) {
      notifyError(errorMessage(e));
    }
  };

  if (!a) return null;
  const staff = ['admin', 'recepcionista'].includes(user.role);
  const open = ['programada', 'confirmada'].includes(a.status);
  const future = new Date(a.startAt) > new Date(); // una cita que ya pasó no se reprograma

  if (editing) {
    return <AppointmentForm appointment={a} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); load(); onChanged(); }} />;
  }

  return (
    <Modal title="Detalle de la cita" onClose={onClose}>
      <dl className="detail">
        <dt>Cliente</dt><dd>{a.clientName}</dd>
        <dt>Servicio</dt><dd>{a.serviceName} · {money(a.price)}</dd>
        <dt>Empleado</dt><dd>{a.employeeName}</dd>
        <dt>Fecha</dt><dd>{fmtDateTime(a.startAt)} – {fmtTime(a.endAt)}</dd>
        <dt>Estado</dt><dd><StatusBadge status={a.status} /></dd>
        {a.notes && (<><dt>Nota</dt><dd>{a.notes}</dd></>)}
        {a.cancelReason && (<><dt>Motivo</dt><dd>{a.cancelReason}</dd></>)}
      </dl>
      <div className="actions">
        {user.role !== 'cliente' && (NEXT[a.status] || []).map(([st, label]) => (
          <button key={st} className="btn" onClick={() => changeStatus(st, label)}>{label}</button>
        ))}
        {staff && open && future && <button className="btn ghost" onClick={() => setEditing(true)}>Reprogramar</button>}
        {(staff || user.role === 'cliente') && open && <button className="btn danger" onClick={cancel}>Cancelar cita</button>}
      </div>
    </Modal>
  );
}
