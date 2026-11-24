import axios from 'axios';

const http = axios.create({ baseURL: '/api' });

// Envía el JWT en cada petición
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el token expiró o es inválido, se cierra la sesión
http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401 && !err.config.url.includes('/auth/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

/** Mensaje de error tal como lo devuelve la API ({ message }) */
export const errorMessage = (err) => {
  if (err && err.response && err.response.data && err.response.data.message) return err.response.data.message;
  // Sin respuesta o respuesta que no es JSON: el servidor (carpeta server) no está corriendo o no llega a MongoDB
  if (!err || !err.response || err.response.status >= 500) {
    return 'No hay conexión con el servidor. Revisa que "npm run dev" esté corriendo en la carpeta server y que MongoDB esté iniciado.';
  }
  return 'No se pudo completar la operación';
};

export default http;
