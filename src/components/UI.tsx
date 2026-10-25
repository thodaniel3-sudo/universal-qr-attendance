import React, { useState } from 'react';

export const THEME = {
  bg: '#0b1121', // Deepest background
  card: '#0f172a', // Card background
  input: '#1e293b', // Input fields
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  success: '#10b981',
  danger: '#ef4444',
  text: '#f8fafc',
  textMuted: '#94a3b8',
  border: '#1e293b',
};

// 1. PROFESSIONAL BUTTON
export function Button({ children, variant = 'primary', style, className = '', ...props }: any) {
  const base = {
    padding: '0.65rem 1.25rem',
    borderRadius: '0.5rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease-in-out',
    fontSize: '0.95rem',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    border: '1px solid transparent',
    fontFamily: 'inherit',
    ...style,
  };

  const variants: any = {
    primary: { background: THEME.primary, color: 'white', borderColor: THEME.primary },
    success: { background: THEME.success, color: 'white', borderColor: THEME.success },
    danger: { background: THEME.danger, color: 'white', borderColor: THEME.danger },
    outline: { background: 'transparent', color: THEME.text, borderColor: THEME.border },
  };

  return (
    <button 
      className={`hover:opacity-90 hover:translate-y-[-1px] active:translate-y-[0px] ${className}`}
      style={{ ...base, ...variants[variant] }} 
      {...props}
    >
      {children}
    </button>
  );
}

// 2. ELEGANT INPUT
export function Input({ label, ...props }: any) {
  return (
    <div style={{ marginBottom: '1.25rem', textAlign: 'left' }}>
      <label style={{ display: 'block', marginBottom: '0.4rem', color: THEME.textMuted, fontSize: '0.85rem', fontWeight: 500 }}>
        {label}
      </label>
      <input 
        style={{
          width: '100%',
          padding: '0.7rem 1rem',
          borderRadius: '0.5rem',
          border: `1px solid ${THEME.border}`,
          background: THEME.input,
          color: THEME.text,
          fontSize: '0.95rem',
          outline: 'none',
          transition: 'border-color 0.15s',
          fontFamily: 'inherit',
        }} 
        onFocus={(e) => e.target.style.borderColor = THEME.primary}
        onBlur={(e) => e.target.style.borderColor = THEME.border}
        {...props} 
      />
    </div>
  );
}

// 3. CLEAN SELECT
export function Select({ label, children, ...props }: any) {
  return (
    <div style={{ marginBottom: '1.25rem', textAlign: 'left' }}>
      <label style={{ display: 'block', marginBottom: '0.4rem', color: THEME.textMuted, fontSize: '0.85rem', fontWeight: 500 }}>
        {label}
      </label>
      <select 
        style={{
          width: '100%',
          padding: '0.7rem 1rem',
          borderRadius: '0.5rem',
          border: `1px solid ${THEME.border}`,
          background: THEME.input,
          color: THEME.text,
          fontSize: '0.95rem',
          outline: 'none',
          fontFamily: 'inherit',
          appearance: 'none', // Removes default ugly arrow
        }} 
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

// 4. SOPHISTICATED CARD (with hover state)
export function Card({ children, style, className = '' }: any) {
  return (
    <div 
      className={`transition-all duration-200 ${className}`}
      style={{
        background: THEME.card,
        borderRadius: '0.75rem',
        padding: '1.75rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: `1px solid ${THEME.border}`,
        ...style
      }}
    >
      {children}
    </div>
  );
}

// 5. PILL BADGE
export function Badge({ children, type = 'success' }: any) {
  const colors: any = {
    success: { bg: 'rgba(16, 185, 129, 0.1)', text: '#34d399', border: '1px solid rgba(16, 185, 129, 0.2)' },
    danger: { bg: 'rgba(239, 68, 68, 0.1)', text: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)' },
    warning: { bg: 'rgba(245, 158, 11, 0.1)', text: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.2)' },
  };
  return (
    <span style={{
      padding: '0.15rem 0.6rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      letterSpacing: '0.025em',
      background: colors[type].bg,
      color: colors[type].text,
      border: colors[type].border,
    }}>
      {children}
    </span>
  );
}

// 6. REFINED PAGE LAYOUT
export function PageContainer({ children, title, subtitle, action }: any) {
  return (
    <div style={{ minHeight: '100vh', background: THEME.bg, padding: '2rem 1.5rem', color: THEME.text }}>
      <div style={{ maxWidth: '68rem', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: `1px solid ${THEME.border}` }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, letterSpacing: '-0.025em' }}>{title}</h1>
            {subtitle && <p style={{ color: THEME.textMuted, marginTop: '0.4rem', fontSize: '0.95rem' }}>{subtitle}</p>}
          </div>
          {action}
        </div>
        {children}
      </div>
    </div>
  );
}