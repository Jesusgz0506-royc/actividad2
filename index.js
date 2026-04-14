const express = require('express');
const pool = require('./db'); // Importamos la conexión desde db.js
const app = express();

// Ruta principal
app.get('/', (req, res) => {
  res.send('API funcionando');
});

// Ruta de usuario (actividad anterior)
app.get('/usuario', (req, res) => {
    res.json({
        id: 101,
        nombre: "Alejandro Gonzalez",
        rol: "Desarrollador"
    });
});

// PRUEBA DE CONEXIÓN A POSTGRESQL
pool.connect()
  .then(() => {
    console.log('Conexión exitosa a PostgreSQL');
  })
  .catch((err) => {
    console.error('Error de conexión', err);
  });

// Puerto del servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Prueba tu endpoint en: http://localhost:${PORT}/usuario`);
});