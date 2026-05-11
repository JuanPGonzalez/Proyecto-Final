import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordInput(props) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
      <input
        {...props}
        type={showPassword ? 'text' : 'password'}
        style={{
          ...props.style,
          paddingRight: '40px', // Make room for the eye icon
        }}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        style={{
          position: 'absolute',
          right: '10px',
          background: 'none',
          border: 'none',
          color: 'var(--muted-foreground)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
          borderRadius: '4px',
          transition: 'color 0.2s, background-color 0.2s',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--foreground)';
          e.currentTarget.style.backgroundColor = 'var(--secondary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--muted-foreground)';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        onFocus={(e) => {
          e.currentTarget.style.color = 'var(--foreground)';
          e.currentTarget.style.outline = '2px solid var(--primary)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.color = 'var(--muted-foreground)';
          e.currentTarget.style.outline = 'none';
        }}
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
