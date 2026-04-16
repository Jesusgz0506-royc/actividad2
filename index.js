const express = require('express');
const pool = require('./db');
const app = express();

// IMPORTANTE: Para que Express entienda el JSON que mandas desde Postman
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API Funcionando - Alejandro Gonzalez');
});

// RUTA GET: Consultar alumnos (Actividad anterior)
app.get('/alumnos', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM alumno');
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al consultar alumnos:', error);
    res.status(500).json({ error: 'Error al obtener los alumnos' });
  }
});

// RUTA POST: Insertar nuevo alumno (Actividad 5)
app.post('/alumnos', async (req, res) => {
  try {
    const { nombre, apellido, edad, correo } = req.body;

    // Validación básica: Que no falte nada
    if (!nombre || !apellido || !edad || !correo) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Consulta SQL para insertar
    const resultado = await pool.query(
      'INSERT INTO alumno (nombre, apellido, edad, correo) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, apellido, edad, correo]
    );

    res.status(201).json({
      mensaje: 'Alumno insertado correctamente - Por Alejandro Gonzalez',
      alumno: resultado.rows[0]
    });
  } catch (error) {
    console.error('Error al insertar alumno:', error);
    // Si el correo ya existe, Postgres dará error porque es UNIQUE
    res.status(500).json({ error: 'Error al insertar el alumno (puede que el correo ya exista)' });
  }
});

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});