import Swal from 'sweetalert2';

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

export const showAlert = (title, content, icon = 'info', options = {}) => {
  const isHtml = content.trim().startsWith('<');
  return Swal.fire({
    title,
    [isHtml ? 'html' : 'text']: content,
    icon,
    confirmButtonColor: 'var(--primary)',
    background: 'var(--card)',
    color: 'var(--foreground)',
    ...options
  });
};

export const showToast = (title, icon = 'success') => {
  return Toast.fire({
    icon,
    title
  });
};

export const showConfirm = (title, text, confirmButtonText = 'Sí, continuar') => {
  return Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: 'var(--primary)',
    cancelButtonColor: 'var(--destructive)',
    confirmButtonText,
    cancelButtonText: 'Cancelar',
    background: 'var(--card)',
    color: 'var(--foreground)'
  });
};

export default Swal;
