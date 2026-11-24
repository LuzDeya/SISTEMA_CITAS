import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import { useAuth, homeFor } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Agenda from './pages/Agenda.jsx';
import Citas from './pages/Citas.jsx';
import Clientes from './pages/Clientes.jsx';
import Empleados from './pages/Empleados.jsx';
import Servicios from './pages/Servicios.jsx';
import Usuarios from './pages/Usuarios.jsx';
import MisCitas from './pages/MisCitas.jsx';

const STAFF = ['admin', 'recepcionista'];

export default function App() {
  const { user } = useAuth();
  const guard = (roles, el) => <ProtectedRoute roles={roles}>{el}</ProtectedRoute>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={homeFor(user.role)} /> : <Login />} />
      <Route path="/registro" element={<Register />} />
      <Route element={guard(null, <Layout />)}>
        <Route path="/panel" element={guard(['admin'], <Dashboard />)} />
        <Route path="/agenda" element={guard(['admin', 'recepcionista', 'profesional'], <Agenda />)} />
        <Route path="/citas" element={guard(STAFF, <Citas />)} />
        <Route path="/clientes" element={guard(STAFF, <Clientes />)} />
        <Route path="/empleados" element={guard(['admin'], <Empleados />)} />
        <Route path="/servicios" element={guard(['admin'], <Servicios />)} />
        <Route path="/usuarios" element={guard(['admin'], <Usuarios />)} />
        <Route path="/mis-citas" element={guard(['cliente'], <MisCitas />)} />
      </Route>
      <Route path="*" element={<Navigate to={user ? homeFor(user.role) : '/login'} replace />} />
    </Routes>
  );
}
