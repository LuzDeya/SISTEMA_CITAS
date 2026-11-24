import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { dashboardApi } from '../api';
import { errorMessage } from '../api/http';
import { notifyError } from '../utils/alerts';

// HU-16: panel de control con indicadores
export default function Dashboard() {
  const [range, setRange] = useState({
    from: dayjs().startOf('month').format('YYYY-MM-DD'),
    to: dayjs().endOf('month').format('YYYY-MM-DD'),
  });
  const [data, setData] = useState(null);

  useEffect(() => {
    dashboardApi.get(range).then(setData).catch((e) => notifyError(errorMessage(e)));
  }, [range]);

  const empty = data && data.totalProgramadas === 0 && data.totalCanceladas === 0;

  return (
    <section>
      <div className="page-head">
        <h2>Panel de control</h2>
        <div className="filters">
          <label>Desde<input type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} /></label>
          <label>Hasta<input type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} /></label>
        </div>
      </div>
      {data && (
        <>
          <div className="kpis">
            <div className="kpi"><span>Citas programadas</span><strong>{data.totalProgramadas}</strong></div>
            <div className="kpi"><span>Completadas</span><strong>{data.totalCompletadas}</strong></div>
            <div className="kpi"><span>Canceladas</span><strong>{data.totalCanceladas}</strong></div>
            <div className="kpi"><span>No asistió</span><strong>{data.totalNoAsistio}</strong></div>
          </div>
          {empty && <p className="muted">Aún no hay datos suficientes para este periodo.</p>}
          <div className="grid2">
            <div className="card">
              <h3>Servicios más solicitados</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.serviciosMasSolicitados} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={130} />
                  <Tooltip />
                  <Bar dataKey="total" name="Citas" fill="#0f4c5c" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h3>Clientes frecuentes</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.clientesFrecuentes} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={130} />
                  <Tooltip />
                  <Bar dataKey="total" name="Citas" fill="#e9a23b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
