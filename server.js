const express = require('express');
const cors = require('cors');
const app = express();

// Datos en memoria
let cotizacionesPendientes = []; // [{ placa, timestamp }]
let respuestas = {};             // { 'ABC123': { valor, resumenHTML } }
let usuarios = {
  admin: 'Admin2025.'           // Usuario principal
};

app.use(cors());
app.use(express.json());

/* === 1. Cliente envía placa para cotizar === */
app.post('/solicitar', (req, res) => {
  const { placa } = req.body;
  if (!placa) return res.status(400).json({ error: 'Placa requerida' });

  // Agregar a pendientes
  cotizacionesPendientes.push({ placa, timestamp: Date.now(), respondida: false });
  res.json({ status: 'ok' });
});

/* === 2. Obtener todas las placas pendientes === */
app.get('/pendientes', (req, res) => {
  res.json(cotizacionesPendientes);
});

/* === 3. Responder una placa con valor y resumen === */
app.post('/responder', (req, res) => {
  const { placa, valor, resumenHTML } = req.body;
  if (!placa || !valor || !resumenHTML) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  respuestas[placa] = { valor, resumenHTML };

  // Marcar como respondida sin eliminarla del arreglo
  cotizacionesPendientes = cotizacionesPendientes.map(p =>
    p.placa === placa ? { ...p, respondida: true } : p
  );

  res.json({ status: 'respuesta guardada' });
});

/* === 4. Cliente consulta si ya hay respuesta === */
app.get('/respuesta/:placa', (req, res) => {
  const { placa } = req.params;
  if (respuestas[placa]) {
    res.json(respuestas[placa]);
  } else {
    res.status(204).end(); // No Content
  }
});

/* === 5. Limpiar todas las placas pendientes === */
app.post('/limpiar', (req, res) => {
  cotizacionesPendientes = [];
  res.json({ status: 'todas las placas eliminadas' });
});

/* === 6. Login de usuarios === */
app.post('/login', (req, res) => {
  const { usuario, clave } = req.body;
  if (usuarios[usuario] === clave) {
    res.json({ acceso: true });
  } else {
    res.status(401).json({ acceso: false });
  }
});

/* === 7. Crear un nuevo usuario (solo si no existe) === */
app.post('/usuarios', (req, res) => {
  const { usuario, clave } = req.body;

  if (!usuario || !clave) {
    return res.status(400).json({ error: 'Usuario y clave requeridos' });
  }
  if (usuarios[usuario]) {
    return res.status(409).json({ error: 'Usuario ya existe' });
  }

  usuarios[usuario] = clave;
  res.json({ status: 'usuario creado' });
});

/* === 8. Obtener lista de usuarios existentes === */
app.get('/usuarios', (req, res) => {
  res.json(Object.keys(usuarios));
});

/* === 9. Eliminar un usuario (excepto admin) === */
app.delete('/usuarios/:usuario', (req, res) => {
  const { usuario } = req.params;

  if (usuario === 'admin') {
    return res.status(403).json({ error: 'No se puede eliminar al admin' });
  }
  if (usuarios[usuario]) {
    delete usuarios[usuario];
    res.json({ status: 'usuario eliminado' });
  } else {
    res.status(404).json({ error: 'Usuario no encontrado' });
  }
});

/* === 10. Inicializar servidor === */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor escuchando en el puerto ${PORT}`);
});




