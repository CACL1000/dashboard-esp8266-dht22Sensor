
import React from 'react';

export default function Header({ title, subtitle }) {
  return (
    <header style={{
      display:'flex', justifyContent:'space-between', alignItems:'center',
      marginBottom: 20
    }}>
      <div>
        <h1 style={{ margin:0 }}>{title}</h1>
        {subtitle && <div style={{ color:'#666', fontSize:14 }}>{subtitle}</div>}
      </div>
      <div style={{ fontSize:12, color:'#888' }}>
        <div>Canal: <strong>myesp_dht_channel</strong></div>
      </div>
    </header>
  );
}
