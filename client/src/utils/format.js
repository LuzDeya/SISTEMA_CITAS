import dayjs from 'dayjs';

export const fmtDate = (d) => dayjs(d).format('DD/MM/YYYY');
export const fmtTime = (d) => dayjs(d).format('HH:mm');
export const fmtDateTime = (d) => dayjs(d).format('DD/MM/YYYY HH:mm');
export const money = (n) => `S/ ${Number(n || 0).toFixed(2)}`;
export const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const STATUS_LABEL = {
  programada: 'Programada',
  confirmada: 'Confirmada',
  completada: 'Completada',
  cancelada: 'Cancelada',
  no_asistio: 'No asistió',
};
export const ROLE_LABEL = { admin: 'Administrador', recepcionista: 'Recepcionista', profesional: 'Profesional', cliente: 'Cliente' };
