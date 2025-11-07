require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const CHANNEL_ID = process.env.THINGSPEAK_CHANNEL_ID;
const READ_KEY = process.env.THINGSPEAK_READ_KEY;

// Ruta para obtener feeds desde ThingSpeak (proxy)
app.get('/api/feeds', async (req, res) => {
  try {
    const results = req.query.results || 10; // default 10
    // Construye URL de ThingSpeak
    const url = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?api_key=${READ_KEY}&results=${results}`;
    const response = await axios.get(url, { timeout: 8000 });
    // response.data contiene channel + feeds
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

app.listen(PORT, () => console.log(`Backend escuchando en http://localhost:${PORT}`));
