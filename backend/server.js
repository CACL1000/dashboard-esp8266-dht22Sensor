require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const CHANNEL_ID = process.env.THINGSPEAK_CHANNEL_ID;
const READ_KEY = process.env.THINGSPEAK_READ_KEY;

// Configuración de Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mwuazfgptsqoxcnbzosf.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dWF6ZmdwdHNxb3hjbmJ6b3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNjg5NjEsImV4cCI6MjA3Nzg0NDk2MX0.mnE762xpz5RJMFNrUpc-M51M8LpoENW8bESOwWZJPo4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Ruta para obtener feeds desde ThingSpeak (proxy)
app.get('/api/feeds', async (req, res) => {
  try {
    const results = req.query.results || 10;
    const url = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?api_key=${READ_KEY}&results=${results}`;
    const response = await axios.get(url, { timeout: 8000 });
    return res.json(response.data);
  } catch (err) {
    console.error('Error fetching ThingSpeak:', err.message || err);
    return res.status(500).json({ error: 'No se pudo obtener datos de ThingSpeak', details: err.message });
  }
});

// Ruta para obtener último valor simplificado
app.get('/api/last', async (req, res) => {
  try {
    const url = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?api_key=${READ_KEY}&results=1`;
    const response = await axios.get(url, { timeout: 8000 });
    const feed = response.data.feeds && response.data.feeds[0];
    return res.json({ last: feed || null });
  } catch (err) {
    console.error('Error fetching ThingSpeak last:', err.message || err);
    return res.status(500).json({ error: 'No se pudo obtener el último dato', details: err.message });
  }
});

// Ruta para obtener datos desde Supabase
app.get('/api/supabase/lecturas', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    const { data, error } = await supabase
      .from('lecturas')
      .select('*')
      .order('fecha_hora', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return res.json({ data: data || [] });
  } catch (err) {
    console.error('Error fetching Supabase:', err.message || err);
    return res.status(500).json({ error: 'No se pudo obtener datos de Supabase', details: err.message });
  }
});

// Ruta para calcular temperatura promedio y obtener alertas
app.get('/api/supabase/stats', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    
    const { data, error } = await supabase
      .from('lecturas')
      .select('temperatura, humedad')
      .order('fecha_hora', { ascending: false })
      .limit(limit);

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.json({ 
        avgTemp: null, 
        avgHum: null, 
        alerts: [] 
      });
    }

    // Calcular promedios
    const temps = data.map(d => d.temperatura).filter(t => t !== null);
    const hums = data.map(d => d.humedad).filter(h => h !== null);
    
    const avgTemp = temps.length > 0 
      ? temps.reduce((a, b) => a + b, 0) / temps.length 
      : null;
    
    const avgHum = hums.length > 0 
      ? hums.reduce((a, b) => a + b, 0) / hums.length 
      : null;

    // Obtener última lectura para alertas
    const { data: lastReading } = await supabase
      .from('lecturas')
      .select('temperatura, humedad, fecha_hora')
      .order('fecha_hora', { ascending: false })
      .limit(1)
      .single();

    // Definir rangos de alerta (puedes ajustar estos valores)
    const TEMP_MIN = 15; // °C
    const TEMP_MAX = 30; // °C
    const HUM_MIN = 30;  // %
    const HUM_MAX = 70;  // %

    const alerts = [];
    
    if (lastReading && lastReading.temperatura !== null) {
      if (lastReading.temperatura < TEMP_MIN) {
        alerts.push({
          type: 'temperature',
          severity: 'warning',
          message: `Temperatura baja: ${lastReading.temperatura.toFixed(1)}°C (Promedio: ${avgTemp?.toFixed(1)}°C)`
        });
      } else if (lastReading.temperatura > TEMP_MAX) {
        alerts.push({
          type: 'temperature',
          severity: 'danger',
          message: `Temperatura alta: ${lastReading.temperatura.toFixed(1)}°C (Promedio: ${avgTemp?.toFixed(1)}°C)`
        });
      }
    }

    if (lastReading && lastReading.humedad !== null) {
      if (lastReading.humedad < HUM_MIN) {
        alerts.push({
          type: 'humidity',
          severity: 'warning',
          message: `Humedad baja: ${lastReading.humedad.toFixed(1)}% (Promedio: ${avgHum?.toFixed(1)}%)`
        });
      } else if (lastReading.humedad > HUM_MAX) {
        alerts.push({
          type: 'humidity',
          severity: 'info',
          message: `Humedad alta: ${lastReading.humedad.toFixed(1)}% (Promedio: ${avgHum?.toFixed(1)}%)`
        });
      }
    }

    return res.json({ 
      avgTemp: avgTemp?.toFixed(2), 
      avgHum: avgHum?.toFixed(2), 
      alerts,
      lastReading
    });
  } catch (err) {
    console.error('Error fetching stats:', err.message || err);
    return res.status(500).json({ error: 'No se pudo obtener estadísticas', details: err.message });
  }
});

app.listen(PORT, () => console.log(`Backend escuchando en http://localhost:${PORT}`));