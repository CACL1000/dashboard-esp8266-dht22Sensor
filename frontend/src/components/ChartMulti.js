// src/components/ChartMulti.js (correcciones principales)
import React from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Brush, Area
} from 'recharts';

export default function ChartMulti({ data }) {
  return (
    <div style={{ width: '100%', height: 360, border: '1px solid #eee', padding: 12, borderRadius: 8 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" minTickGap={20} tick={{ fontSize: 12 }} />
          <YAxis yAxisId="left" orientation="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          {/* HUMEDAD en right (area o line) */}
          <Area yAxisId="right" type="monotone" dataKey="hum" name="Humedad (%)" fillOpacity={0.2} stroke="#82ca9d" fill="#82ca9d" />
          {/* TEMPERATURA en left */}
          <Line yAxisId="left" type="monotone" dataKey="temp" name="Temperatura (°C)" stroke="#8884d8" dot={false} strokeWidth={2} />
          <Brush dataKey="time" height={30} stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}


