import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { errorMessage } from '../api/http';
import { notifyError, success } from '../utils/alerts';
import { isEmail, isStrongPassword, PASSWORD_MSG } from '../utils/validate';

// HU-01: registrar negocio (organización) con su administrador
export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ businessName: '', name: '', email: '', password: '' });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!isEmail(form.email)) return notifyError('Correo no válido');
    if (!isStrongPassword(form.password)) return notifyError(PASSWORD_MSG);
    try {
      await authApi.register(form);
      await success('Negocio registrado', 'Ya puedes iniciar sesión como administrador');
      navigate('/login');
    } catch (err) {
      notifyError(errorMessage(err));
    }
    return undefined;
  };

  return (
    <div className="auth">
      <form className="card form" onSubmit={submit}>
        <h1>Registrar negocio</h1>
        <label>Nombre del negocio<input value={form.businessName} onChange={set('businessName')} required /></label>
        <label>Nombre del administrador<input value={form.name} onChange={set('name')} required /></label>
        <label>Correo<input type="email" value={form.email} onChange={set('email')} required /></label>
        <label>
          Contraseña
          <input type="password" value={form.password} onChange={set('password')} required />
          <small className="muted">{PASSWORD_MSG}</small>
        </label>
        <button className="btn">Registrar</button>
        <p className="muted center"><Link to="/login">Volver a iniciar sesión</Link></p>
      </form>
    </div>
  );
}
