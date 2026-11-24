import { useEffect, useState } from 'react';
import { appointmentsApi, clientsApi, employeesApi, servicesApi } from '../api';
import { errorMessage } from '../api/http';
import { notifyError } from '../utils/alerts';
import { fmtDate, fmtTime, money } from '../utils/format';
import StatusBadge from '../components/StatusBadge.jsx';
import AppointmentForm from '../components/AppointmentForm.jsx';
import AppointmentDetail from './AppointmentDetail.jsx';

const EMPTY = { clientId: '', employeeId: '', serviceId: '', from: '', to: '' };

// HU-15: buscar y filtrar citas · HU-10: registrar
export default function Citas() {
  const [filters, setFilters] = useState(EMPTY);
  const [list, setList] = useState([]);
  const [opts, setOpts] = useState({ clients: [], employees: [], services: [] });
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    Promise.all([clientsApi.list(), employeesApi.list({ all: true }), servicesApi.list({ all: true })])
      .then(([clients, employees, services]) => setOpts({ clients, employees, services }))
      .catch((e) => notifyError(errorMessage(e)));
  }, []);

  const search = (f = filters) => {
    const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v));
    if (params.from && params.to && params.to < params.from) {
      notifyError('La fecha final no puede ser anterior a la inicial');
      return;
    }
    appointmentsApi.search(params).then(setList).catch((e) => notifyError(errorMessage(e)));
  };
  useEffect(() => { search(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });
  const sel = (k, items, label) => (
    <select value={filters[k]} onChange={set(k)}>
      <option value="">{label}</option>
      {items.map((x) => <option key={x._id} value={x._id}>{x.name}</option>)}
    </select>
  );

  return (
    <section>
      <div className="page-head">
        <h2>Citas</h2>
        <button className="btn" onClick={() => setCreating(true)}>+ Nueva cita</button>
      </div>
      <div className="card filters wrap">
        {sel('clientId', opts.clients, 'Todos los clientes')}
        {sel('employeeId', opts.employees, 'Todos los empleados')}
        {sel('serviceId', opts.services, 'Todos los servicios')}
        <label>Desde<input type="date" value={filters.from} onChange={set('from')} /></label>
        <label>Hasta<input type="date" value={filters.to} onChange={set('to')} /></label>
        <button className="btn" onClick={() => search()}>Buscar</button>
        <button className="btn ghost" onClick={() => { setFilters(EMPTY); search(EMPTY); }}>Limpiar</button>
      </div>
      <div className="card">
        {list.length === 0 ? (
          <p className="muted">No se encontraron citas con los criterios seleccionados.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Fecha</th><th>Hora</th><th>Cliente</th><th>Servicio</th><th>Empleado</th><th>Costo</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {list.map((a) => (
                <tr key={a._id} className="click" onClick={() => setSelected(a._id)}>
                  <td>{fmtDate(a.startAt)}</td>
                  <td>{fmtTime(a.startAt)}–{fmtTime(a.endAt)}</td>
                  <td>{a.clientName}</td>
                  <td>{a.serviceName}</td>
                  <td>{a.employeeName}</td>
                  <td>{money(a.price)}</td>
                  <td><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {creating && <AppointmentForm onClose={() => setCreating(false)} onSaved={() => { setCreating(false); search(); }} />}
      {selected && <AppointmentDetail id={selected} onClose={() => setSelected(null)} onChanged={() => search()} />}
    </section>
  );
}
