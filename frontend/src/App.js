import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Header from './components/Header';
import StatCard from './components/StatCard';
import ChartMulti from './components/ChartMulti';
import DataTable from './components/DataTable';
import AlertBox from './components/AlertBox';

const BACKEND = 'http://localhost:5000';

function formatSupabaseData(raw) {
  return (raw || []).map(item => {
    const date = new Date(item.fecha_hora_local || item.fecha_hora);
    const timeLocal = date.toLocaleString('es-ES', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    }).replace(/\//g, '-').replace(',', '');

    return {
      time: timeLocal,
      temp: item.temperatura ? parseFloat(item.temperatura) : null,
      hum: item.humedad ? parseFloat(item.humedad) : null,
      entry_id: item.id
    };
  }).reverse();
}

function App() {
  const [supabaseData, setSupabaseData] = useState([]);
  const [stats, setStats] = useState({ avgTemp: null, avgHum: null });
  const [alerts, setAlerts] = useState([]);
  const [lastReading, setLastReading] = useState(null);
  const [results, setResults] = useState(50);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [dataSource, setDataSource] = useState('supabase'); // 'supabase' o 'thingspeak'

  const fetchSupabaseData = useCallback(async (limit = results) => {
    try {
      setLoading(true);
      
      // Obtener lecturas
      const resLecturas = await axios.get(`${BACKEND}/api/supabase/lecturas?limit=${limit}`);
      const formattedData = formatSupabaseData(resLecturas.data.data);
      setSupabaseData(formattedData);

      // Obtener estadísticas y alertas
      const resStats = await axios.get(`${BACKEND}/api/supabase/stats?limit=${limit}`);
      setStats({
        avgTemp: resStats.data.avgTemp,
        avgHum: resStats.data.avgHum
      });
      setAlerts(resStats.data.alerts || []);
      setLastReading(resStats.data.lastReading);

    } catch (err) {
      console.error('Error fetching Supabase data:', err);
      setAlerts([{
        type: 'error',
        severity: 'danger',
        message: 'Error al conectar con la base de datos'
      }]);
    } finally {
      setLoading(false);
    }
  }, [results]);

  useEffect(() => {
    if (dataSource === 'supabase') {
      fetchSupabaseData(results);
      let id = null;
      if (autoRefresh) {
        id = setInterval(() => fetchSupabaseData(results), 30000); // 30 segundos
      }
      return () => { if (id) clearInterval(id); };
    }
  }, [fetchSupabaseData, results, autoRefresh, dataSource]);

  // Separar datos en temperatura y humedad
  const tempData = supabaseData.map(d => ({ 
    time: d.time, 
    value: d.temp, 
    entry_id: d.entry_id 
  }));
  
  const humData = supabaseData.map(d => ({ 
    time: d.time, 
    value: d.hum, 
    entry_id: d.entry_id 
  }));

  return (
    <div style={{ fontFamily:'Inter, Arial', padding:20, maxWidth:1200, margin:'0 auto', background:'#f8f9fa', minHeight:'100vh' }}>
      <Header title="Dashboard ESP8266 + DHT22" subtitle="Monitor de Temperatura y Humedad" />

      {/* Alertas */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {alerts.map((alert, idx) => (
            <AlertBox key={idx} alert={alert} />
          ))}
        </div>
      )}

      {/* Tarjetas de estadísticas */}
      <div style={{ display:'flex', gap:16, marginBottom:20, flexWrap:'wrap' }}>
        <StatCard
          title="Temperatura actual"
          value={lastReading?.temperatura?.toFixed(1) ?? '—'}
          unit="°C"
          small={`Promedio (últimos ${results}): ${stats.avgTemp ?? '—'} °C`}
          color="#ff6b6b"
        />
        <StatCard
          title="Humedad actual"
          value={lastReading?.humedad?.toFixed(1) ?? '—'}
          unit="%"
          small={`Promedio (últimos ${results}): ${stats.avgHum ?? '—'} %`}
          color="#4ecdc4"
        />
        
        <div style={{ marginLeft:'auto', display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <label style={{ fontSize:13, color:'#666', fontWeight:500 }}>Auto-refresh</label>
            <input 
              type="checkbox" 
              checked={autoRefresh} 
              onChange={(e)=>setAutoRefresh(e.target.checked)}
              style={{ width:18, height:18, cursor:'pointer' }}
            />
          </div>
        </div>
      </div>

      {/* Controles */}
      <div style={{ 
        display:'flex', 
        gap:12, 
        alignItems:'center', 
        marginBottom:20,
        padding:16,
        background:'white',
        borderRadius:10,
        boxShadow:'0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <label style={{ fontWeight:500, color:'#333' }}>Mostrar últimos:</label>
        <select 
          value={results} 
          onChange={(e)=>setResults(Number(e.target.value))}
          style={{ 
            padding:'8px 12px', 
            borderRadius:6, 
            border:'1px solid #ddd',
            background:'white',
            cursor:'pointer'
          }}
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={200}>200</option>
        </select>
        
        <button 
          onClick={()=>fetchSupabaseData(results)} 
          style={{ 
            padding:'8px 16px',
            borderRadius:6,
            border:'none',
            background:'#007bff',
            color:'white',
            fontWeight:500,
            cursor:'pointer'
          }}
        >
          🔄 Actualizar
        </button>
        
        {loading && (
          <div style={{ marginLeft:12, color:'#666', fontSize:14 }}>
            <span>⏳ Cargando...</span>
          </div>
        )}
      </div>

      {/* Gráfico combinado */}
      <div style={{ marginBottom:20 }}>
        <h3 style={{ marginBottom:12, color:'#333' }}>📊 Gráfico de Temperatura y Humedad</h3>
        <ChartMulti data={supabaseData} />
      </div>

      {/* Tablas separadas */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
        <div>
          <h3 style={{ marginBottom:12, color:'#ff6b6b' }}>🌡️ Tabla de Temperatura</h3>
          <DataTable 
            data={tempData} 
            type="temperatura" 
            unit="°C"
          />
        </div>
        
        <div>
          <h3 style={{ marginBottom:12, color:'#4ecdc4' }}>💧 Tabla de Humedad</h3>
          <DataTable 
            data={humData} 
            type="humedad" 
            unit="%"
          />
        </div>
      </div>
    </div>
  );
}

export default App;