const express = require('express');
const pool = require('./db');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('API funcionando - Alejandro Gonzalez');
});

// NUEVA RUTA: Obtener todos los alumnos de la base de datos
app.get('/alumnos', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM alumno');
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al consultar alumnos:', error);
    res.status(500).json({ error: 'Error al obtener los alumnos' });
  }
});

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
  console.log('Consulta los alumnos en: http://localhost:3000/alumnos');
});