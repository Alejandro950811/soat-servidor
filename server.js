const express = require('express');
const cors = require('cors');
const app = express();

let cotizacionesPendientes = []; // [{ placa, timestamp }]
let respuestas = {}; // { 'ABC123': { valor, resumenHTML } }

app.use(cors());
app.use(express.json());

// 1. Cliente envía placa → se guarda
app.post('/solicitar', (req, res) => {
  const { placa } = req.body;
  if (placa) {
    cotizacionesPendientes.push({ placa, timestamp: Date.now() });
    res.json({ status: 'ok' });
  } else {
    res.status(400).json({ error: 'Placa requerida' });
  }
});

// 2. Admin consulta placas pendientes
app.get('/pendientes', (req, res) => {
  res.json(cotizacionesPendientes);
});

// 3. Admin responde con valor y resumen
app.post('/responder', (req, res) => {
  const { placa, valor, resumenHTML } = req.body;
  if (placa && valor && resumenHTML) {
    respuestas[placa] = { valor, resumenHTML };
    cotizacionesPendientes = cotizacionesPendientes.filter(p => p.placa !== placa);
    res.json({ status: 'respuesta guardada' });
  } else {
    res.status(400).json({ error: 'Datos incompletos' });
  }
});

// 4. Cliente pregunta si ya hay respuesta
app.get('/respuesta/:placa', (req, res) => {
  const { placa } = req.params;
  if (respuestas[placa]) {
    res.json(respuestas[placa]);
  } else {
    res.status(204).end(); // No Content
  }
});

app.listen(3000, () => {
  console.log('✅ Servidor escuchando en http://localhost:3000');
});

