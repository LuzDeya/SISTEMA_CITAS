import { useCallback, useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { appointmentsApi, employeesApi } from '../api';
import { errorMessage } from '../api/http';
import { notifyError } from '../utils/alerts';

// No se puede reservar en días u horas que ya pasaron
const isPast = (date) => dayjs(date).isBefore(dayjs(), 'minute');
import { useAuth } from '../context/AuthContext.jsx';
import AppointmentForm from '../components/AppointmentForm.jsx';
import AppointmentDetail from './AppointmentDetail.jsx';

const VIEW_MAP = { timeGridDay: 'day', timeGridWeek: 'week', dayGridMonth: 'month' };

// HU-14: agenda diaria, semanal y mensual con FullCalendar
export default function Agenda() {
  const { user } = useAuth();
  const calRef = useRef(null);
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [current, setCurrent] = useState({ view: 'week', date: dayjs().format('YYYY-MM-DD') });
  const [events, setEvents] = useState([]);
  const [newDate, setNewDate] = useState(null);
  const [selected, setSelected] = useState(null);
  const canBook = ['admin', 'recepcionista'].includes(user.role);

  useEffect(() => {
    if (user.role !== 'profesional') employeesApi.list().then(setEmployees).catch(() => {});
  }, [user.role]);

  const load = useCallback(() => {
    appointmentsApi
      .calendar({ ...current, employeeId: employeeId || undefined })
      .then((r) => setEvents(r.events.map((e) => ({ ...e, backgroundColor: e.color, borderColor: e.color }))))
      .catch((e) => notifyError(errorMessage(e) || 'No se pudo cargar la agenda, inténtalo nuevamente'));
  }, [current, employeeId]);

  useEffect(load, [load]);

  return (
    <section>
      <div className="page-head">
        <h2>{user.role === 'profesional' ? 'Mi agenda' : 'Agenda'}</h2>
        <div className="filters">
          {user.role !== 'profesional' && (
            <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              <option value="">Todos los empleados</option>
              {employees.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
            </select>
          )}
          {canBook && <button className="btn" onClick={() => setNewDate(dayjs().add(1, 'day').toDate())}>+ Nueva cita</button>}
        </div>
      </div>
      <div className="legend">
        <span className="badge st-programada">Programada</span>
        <span className="badge st-confirmada">Confirmada</span>
        <span className="badge st-completada">Completada</span>
        <span className="badge st-cancelada">Cancelada</span>
        <span className="badge st-no_asistio">No asistió</span>
      </div>
      <div className="card">
        <FullCalendar
          ref={calRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          locale={esLocale}
          initialView="timeGridWeek"
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'timeGridDay,timeGridWeek,dayGridMonth' }}
          slotMinTime="07:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          height="auto"
          events={events}
          datesSet={(info) => {
            const view = VIEW_MAP[info.view.type];
            const date = dayjs(info.view.currentStart).format('YYYY-MM-DD');
            if (view !== current.view || date !== current.date) setCurrent({ view, date });
          }}
          dateClick={(info) => {
            if (!canBook) return;
            const pasado = info.allDay ? dayjs(info.date).isBefore(dayjs(), 'day') : isPast(info.date);
            if (pasado) {
              notifyError('No se puede reservar en una fecha u hora pasada');
              return;
            }
            setNewDate(info.allDay && dayjs(info.date).isSame(dayjs(), 'day') ? new Date() : info.date);
          }}
          eventClick={(info) => setSelected(info.event.id)}
        />
      </div>
      {newDate && (
        <AppointmentForm initialDate={newDate} onClose={() => setNewDate(null)} onSaved={() => { setNewDate(null); load(); }} />
      )}
      {selected && <AppointmentDetail id={selected} onClose={() => setSelected(null)} onChanged={load} />}
    </section>
  );
}
