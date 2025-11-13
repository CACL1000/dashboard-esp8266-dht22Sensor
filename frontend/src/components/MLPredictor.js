import React, { useState, useEffect } from 'react';

// Regresión lineal simple
function linearRegression(x, y) {
  const n = x.length;
  if (n === 0) return null;
  
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumXX += x[i] * x[i];
  }
  
  const denominator = (n * sumXX - sumX * sumX);
  if (denominator === 0) return null;
  
  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope, intercept };
}

// Predicción usando el modelo
function predict(model, x) {
  if (!model) return null;
  return model.slope * x + model.intercept;
}

// Parsear fecha del formato del sistema
function parseDateTime(timeStr) {
  try {
    // Formato: "DD-MM-YYYY HH:mm:ss"
    const parts = timeStr.split(' ');
    if (parts.length !== 2) return null;
    
    const [datePart, timePart] = parts;
    const [day, month, year] = datePart.split('-').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);
    
    return new Date(year, month - 1, day, hours, minutes, seconds);
  } catch (e) {
    console.error('Error parsing date:', timeStr, e);
    return null;
  }
}

// Calcular horas del día (0-23) + fracción de día
function dateToNumeric(date) {
  if (!date) return null;
  // Usar timestamp en milisegundos como valor numérico
  return date.getTime();
}

export default function MLPredictor({ data }) {
  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedDay, setSelectedDay] = useState(1);
  const [prediction, setPrediction] = useState(null);
  const [modelStats, setModelStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  // Entrenar modelo cuando cambian los datos
  useEffect(() => {
    if (data && data.length > 10) {
      trainModel();
    }
  }, [data]);

  const trainModel = () => {
    setLoading(true);
    setPrediction(null);
    
    try {
      console.log('🎯 Iniciando entrenamiento con', data.length, 'datos');
      
      // Filtrar y preparar datos
      const processedData = data
        .map(d => {
          const date = parseDateTime(d.time);
          if (!date || d.temp === null || d.hum === null) return null;
          
          return {
            date,
            numeric: dateToNumeric(date),
            temp: d.temp,
            hum: d.hum
          };
        })
        .filter(d => d !== null && !isNaN(d.numeric) && !isNaN(d.temp) && !isNaN(d.hum));
      
      console.log('✅ Datos procesados:', processedData.length);
      
      if (processedData.length < 10) {
        setModelStats({ 
          error: `Datos insuficientes para entrenar (${processedData.length}/10 mínimo)` 
        });
        setLoading(false);
        return;
      }

      // Extraer arrays para regresión
      const x = processedData.map(d => d.numeric);
      const temps = processedData.map(d => d.temp);
      const hums = processedData.map(d => d.hum);
      
      console.log('📊 Rango X:', Math.min(...x), '-', Math.max(...x));
      console.log('🌡️ Rango Temp:', Math.min(...temps), '-', Math.max(...temps));
      console.log('💧 Rango Hum:', Math.min(...hums), '-', Math.max(...hums));
      
      // Entrenar modelos
      const tempModel = linearRegression(x, temps);
      const humModel = linearRegression(x, hums);
      
      if (!tempModel || !humModel) {
        setModelStats({ error: 'Error al calcular regresión lineal' });
        setLoading(false);
        return;
      }
      
      console.log('🔧 Modelo Temp:', tempModel);
      console.log('🔧 Modelo Hum:', humModel);
      
      // Calcular R² (coeficiente de determinación)
      const calculateR2 = (xArr, yArr, model) => {
        const predictions = xArr.map(xi => predict(model, xi));
        const yMean = yArr.reduce((a, b) => a + b, 0) / yArr.length;
        
        const ssTotal = yArr.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
        const ssRes = yArr.reduce((sum, yi, i) => sum + Math.pow(yi - predictions[i], 2), 0);
        
        return Math.max(0, 1 - (ssRes / ssTotal));
      };
      
      const tempR2 = calculateR2(x, temps, tempModel);
      const humR2 = calculateR2(x, hums, humModel);
      
      console.log('📈 R² Temp:', tempR2);
      console.log('📈 R² Hum:', humR2);
      
      setModelStats({
        tempModel,
        humModel,
        tempR2,
        humR2,
        dataPoints: processedData.length,
        lastUpdate: new Date().toLocaleString('es-ES'),
        firstDate: processedData[0].date,
        lastDate: processedData[processedData.length - 1].date
      });
      
      setDebugInfo(`✅ Modelo entrenado con ${processedData.length} datos`);
      
    } catch (error) {
      console.error('❌ Error al entrenar:', error);
      setModelStats({ error: `Error: ${error.message}` });
      setDebugInfo(`❌ Error: ${error.message}`);
    }
    
    setLoading(false);
  };

  const makePrediction = () => {
    if (!modelStats || modelStats.error) {
      alert('Primero debes entrenar el modelo');
      return;
    }
    
    try {
      // Calcular fecha objetivo
      const now = new Date();
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + selectedDay);
      targetDate.setHours(selectedHour, 0, 0, 0);
      
      const targetNumeric = dateToNumeric(targetDate);
      
      console.log('🎯 Predicción para:', targetDate);
      console.log('🎯 Valor numérico:', targetNumeric);
      
      // Hacer predicción
      const predictedTemp = predict(modelStats.tempModel, targetNumeric);
      const predictedHum = predict(modelStats.humModel, targetNumeric);
      
      console.log('🌡️ Temp predicha:', predictedTemp);
      console.log('💧 Hum predicha:', predictedHum);
      
      if (predictedTemp === null || predictedHum === null || isNaN(predictedTemp) || isNaN(predictedHum)) {
        alert('Error al calcular la predicción');
        return;
      }
      
      // Obtener última lectura para comparar
      const lastReading = data[data.length - 1];
      const tempDiff = predictedTemp - lastReading.temp;
      const humDiff = predictedHum - lastReading.hum;
      
      // Generar mensaje descriptivo
      let tempMessage = '';
      if (Math.abs(tempDiff) < 0.5) {
        tempMessage = 'se mantendrá prácticamente igual';
      } else if (tempDiff > 0) {
        tempMessage = `aumentará aproximadamente ${tempDiff.toFixed(1)}°C`;
      } else {
        tempMessage = `disminuirá aproximadamente ${Math.abs(tempDiff).toFixed(1)}°C`;
      }
      
      let humMessage = '';
      if (Math.abs(humDiff) < 2) {
        humMessage = 'se mantendrá similar';
      } else if (humDiff > 0) {
        humMessage = `aumentará aproximadamente ${humDiff.toFixed(1)}%`;
      } else {
        humMessage = `disminuirá aproximadamente ${Math.abs(humDiff).toFixed(1)}%`;
      }
      
      setPrediction({
        date: targetDate,
        temp: predictedTemp,
        hum: predictedHum,
        tempDiff,
        humDiff,
        tempMessage,
        humMessage,
        lastTemp: lastReading.temp,
        lastHum: lastReading.hum,
        confidence: ((modelStats.tempR2 + modelStats.humR2) / 2 * 100).toFixed(0)
      });
      
      setDebugInfo(`✅ Predicción exitosa para ${targetDate.toLocaleString('es-ES')}`);
      
    } catch (error) {
      console.error('❌ Error en predicción:', error);
      alert(`Error: ${error.message}`);
      setDebugInfo(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div style={{
      border: '1px solid #e6e6e6',
      borderRadius: 12,
      padding: 20,
      background: 'white',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      borderLeft: '4px solid #9b59b6'
    }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#333', display: 'flex', alignItems: 'center', gap: 8 }}>
        🤖 Predicción con Machine Learning (Regresión Lineal)
        {loading && <span style={{ fontSize: 14, color: '#666' }}>⏳ Entrenando...</span>}
      </h3>
      
      {/* Debug info */}
      {debugInfo && (
        <div style={{
          background: '#f0f9ff',
          border: '1px solid #0891b2',
          borderRadius: 6,
          padding: 8,
          marginBottom: 12,
          fontSize: 12,
          fontFamily: 'monospace',
          color: '#0e7490'
        }}>
          {debugInfo}
        </div>
      )}
      
      {modelStats?.error && (
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
          color: '#856404'
        }}>
          ⚠️ {modelStats.error}
        </div>
      )}
      
      {modelStats && !modelStats.error && (
        <>
          {/* Estadísticas del modelo */}
          <div style={{
            background: '#f8f9fa',
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            fontSize: 13
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <strong>📊 Datos de entrenamiento:</strong> {modelStats.dataPoints} puntos
              </div>
              <div>
                <strong>🕐 Última actualización:</strong> {modelStats.lastUpdate}
              </div>
              <div>
                <strong>🌡️ Precisión temperatura:</strong> {(modelStats.tempR2 * 100).toFixed(1)}%
                {modelStats.tempR2 < 0.3 && <span style={{color: '#e24a4a', marginLeft: 8}}>⚠️ Baja</span>}
              </div>
              <div>
                <strong>💧 Precisión humedad:</strong> {(modelStats.humR2 * 100).toFixed(1)}%
                {modelStats.humR2 < 0.3 && <span style={{color: '#e24a4a', marginLeft: 8}}>⚠️ Baja</span>}
              </div>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: '#666' }}>
              Rango de datos: {modelStats.firstDate?.toLocaleString('es-ES')} - {modelStats.lastDate?.toLocaleString('es-ES')}
            </div>
          </div>
          
          {/* Controles de predicción */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr auto',
            gap: 12,
            marginBottom: 16,
            alignItems: 'end'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                📅 Días en el futuro:
              </label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #ddd',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value={0}>Hoy</option>
                <option value={1}>Mañana</option>
                <option value={2}>Pasado mañana</option>
                <option value={3}>3 días</option>
                <option value={7}>1 semana</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                🕐 Hora del día:
              </label>
              <select
                value={selectedHour}
                onChange={(e) => setSelectedHour(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #ddd',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={makePrediction}
              style={{
                padding: '10px 20px',
                borderRadius: 6,
                border: 'none',
                background: '#9b59b6',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#8e44ad'}
              onMouseLeave={(e) => e.target.style.background = '#9b59b6'}
            >
              🔮 Predecir
            </button>
          </div>
          
          {/* Resultados de la predicción */}
          {prediction && (
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 10,
              padding: 20,
              color: 'white',
              animation: 'fadeIn 0.5s ease-out'
            }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
                📅 {prediction.date.toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })} a las {prediction.date.getHours().toString().padStart(2, '0')}:00
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  padding: 16
                }}>
                  <div style={{ fontSize: 13, marginBottom: 8, opacity: 0.9 }}>🌡️ Temperatura</div>
                  <div style={{ fontSize: 32, fontWeight: 700 }}>
                    {prediction.temp.toFixed(1)}°C
                  </div>
                  <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>
                    Actual: {prediction.lastTemp.toFixed(1)}°C
                  </div>
                  <div style={{ fontSize: 14, marginTop: 8, opacity: 0.9 }}>
                    {prediction.tempMessage}
                  </div>
                </div>
                
                <div style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  padding: 16
                }}>
                  <div style={{ fontSize: 13, marginBottom: 8, opacity: 0.9 }}>💧 Humedad</div>
                  <div style={{ fontSize: 32, fontWeight: 700 }}>
                    {prediction.hum.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>
                    Actual: {prediction.lastHum.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: 14, marginTop: 8, opacity: 0.9 }}>
                    {prediction.humMessage}
                  </div>
                </div>
              </div>
              
              <div style={{
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 8,
                padding: 12,
                fontSize: 13,
                textAlign: 'center'
              }}>
                ⚡ Confianza del modelo: <strong>{prediction.confidence}%</strong>
                {prediction.confidence < 30 && (
                  <div style={{ marginTop: 4, fontSize: 11 }}>
                    ⚠️ Baja confianza - Se necesitan más datos históricos
                  </div>
                )}
              </div>
              
              <div style={{
                marginTop: 12,
                fontSize: 11,
                opacity: 0.8,
                textAlign: 'center'
              }}>
                * Predicción basada en regresión lineal. Puede variar según condiciones externas.
              </div>
            </div>
          )}
          
          <button
            onClick={trainModel}
            disabled={loading}
            style={{
              marginTop: 16,
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid #ddd',
              background: loading ? '#f0f0f0' : 'white',
              color: loading ? '#999' : '#666',
              fontSize: 13,
              cursor: loading ? 'not-allowed' : 'pointer',
              width: '100%'
            }}
          >
            {loading ? '⏳ Entrenando...' : '🔄 Reentrenar modelo'}
          </button>
        </>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}