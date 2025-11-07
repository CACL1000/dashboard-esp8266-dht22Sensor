// src/App.js
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Header from './components/Header';
import StatCard from './components/StatCard';
import ChartMulti from './components/ChartMulti';
import DataTable from './components/DataTable';

const BACKEND = 'http://localhost:5000';

function formatFeeds(raw) {
  const mapped = (raw || []).map(f => ({
    time: (f.created_at || '').replace('T', ' ').replace('Z',''),
    temp: f.field1 ? parseFloat(f.field1) : null,
    hum: f.field2 ? parseFloat(f.field2) : null,
    entry_id: f.entry_id
  }));
  return mapped.reverse(); // oldest -> newest
}

function calcStats(latest, feeds) {
  const lastTemp = latest?.field1 ? parseFloat(latest.field1) : null;
  const lastHum = latest?.field2 ? parseFloat(latest.field2) : null;
  const avgTemp = feeds.length ? (feeds.reduce((s, f) => s + (f.temp ?? 0), 0)/feeds.length).toFixed(2) : null;
  const avgHum = feeds.length ? (feeds.reduce((s, f) => s + (f.hum ?? 0), 0)/feeds.length).toFixed(2) : null;
  return { lastTemp, lastHum, avgTemp, avgHum };
}

function App() {
  const [last, setLast] = useState(null);
  const [feeds, setFeeds] = useState([]);
  const [results, setResults] = useState(50);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchAll = useCallback(async (n = results) => {
    try {
      setLoading(true);
      const [resLast, resFeeds] = await Promise.all([
        axios.get(`${BACKEND}/api/last`),
        axios.get(`${BACKEND}/api/feeds?results=${n}`)
      ]);
      setLast(resLast.data.last);
      setFeeds(formatFeeds(resFeeds.data.feeds || []));
    } catch (err) {
      console.error('fetchAll error', err);
    } finally {
      setLoading(false);
    }
  }, [results]);

  useEffect(() => {
    fetchAll(results);
    let id = null;
    if (autoRefresh) id = setInterval(() => fetchAll(results), 30000);
    return () => { if (id) clearInterval(id); };
  }, [fetchAll, results, autoRefresh]);

  const stats = calcStats(last, feeds);

  return (
    <div style={{ fontFamily:'Inter, Arial', padding:20, maxWidth:1100, margin:'0 auto' }}>
      <Header title="ESP Dashboard" subtitle="Temperatura y Humedad — myesp_dht_channel" />

      <div style={{ display:'flex', gap:12, marginBottom:16 }}>
        <StatCard title="Temperatura actual" value={stats.lastHum ?? last?.field2 ?? '—'} unit="°C" small={`Promedio últimos ${results}: ${stats.avgHum ?? '—'} %`} />
        <StatCard title="Humedad actual" value={stats.lastTemp ?? last?.field1 ?? '—'} unit="%" small={`Promedio últimos ${results}: ${stats.avgTemp ?? '—'} °C`} />
        
        <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
          <label style={{ fontSize:13, color:'#666' }}>Auto-refresh</label>
          <input type="checkbox" checked={autoRefresh} onChange={(e)=>setAutoRefresh(e.target.checked)} />
        </div>
      </div>

      <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:12 }}>
        <label>Mostrar últimos:</label>
        <select value={results} onChange={(e)=>setResults(Number(e.target.value))}>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <button onClick={()=>fetchAll(results)} style={{ marginLeft:8, padding:'6px 10px' }}>Actualizar</button>
        {loading && <div style={{ marginLeft:12, color:'#666' }}>Cargando...</div>}
      </div>

      <ChartMulti data={feeds} />

      <DataTable data={feeds} />
    </div>
  );
}

export default App;




