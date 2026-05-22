import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Lock, Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import '../index.css';

export default function ResetPassword() {
  const { id, token } = useParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Validation rules
  const validations = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    match: password === confirmPassword && password.length > 0
  };

  const isFormValid = Object.values(validations).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormValid) {
      Swal.fire({
        icon: 'warning',
        title: 'Contraseña inválida',
        text: 'Por favor, asegúrate de que tu nueva contraseña cumpla con todos los requisitos de seguridad.',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post('http://localhost:5000/api/auth/reset-password', {
        id,
        token,
        newPassword: password
      });
      
      Swal.fire({
        icon: 'success',
        title: 'Contraseña actualizada',
        text: res.data.message || 'Tu contraseña ha sido restablecida exitosamente.',
        confirmButtonColor: '#3b82f6'
      }).then(() => {
        navigate('/login');
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'El enlace es inválido o ha expirado. Por favor, solicita uno nuevo.',
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setLoading(false);
    }
  };

  const ValidationItem = ({ isValid, text }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isValid ? '#16a34a' : 'var(--muted-foreground)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
      {isValid ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
      <span>{text}</span>
    </div>
  );

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 140px)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '500px', width: '100%', backgroundColor: 'var(--card)', padding: '2.5rem', borderRadius: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid var(--border)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '0.5rem' }}>
            Crear Nueva Contraseña
          </h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.95rem' }}>
            Ingresa tu nueva contraseña a continuación.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* New Password */}
          <div>
            <label htmlFor="password" style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: 'var(--foreground)', marginBottom: '0.5rem' }}>
              Nueva Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }}>
                <Lock size={18} />
              </span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                style={{
                  width: '100%',
                  padding: '0.75rem 2.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: 'var(--foreground)', marginBottom: '0.5rem' }}>
              Confirmar Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }}>
                <Lock size={18} />
              </span>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="********"
                style={{
                  width: '100%',
                  padding: '0.75rem 2.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Validation Rules */}
          <div style={{ backgroundColor: 'var(--background)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--foreground)', marginBottom: '0.5rem', marginTop: 0 }}>Requisitos de seguridad:</h4>
            <ValidationItem isValid={validations.length} text="Mínimo 8 caracteres" />
            <ValidationItem isValid={validations.uppercase} text="Al menos una letra mayúscula" />
            <ValidationItem isValid={validations.number} text="Al menos un número" />
            <ValidationItem isValid={validations.special} text="Al menos un carácter especial (!@#$%^&*)" />
            <ValidationItem isValid={validations.match} text="Las contraseñas coinciden" />
          </div>

          <button
            type="submit"
            disabled={loading || !isFormValid}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: (loading || !isFormValid) ? '#93c5fd' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: '600',
              fontSize: '1rem',
              cursor: (loading || !isFormValid) ? 'not-allowed' : 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.2s',
              marginTop: '0.5rem'
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Procesando...
              </>
            ) : (
              'Guardar Nueva Contraseña'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
