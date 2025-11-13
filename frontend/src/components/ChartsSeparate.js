import React from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ReferenceLine, Area, AreaChart
} from 'recharts';

// Rangos de alerta
const TEMP_MIN = 15;
const TEMP_MAX = 30;
const HUM_MIN = 30;
const HUM_MAX = 70;

// Componente de Tooltip personalizado
const CustomTooltip = ({ active, payload, label, type }) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    let status = 'Normal';
    let color = '#52c41a';
    
    if (type === 'temperatura') {
      if (value < TEMP_MIN) {
        status = 'Baja';
        color = '#4a90e2';
      } else if (value > TEMP_MAX) {
        status = 'Alta';
        color = '#e24a4a';
      }
    } else {
      if (value < HUM_MIN) {
        status = 'Baja';
        color = '#e2b44a';
      } else if (value > HUM_MAX) {
        status = 'Alta';
        color = '#4a90e2';
      }
    }
    
    return (
      <div style={{
        background: 'white',
        border: `2px solid ${color}`,
        borderRadius: 8,
        padding: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        <p style={{ margin: 0, fontSize: 12, color: '#666' }}>{label}</p>
        <p style={{ margin: '4px 0 0 0', fontSize: 14, fontWeight: 600, color }}>
          {value?.toFixed(1)} {type === 'temperatura' ? '°C' : '%'} - {status}
        </p>
      </div>
    );
  }
  return null;
};

// Componente de gráfico de temperatura
export function TemperatureChart({ data }) {
  // Preparar datos con segmentos de color
  const processedData = data.map(d => {
    let color = '#52c41a'; // Verde (normal)
    if (d.temp < TEMP_MIN) {
      color = '#4a90e2'; // Azul (frío)
    } else if (d.temp > TEMP_MAX) {
      color = '#e24a4a'; // Rojo (calor)
    }
    return { ...d, color, value: d.temp };
  });

  return (
    <div style={{ 
      width: '100%', 
      height: 360, 
      border: '1px solid #eee', 
      padding: 16, 
      borderRadius: 10,
      background: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <ResponsiveContainer>
        <AreaChart data={processedData}>
          <defs>
            <linearGradient id="colorTempNormal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#52c41a" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#52c41a" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorTempCold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4a90e2" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#4a90e2" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorTempHot" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#e24a4a" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#e24a4a" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 11 }}
            minTickGap={30}
          />
          <YAxis 
            tick={{ fontSize: 11 }}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip type="temperatura" />} />
          <Legend />
          
          {/* Líneas de referencia para los rangos */}
          <ReferenceLine 
            y={TEMP_MIN} 
            stroke="#4a90e2" 
            strokeDasharray="3 3" 
            label={{ value: `Mín ${TEMP_MIN}°C`, position: 'left', fontSize: 10 }}
          />
          <ReferenceLine 
            y={TEMP_MAX} 
            stroke="#e24a4a" 
            strokeDasharray="3 3"
            label={{ value: `Máx ${TEMP_MAX}°C`, position: 'left', fontSize: 10 }}
          />
          
          {/* Área con gradiente */}
          <Area
            type="monotone"
            dataKey="value"
            stroke="#ff6b6b"
            strokeWidth={2}
            fill="url(#colorTempNormal)"
            name="Temperatura (°C)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Componente de gráfico de humedad
export function HumidityChart({ data }) {
  const processedData = data.map(d => {
    let color = '#52c41a'; // Verde (normal)
    if (d.hum < HUM_MIN) {
      color = '#e2b44a'; // Amarillo (seco)
    } else if (d.hum > HUM_MAX) {
      color = '#4a90e2'; // Azul (húmedo)
    }
    return { ...d, color, value: d.hum };
  });

  return (
    <div style={{ 
      width: '100%', 
      height: 360, 
      border: '1px solid #eee', 
      padding: 16, 
      borderRadius: 10,
      background: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <ResponsiveContainer>
        <AreaChart data={processedData}>
          <defs>
            <linearGradient id="colorHumNormal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#52c41a" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#52c41a" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorHumDry" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#e2b44a" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#e2b44a" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorHumWet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4a90e2" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#4a90e2" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 11 }}
            minTickGap={30}
          />
          <YAxis 
            tick={{ fontSize: 11 }}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip type="humedad" />} />
          <Legend />
          
          {/* Líneas de referencia para los rangos */}
          <ReferenceLine 
            y={HUM_MIN} 
            stroke="#e2b44a" 
            strokeDasharray="3 3"
            label={{ value: `Mín ${HUM_MIN}%`, position: 'left', fontSize: 10 }}
          />
          <ReferenceLine 
            y={HUM_MAX} 
            stroke="#4a90e2" 
            strokeDasharray="3 3"
            label={{ value: `Máx ${HUM_MAX}%`, position: 'left', fontSize: 10 }}
          />
          
          {/* Área con gradiente */}
          <Area
            type="monotone"
            dataKey="value"
            stroke="#4ecdc4"
            strokeWidth={2}
            fill="url(#colorHumNormal)"
            name="Humedad (%)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}