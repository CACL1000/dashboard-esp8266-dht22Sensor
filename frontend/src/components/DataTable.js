// src/components/DataTable.js
import React from 'react';

function downloadCsv(filename, rows) {
  if (!rows || rows.length === 0) return;
  const header = Object.keys(rows[0]);
  const csv = [
    header.join(','),
    ...rows.map(r => header.map(h => JSON.stringify(r[h] ?? '')).join(','))
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function DataTable({ data }) {
  // data expected: [{ time, temp, hum, entry_id }]
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <h3 style={{ margin:0 }}>Tabla de lecturas</h3>
        <div>
          <button onClick={() => downloadCsv('lecturas.csv', data)} style={{ padding:'6px 10px', borderRadius:6, border:'1px solid #ddd', background:'#fff' }}>
            Descargar CSV
          </button>
        </div>
      </div>

      <div style={{ maxHeight: 240, overflow: 'auto', border: '1px solid #eee', borderRadius:8 }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead style={{ position:'sticky', top:0, background:'#fafafa' }}>
            <tr>
              <th style={{ textAlign:'left', padding:8, borderBottom:'1px solid #f0f0f0' }}>Entry</th>
              <th style={{ textAlign:'left', padding:8, borderBottom:'1px solid #f0f0f0' }}>Timestamp</th>
              <th style={{ textAlign:'right', padding:8, borderBottom:'1px solid #f0f0f0' }}>Temperatura (°C)</th>
              <th style={{ textAlign:'right', padding:8, borderBottom:'1px solid #f0f0f0' }}>Humedad (%)</th>
              
            </tr>
          </thead>
          <tbody>
            {data.map(d => (
              <tr key={d.entry_id}>
                <td style={{ padding:8, borderBottom:'1px solid #f7f7f7' }}>{d.entry_id}</td>
                <td style={{ padding:8, borderBottom:'1px solid #f7f7f7' }}>{d.time}</td>
                <td style={{ padding:8, textAlign:'right', borderBottom:'1px solid #f7f7f7' }}>{d.temp ?? '—'}</td>
                <td style={{ padding:8, textAlign:'right', borderBottom:'1px solid #f7f7f7' }}>{d.hum ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
