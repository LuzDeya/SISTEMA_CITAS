import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, homeFor } from '../context/AuthContext.jsx';
import { errorMessage } from '../api/http';
import { notifyError } from '../utils/alerts';

// HU-02: iniciar sesión
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(form.email, form.password);
      navigate(homeFor(u.role));
    } catch (err) {
      notifyError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <form className="card form" onSubmit={submit}>
        <h1>CitaFácil</h1>
        <p className="muted">Reserva de citas médicas · Ingresa con tu cuenta</p>
        <label>
          Correo
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </label>
        <label>
          Contraseña
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </label>
        <button className="btn" disabled={loading}>{loading ? 'Ingresando…' : 'Iniciar sesión'}</button>
        <p className="muted center">¿Tienes un negocio? <Link to="/registro">Regístralo aquí</Link></p>
      </form>
    </div>
  );
}
