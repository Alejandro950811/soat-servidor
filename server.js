const express = require('express');
const cors = require('cors');
const app = express();

let cotizacionesPendientes = []; // [{ placa, timestamp, asignadoA }]
let respuestas = {}; // { 'ABC123': { valor, resumenHTML } ]
let usuarios = {
  admin: 'Admin2025.' // Usuario principal
};
let usuariosActivos = []; // Lista de usuarios activos para repartir placas
let indiceAsignacion = 0;

app.use(cors());
app.use(express.json());

// 1. Cliente envía placa → se guarda y se asigna a un usuario activo
app.post('/solicitar', (req, res) => {
  const { placa } = req.body;
  if (!placa) {
    return res.status(400).json({ error: 'Placa requerida' });
  }

  let asignadoA = null;
  if (usuariosActivos.length > 0) {
    asignadoA = usuariosActivos[indiceAsignacion % usuariosActivos.length];
    indiceAsignacion++;
  }

  cotizacionesPendientes.push({ placa, timestamp: Date.now(), asignadoA });
  res.json({ status: 'ok', asignadoA });
});

// 2. Devuelve placas asignadas al usuario (o todas si es admin)
app.get('/pendientes', (req, res) => {
  const usuario = req.query.usuario;
  if (!usuario) return res.status(400).json({ error: 'Usuario requerido' });

  if (usuario === 'admin') {
    return res.json(cotizacionesPendientes);
  }

  const propias = cotizacionesPendientes.filter(p => p.asignadoA === usuario);
  res.json(propias);
});

// 3. Admin o usuario responde con valor y resumen
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

// 5. Admin limpia todas las placas pendientes
app.post('/limpiar', (req, res) => {
  cotizacionesPendientes = [];
  res.json({ status: 'todas las placas eliminadas' });
});

// 6. 🔐 Login
app.post('/login', (req, res) => {
  const { usuario, clave } = req.body;
  if (usuarios[usuario] && usuarios[usuario] === clave) {
    res.json({ acceso: true });
  } else {
    res.status(401).json({ acceso: false });
  }
});

// 7. 👤 Crear usuario (solo si no existe)
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

// 8. 🧾 Obtener lista de usuarios
app.get('/usuarios', (req, res) => {
  const lista = Object.keys(usuarios);
  res.json(lista);
});

// 9. ❌ Eliminar usuario
app.delete('/usuarios/:usuario', (req, res) => {
  const { usuario } = req.params;
  if (usuario === 'admin') {
    return res.status(403).json({ error: 'No se puede eliminar al admin' });
  }
  if (usuarios[usuario]) {
    delete usuarios[usuario];
    usuariosActivos = usuariosActivos.filter(u => u !== usuario); // también lo sacamos de activos
    res.json({ status: 'usuario eliminado' });
  } else {
    res.status(404).json({ error: 'Usuario no encontrado' });
  }
});

// 10. 🟢 Establecer lista de usuarios activos (solo admin)
app.post('/activos', (req, res) => {
  const { activos } = req.body;
  if (!Array.isArray(activos)) {
    return res.status(400).json({ error: 'Formato incorrecto' });
  }

  // Validar que todos existan
  const validos = activos.every(u => usuarios[u]);
  if (!validos) {
    return res.status(400).json({ error: 'Uno o más usuarios no existen' });
  }

  usuariosActivos = activos;
  res.json({ status: 'usuarios activos actualizados' });
});

// 11. 📋 Obtener usuarios activos
app.get('/activos', (req, res) => {
  res.json(usuariosActivos);
});

// ✅ Railway: usar el puerto dinámico
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor escuchando en el puerto ${PORT}`);
});



