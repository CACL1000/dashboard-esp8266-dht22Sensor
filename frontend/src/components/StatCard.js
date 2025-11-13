import React from 'react';

export default function StatCard({ title, value, unit, small, color = '#007bff' }) {
  return (
    <div style={{
      border: '1px solid #e6e6e6',
      padding: 20,
      borderRadius: 12,
      minWidth: 200,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      background: 'white',
      borderLeft: `4px solid ${color}`,
      transition: 'transform 0.2s, box-shadow 0.2s'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
    }}
    >
      <div style={{ fontSize:13, color:'#666', fontWeight:500, marginBottom:8 }}>
        {title}
      </div>
      <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
        <div style={{ fontSize:36, fontWeight:700, color: color }}>
          {value ?? '—'}
        </div>
        {unit && <div style={{ color:'#999', fontSize:18, fontWeight:500 }}>{unit}</div>}
      </div>
      {small && (
        <div style={{ fontSize:12, color:'#999', marginTop:8, lineHeight:1.4 }}>
          {small}
        </div>
      )}
    </div>
  );
}