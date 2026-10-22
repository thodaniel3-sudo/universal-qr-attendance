import React from 'react';

export const THEME = {
  bg: '#0f172a', // Deep Navy background
  card: '#1e293b', // Slightly lighter navy
  input: '#334155',
  primary: '#3b82f6', // Blue
  primaryHover: '#2563eb',
  success: '#10b981', // Green
  danger: '#ef4444', // Red
  text: '#f8fafc',
  textMuted: '#94a3b8',
  border: '#334155',
};

export function Button({ children, variant = 'primary', style, ...props }: any) {
  const base = {
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    fontSize: '1rem',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    ...style,
  };

  const variants: any = {
    primary: { background: THEME.primary, color: 'white', border: '1px solid transparent' },
    success: { background: THEME.success, color: 'white', border: '1px solid transparent' },
    danger: { background: THEME.danger, color: 'white', border: '1px solid transparent' },
    outline: { background: 'transparent', color: THEME.text, border: `1px solid ${THEME.border}` },
  };

  return (
    <button style={{ ...base, ...variants[variant] }} {...props}>
      {children}
    </button>
  );
}

export function Input({ label, ...props }: any) {
  return (
    <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
      <label style={{ display: 'block', marginBottom: '0.5rem', color: THEME.textMuted, fontSize: '0.875rem' }}>{label}</label>
      <input 
        style={{
          width: '100%',
          padding: '0.75rem',
          borderRadius: '0.5rem',
          border: `1px solid ${THEME.input}`,
          background: THEME.input,
          color: THEME.text,
          fontSize: '1rem',
          outline: 'none'
        }} 
        {...props} 
      />
    </div>
  );
}

export function Select({ label, children, ...props }: any) {
  return (
    <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
      <label style={{ display: 'block', marginBottom: '0.5rem', color: THEME.textMuted, fontSize: '0.875rem' }}>{label}</label>
      <select 
        style={{
          width: '100%',
          padding: '0.75rem',
          borderRadius: '0.5rem',
          border: `1px solid ${THEME.input}`,
          background: THEME.input,
          color: THEME.text,
          fontSize: '1rem',
          outline: 'none'
        }} 
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

export function Card({ children, style }: any) {
  return (
    <div style={{
      background: THEME.card,
      borderRadius: '1rem',
      padding: '2rem',
      boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
      border: `1px solid ${THEME.border}`,
      ...style
    }}>
      {children}
    </div>
  );
}

export function Badge({ children, type = 'success' }: any) {
  const colors: any = {
    success: { bg: 'rgba(16, 185, 129, 0.2)', text: '#34d399' },
    danger: { bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171' },
    warning: { bg: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24' },
  };
  return (
    <span style={{
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      background: colors[type].bg,
      color: colors[type].text,
    }}>
      {children}
    </span>
  );
}

export function PageContainer({ children, title, subtitle, action }: any) {
  return (
    <div style={{ minHeight: '100vh', background: THEME.bg, padding: '2rem', color: THEME.text }}>
      <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{title}</h1>
            {subtitle && <p style={{ color: THEME.textMuted, marginTop: '0.5rem' }}>{subtitle}</p>}
          </div>
          {action}
        </div>
        {children}
      </div>
    </div>
  );
}