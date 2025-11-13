import React from 'react';

function downloadCsv(filename, rows, type) {
  if (!rows || rows.length === 0) return;
  
  const csvRows = [
    ['Timestamp', type === 'temperatura' ? 'Temperatura (°C)' : 'Humedad (%)'].join(','),
    ...rows.map(r => [r.time, r.value ?? ''].join(','))
  ];
  
  const csv = csvRows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function DataTable({ data, type, unit }) {
  const getColorForValue = (value) => {
    if (value === null || value === undefined) return '#999';
    
    if (type === 'temperatura') {
      if (value < 15) return '#4a90e2'; // Azul para frío
      if (value > 30) return '#e24a4a'; // Rojo para calor
      return '#52c41a'; // Verde para normal
    } else {
      if (value < 30) return '#e2b44a'; // Amarillo para seco
      if (value > 70) return '#4a90e2'; // Azul para húmedo
      return '#52c41a'; // Verde para normal
    }
  };

  return (
    <div>
      <div style={{ 
        display:'flex', 
        justifyContent:'space-between', 
        alignItems:'center', 
        marginBottom:12 
      }}>
        <button 
          onClick={() => downloadCsv(`${type}.csv`, data, type)} 
          style={{ 
            padding:'8px 14px', 
            borderRadius:6, 
            border:'1px solid #ddd', 
            background:'white',
            cursor:'pointer',
            fontSize:13,
            fontWeight:500
          }}
        >
          📥 Descargar CSV
        </button>
      </div>

      <div style={{ 
        maxHeight: 400, 
        overflow: 'auto', 
        border: '1px solid #e6e6e6', 
        borderRadius:10,
        background:'white',
        boxShadow:'0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead style={{ 
            position:'sticky', 
            top:0, 
            background: type === 'temperatura' ? '#fff5f5' : '#f0f9ff',
            zIndex:10
          }}>
            <tr>
              <th style={{ 
                textAlign:'left', 
                padding:12, 
                borderBottom:'2px solid #e6e6e6',
                fontWeight:600,
                color:'#333'
              }}>
                Timestamp
              </th>
              <th style={{ 
                textAlign:'right', 
                padding:12, 
                borderBottom:'2px solid #e6e6e6',
                fontWeight:600,
                color:'#333'
              }}>
                {type === 'temperatura' ? 'Temperatura' : 'Humedad'} ({unit})
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, idx) => (
              <tr 
                key={d.entry_id || idx}
                style={{ 
                  background: idx % 2 === 0 ? 'white' : '#fafafa',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
                onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#fafafa'}
              >
                <td style={{ 
                  padding:10, 
                  borderBottom:'1px solid #f0f0f0',
                  fontSize:13,
                  color:'#555'
                }}>
                  {d.time}
                </td>
                <td style={{ 
                  padding:10, 
                  textAlign:'right', 
                  borderBottom:'1px solid #f0f0f0',
                  fontSize:15,
                  fontWeight:600,
                  color: getColorForValue(d.value)
                }}>
                  {d.value !== null && d.value !== undefined 
                    ? d.value.toFixed(1) 
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}