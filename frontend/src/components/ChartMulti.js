// src/components/ChartMulti.js
import React from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Brush, Area
} from 'recharts';

export default function ChartMulti({ data }) {
  // data: array([{ time, temp, hum, entry_id }])
  return (
    <div style={{ width: '100%', height: 360, border: '1px solid #eee', padding: 12, borderRadius: 8 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" minTickGap={20} />
          <YAxis yAxisId="left" orientation="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Area yAxisId="right" type="monotone" dataKey="hum" name="Temperatura (°C)" fillOpacity={0.2} stroke="#82ca9d" fill="#82ca9d" />
          <Line yAxisId="left" type="monotone" dataKey="temp" name="Humedad (%)" stroke="#8884d8" dot={false} strokeWidth={2} />
          <Brush dataKey="time" height={30} stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
