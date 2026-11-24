import { useEffect, useState } from 'react';
import { appointmentsApi } from '../api';
import { errorMessage } from '../api/http';
import { askReason, notifyError, notifyOk } from '../utils/alerts';
import { fmtDate, fmtTime, money } from '../utils/format';
import StatusBadge from '../components/StatusBadge.jsx';
import AppointmentForm from '../components/AppointmentForm.jsx';

// Rol cliente: reservar (HU-10 E2), ver y cancelar sus citas (HU-12 E2)
export default function MisCitas() {
  const [list, setList] = useState([]);
  const [booking, setBooking] = useState(false);

  const load = () => appointmentsApi.mine().then(setList).catch((e) => notifyError(errorMessage(e)));
  useEffect(() => { load(); }, []);

  const cancel = async (a) => {
    const reason = await askReason();
    if (!reason) return;
    try {
      await appointmentsApi.cancel(a._id, reason);
      notifyOk('Cita cancelada');
      load();
    } catch (err) {
      notifyError(errorMessage(err));
    }
  };

  return (
    <section>
      <div className="page-head">
        <h2>Mis citas</h2>
        <button className="btn" onClick={() => setBooking(true)}>+ Reservar cita</button>
      </div>
      <div className="card">
        {list.length === 0 ? <p className="muted">Aún no tienes citas.</p> : (
          <table>
            <thead><tr><th>Fecha</th><th>Hora</th><th>Servicio</th><th>Profesional</th><th>Costo</th><th>Estado</th><th /></tr></thead>
            <tbody>
              {list.map((a) => (
                <tr key={a._id}>
                  <td>{fmtDate(a.startAt)}</td><td>{fmtTime(a.startAt)}</td><td>{a.serviceName}</td>
                  <td>{a.employeeName}</td><td>{money(a.price)}</td><td><StatusBadge status={a.status} /></td>
                  <td className="right">
                    {['programada', 'confirmada'].includes(a.status) && (
                      <button className="btn small danger" onClick={() => cancel(a)}>Cancelar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {booking && <AppointmentForm onClose={() => setBooking(false)} onSaved={() => { setBooking(false); load(); }} />}
    </section>
  );
}
