const express = require('express');
const pool = require('./db');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('API de FIMAZ: Búsqueda por ID - Alejandro Gonzalez');
});

// --- RUTAS DE ALUMNOS ---

// GET general
app.get('/alumnos', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM alumno');
    res.json(resultado.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener alumnos' });
  }
});

// NUEVO: GET por ID de Alumno
app.get('/alumnos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validación: ¿Es un número?
    if (isNaN(id)) {
      return res.status(400).json({ error: 'El id debe ser numérico' });
    }

    const resultado = await pool.query('SELECT * FROM alumno WHERE id = $1', [id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(resultado.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el usuario' });
  }
});

// --- RUTAS DE MATERIAS ---

// GET general
app.get('/materias', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM materia');
    res.json(resultado.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener materias' });
  }
});

// NUEVO: GET por ID de Materia
app.get('/materias/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({ error: 'El id debe ser numérico' });
    }

    const resultado = await pool.query('SELECT * FROM materia WHERE id = $1', [id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Materia no encontrada' });
    }

    res.json(resultado.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la materia' });
  }
});

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});