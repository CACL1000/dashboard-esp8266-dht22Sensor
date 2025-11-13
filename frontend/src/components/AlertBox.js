import React from 'react';

export default function AlertBox({ alert }) {
  const severityColors = {
    danger: { bg: '#fee', border: '#f66', icon: '🚨', color: '#c00' },
    warning: { bg: '#fff3cd', border: '#ffc107', icon: '⚠️', color: '#856404' },
    info: { bg: '#e7f3ff', border: '#4ecdc4', icon: 'ℹ️', color: '#0c5460' },
    error: { bg: '#fee', border: '#dc3545', icon: '❌', color: '#721c24' }
  };

  const style = severityColors[alert.severity] || severityColors.info;

  return (
    <div style={{
      background: style.bg,
      border: `2px solid ${style.border}`,
      borderRadius: 10,
      padding: 16,
      marginBottom: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      animation: 'slideIn 0.3s ease-out'
    }}>
      <span style={{ fontSize: 24 }}>{style.icon}</span>
      <div style={{ flex: 1 }}>
        <strong style={{ color: style.color, fontSize: 16 }}>
          {alert.severity === 'danger' ? 'ALERTA CRÍTICA' : 
           alert.severity === 'warning' ? 'ADVERTENCIA' : 
           'INFORMACIÓN'}
        </strong>
        <div style={{ color: style.color, marginTop: 4 }}>
          {alert.message}
        </div>
      </div>
    </div>
  );
}