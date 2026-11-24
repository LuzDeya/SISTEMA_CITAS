import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

export const notifyOk = (msg) => toast.success(msg);
export const notifyError = (msg) => toast.error(msg);

export async function confirm(title, text, confirmButtonText = 'Sí, continuar') {
  const r = await Swal.fire({
    title, text, icon: 'question', showCancelButton: true, confirmButtonText, cancelButtonText: 'Volver',
    confirmButtonColor: '#0f4c5c',
  });
  return r.isConfirmed;
}

export async function askReason() {
  const r = await Swal.fire({
    title: 'Cancelar cita',
    input: 'text',
    inputLabel: 'Motivo de la cancelación',
    inputPlaceholder: 'Ej. Viaje imprevisto',
    showCancelButton: true,
    confirmButtonText: 'Cancelar cita',
    cancelButtonText: 'Volver',
    confirmButtonColor: '#c2410c',
    inputValidator: (v) => (!v || !v.trim() ? 'El motivo es obligatorio' : undefined),
  });
  return r.isConfirmed ? r.value.trim() : null;
}

export const success = (title, text) => Swal.fire({ title, text, icon: 'success', confirmButtonColor: '#0f4c5c' });
