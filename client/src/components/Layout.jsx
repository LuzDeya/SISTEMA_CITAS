import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLE_LABEL } from '../utils/format';

// Menú según el rol (RBAC en la interfaz; el servidor (server) vuelve a validar cada permiso)
const MENU = [
  { to: '/panel', label: 'Panel', roles: ['admin'] },
  { to: '/agenda', label: 'Agenda', roles: ['admin', 'recepcionista', 'profesional'] },
  { to: '/citas', label: 'Citas', roles: ['admin', 'recepcionista'] },
  { to: '/clientes', label: 'Clientes', roles: ['admin', 'recepcionista'] },
  { to: '/empleados', label: 'Empleados', roles: ['admin'] },
  { to: '/servicios', label: 'Servicios', roles: ['admin'] },
  { to: '/usuarios', label: 'Usuarios', roles: ['admin'] },
  { to: '/mis-citas', label: 'Mis citas', roles: ['cliente'] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">CitaFácil<span>Citas médicas</span></div>
        <nav>
          {MENU.filter((m) => m.roles.includes(user.role)).map((m) => (
            <NavLink key={m.to} to={m.to} className={({ isActive }) => (isActive ? 'active' : '')}>
              {m.label}
            </NavLink>
          ))}
        </nav>
        <div className="me">
          <strong>{user.name}</strong>
          <small>{ROLE_LABEL[user.role]}</small>
          <button
            className="btn ghost"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
