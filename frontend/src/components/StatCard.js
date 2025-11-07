// src/components/StatCard.js
import React from 'react';

export default function StatCard({ title, value, unit, small }) {
  return (
    <div style={{
      border: '1px solid #e6e6e6',
      padding: 16,
      borderRadius: 10,
      minWidth: 160,
      boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
      background: '#fff'
    }}>
      <div style={{ fontSize:12, color:'#666' }}>{title}</div>
      <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
        <div style={{ fontSize:28, fontWeight:600 }}>{value ?? '—'}</div>
        {unit && <div style={{ color:'#666' }}>{unit}</div>}
      </div>
      {small && <div style={{ fontSize:12, color:'#999', marginTop:6 }}>{small}</div>}
    </div>
  );
}
