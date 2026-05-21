// ============================================================================
//   PROYECTO FINAL: DESARROLLO WEB DEL LADO DEL SERVIDOR - FIMAZ
//   EQUIPO DE ALEJANDRO GONZALEZ ZAMORANO
// ============================================================================

const express = require("express");
const pool = require("./db"); // Conexión a PostgreSQL
const connectMongoDB = require("./mongoConnection"); // Conexión a MongoDB
const Vehiculo = require("./Vehiculo"); // Modelo Mongoose para Vehículos

const app = express();
app.use(express.json()); // Middleware para procesar solicitudes en formato JSON

// Conexión a MongoDB tolerante a fallas
connectMongoDB()
  .then(() => console.log("¡Conectado exitosamente a MongoDB!"))
  .catch(err => console.log("Aviso: MongoDB no disponible, continuando con Postgres:", err.message));

// ============================================================================
//   A) ENDPOINTS DE ALUMNOS (PostgreSQL)
// ============================================================================

// 1. Consultar todos los alumnos activos (isActive = true)
app.get("/api/getAlumnos", async (req, res) => {
  try {
    const resultado = await pool.query("SELECT * FROM alumno WHERE isactive = true");
    return res.status(200).json({
      message: "Alumnos activos obtenidos correctamente",
      data: resultado.rows
    });
  } catch (error) {
    return res.status(500).json({ message: "Error interno del servidor", detail: error.message });
  }
});

// 2. Consultar alumno por ID (Validando que exista, sea numérico y esté activo)
app.get("/api/getAlumnoById/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validación: Que sea un número válido
    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "El ID del alumno debe ser un valor numérico válido" });
    }

    const resultado = await pool.query("SELECT * FROM alumno WHERE id = $1 AND isactive = true", [id]);

    // Validación: Que el registro exista
    if (resultado.rows.length === 0) {
      return res.status(404).json({ message: "Alumno no encontrado o no se encuentra activo" });
    }

    return res.status(200).json({
      message: "Alumno encontrado correctamente",
      data: resultado.rows[0]
    });
  } catch (error) {
    return res.status(500).json({ message: "Error al consultar alumno", detail: error.message });
  }
});

// 3. Buscar alumno por nombre o apellido usando LIKE
app.get("/api/searchAlumno", async (req, res) => {
  try {
    const { query } = req.query;

    // Validación: Que la query exista y no esté vacía
    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "El término de búsqueda 'query' es obligatorio y no puede ir vacío" });
    }

    const sql = "SELECT * FROM alumno WHERE (nombre LIKE $1 OR apellido LIKE $1) AND isactive = true";
    const resultado = await pool.query(sql, [`%${query}%`]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ message: "No se encontraron alumnos que coincidan con la búsqueda" });
    }

    return res.status(200).json({
      message: "Búsqueda realizada con éxito",
      data: resultado.rows
    });
  } catch (error) {
    return res.status(500).json({ message: "Error en la búsqueda", detail: error.message });
  }
});

// 4. Crear Alumno (POST)
app.post("/api/createAlumno", async (req, res) => {
  try {
    const { nombre, apellido, edad } = req.body;

    // Validación: Campos obligatorios
    if (!nombre || nombre.trim() === "" || !apellido || apellido.trim() === "" || !edad) {
      return res.status(400).json({ message: "Todos los campos (nombre, apellido, edad) son obligatorios" });
    }
    if (isNaN(edad)) {
      return res.status(400).json({ message: "La edad debe ser un número válido" });
    }

    const sql = "INSERT INTO alumno (nombre, apellido, edad, isactive) VALUES ($1, $2, $3, true) RETURNING *";
    const resultado = await pool.query(sql, [nombre, apellido, edad]);

    return res.status(201).json({
      message: "Alumno creado correctamente",
      data: resultado.rows[0]
    });
  } catch (error) {
    return res.status(500).json({ message: "Error al crear alumno", detail: error.message });
  }
});

// 5. Modificar Alumno (PUT)
app.put("/api/updateAlumno/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, edad } = req.body;

    // Validaciones de ID y Body
    if (!id || isNaN(id)) return res.status(400).json({ message: "El ID debe ser numérico" });
    if (!nombre || !apellido || !edad) return res.status(400).json({ message: "Faltan campos para actualizar" });

    // Verificar si existe y está activo antes de modificar
    const verificar = await pool.query("SELECT * FROM alumno WHERE id = $1 AND isactive = true", [id]);
    if (verificar.rows.length === 0) return res.status(404).json({ message: "El alumno no existe o está inactivo" });

    const sql = "UPDATE alumno SET nombre = $1, apellido = $2, edad = $3 WHERE id = $4 RETURNING *";
    const resultado = await pool.query(sql, [nombre, apellido, edad, id]);

    return res.status(200).json({
      message: "Alumno modificado correctamente",
      data: resultado.rows[0]
    });
  } catch (error) {
    return res.status(500).json({ message: "Error al modificar alumno", detail: error.message });
  }
});

// 6. Eliminar Alumno de manera lógica (DELETE -> isactive = false)
app.delete("/api/deleteAlumno/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) return res.status(400).json({ message: "El ID debe ser numérico" });

    // Verificar si ya existe y está activo
    const verificar = await pool.query("SELECT * FROM alumno WHERE id = $1 AND isactive = true", [id]);
    if (verificar.rows.length === 0) return res.status(404).json({ message: "El alumno no existe o ya estaba inactivo" });

    const sql = "UPDATE alumno SET isactive = false WHERE id = $1 RETURNING *";
    await pool.query(sql, [id]);

    return res.status(200).json({ message: "Alumno eliminado de manera lógica correctamente" });
  } catch (error) {
    return res.status(500).json({ message: "Error al eliminar alumno", detail: error.message });
  }
});
// ==========================================
//  7. Buscar alumno por nombre o apellido (LIKE)
// ==========================================
app.get("/api/searchAlumno", async (req, res) => {
  try {
    const { query } = req.query; // Captura lo que pones en la URL después del signo ? (ej: ?query=Alejandro)

    // VALIDACIÓN 1: Que el parámetro query exista y no sean puros espacios en blanco
    if (!query || query.trim() === "") {
      return res.status(400).json({ 
        message: "El término de búsqueda 'query' es obligatorio y no puede ir vacío" 
      });
    }

    // CONSULTA: Buscamos coincidencias con LIKE en nombre o apellido, cuidando que el alumno esté activo
    // Usamos $1 para evitar inyección SQL (Regra obligatoria de seguridad)
    const sql = "SELECT * FROM alumno WHERE (nombre LIKE $1 OR apellido LIKE $1) AND isactive = true";
    const resultado = await pool.query(sql, [`%${query}%`]);

    // VALIDACIÓN 2: Si la consulta no trajo nada, respondemos con 404
    if (resultado.rows.length === 0) {
      return res.status(404).json({ 
        message: "No se encontraron alumnos activos que coincidan con la búsqueda" 
      });
    }

    // RESPUESTA EXITOSA (200 OK)
    return res.status(200).json({
      message: "Búsqueda realizada con éxito",
      data: resultado.rows // Regresa el arreglo con todas las coincidencias encontradas
    });

  } catch (error) {
    return res.status(500).json({ 
      message: "Error interno del servidor en la búsqueda", 
      detail: error.message 
    });
  }
});


// ============================================================================
//   B) ENDPOINTS DE MATERIAS (PostgreSQL)
// ============================================================================

// 1. Consultar todas las materias
app.get("/api/getMaterias", async (req, res) => {
  try {
    const resultado = await pool.query("SELECT * FROM materia");
    return res.status(200).json({
      message: "Materias obtenidas correctamente",
      data: resultado.rows
    });
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener materias", detail: error.message });
  }
});

// 2. Crear materia
app.post("/api/createMateria", async (req, res) => {
  try {
    const { nombre_materia } = req.body;

    if (!nombre_materia || nombre_materia.trim() === "") {
      return res.status(400).json({ message: "El nombre de la materia es obligatorio" });
    }

    const sql = "INSERT INTO materia (nombre_materia) VALUES ($1) RETURNING *";
    const resultado = await pool.query(sql, [nombre_materia]);

    return res.status(201).json({
      message: "Materia creada correctamente",
      data: resultado.rows[0]
    });
  } catch (error) {
    return res.status(500).json({ message: "Error al crear materia", detail: error.message });
  }
});

// ============================================================================
//   C) ENDPOINTS DE RELACIÓN ALUMNO-MATERIA
// ============================================================================

// 1. Relacionar alumno con materia (Validando duplicados y existencia)
app.post("/api/assignMateriaToAlumno", async (req, res) => {
  try {
    const { alumno_id, materia_id } = req.body;

    if (!alumno_id || isNaN(alumno_id) || !materia_id || isNaN(materia_id)) {
      return res.status(400).json({ message: "Los campos alumno_id y materia_id son obligatorios y deben ser numéricos" });
    }

    // Validar que el alumno exista y esté activo
    const alumnoOk = await pool.query("SELECT * FROM alumno WHERE id = $1 AND isactive = true", [alumno_id]);
    if (alumnoOk.rows.length === 0) return res.status(404).json({ message: "El alumno no existe o está inactivo" });

    // Validar que la materia exista
    const materiaOk = await pool.query("SELECT * FROM materia WHERE id = $1", [materia_id]);
    if (materiaOk.rows.length === 0) return res.status(404).json({ message: "La materia especificada no existe" });

    // Validar duplicados
    const duplicado = await pool.query("SELECT * FROM alumno_materia WHERE alumno_id = $1 AND materia_id = $2", [alumno_id, materia_id]);
    if (duplicado.rows.length > 0) return res.status(400).json({ message: "Esta relación ya se encuentra registrada" });

    const sql = "INSERT INTO alumno_materia (alumno_id, materia_id) VALUES ($1, $2) RETURNING *";
    const resultado = await pool.query(sql, [alumno_id, materia_id]);

    return res.status(201).json({
      message: "Materia asignada al alumno correctamente",
      data: resultado.rows[0]
    });
  } catch (error) {
    return res.status(500).json({ message: "Error al relacionar alumno y materia", detail: error.message });
  }
});

// 2. Consultar materias relacionadas a un alumno
app.get("/api/getMateriasByAlumnoId/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) return res.status(400).json({ message: "El ID del alumno debe ser numérico" });

    const alumnoOk = await pool.query("SELECT * FROM alumno WHERE id = $1 AND isactive = true", [id]);
    if (alumnoOk.rows.length === 0) return res.status(404).json({ message: "El alumno no existe o está inactivo" });

    const sql = `
      SELECT m.id, m.nombre_materia 
      FROM materia m 
      INNER JOIN alumno_materia am ON m.id = am.materia_id 
      WHERE am.alumno_id = $1`;
    const resultado = await pool.query(sql, [id]);

    return res.status(200).json({
      message: "Materias del alumno obtenidas correctamente",
      data: resultado.rows
    });
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener las materias del alumno", detail: error.message });
  }
});

// 3. Consultar cuántas materias tiene un alumno
app.get("/api/getMateriasCountByAlumnoId/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) return res.status(400).json({ message: "El ID del alumno debe ser numérico" });

    const alumnoOk = await pool.query("SELECT * FROM alumno WHERE id = $1 AND isactive = true", [id]);
    if (alumnoOk.rows.length === 0) return res.status(404).json({ message: "El alumno no existe o está inactivo" });

    const sql = "SELECT COUNT(*) as total FROM alumno_materia WHERE alumno_id = $1";
    const resultado = await pool.query(sql, [id]);

    return res.status(200).json({
      total_materias: parseInt(resultado.rows[0].total)
    });
  } catch (error) {
    return res.status(500).json({ message: "Error al contar materias", detail: error.message });
  }
});

// ============================================================================
//   D) ENDPOINTS DE VEHÍCULOS CON MONGODB
// ============================================================================

// 1. Consultar vehículos
app.get("/api/getVehiculos", async (req, res) => {
  try {
    const vehiculos = await Vehiculo.find();
    return res.status(200).json({
      message: "Vehículos obtenidos de MongoDB correctamente",
      data: vehiculos
    });
  } catch (error) {
    return res.status(500).json({ message: "Error al consultar MongoDB", detail: error.message });
  }
});

// 2. Crear vehículo (Actualizado con validación de color para el Schema)
app.post("/api/createVehiculo", async (req, res) => {
  try {
    // Extraemos también el color del cuerpo de la petición
    const { marca, modelo, anio, color } = req.body; 

    // VALIDACIONES OBLIGATORIAS
    if (!marca || marca.trim() === "") return res.status(400).json({ message: "La marca del vehículo es obligatoria" });
    if (!modelo || modelo.trim() === "") return res.status(400).json({ message: "El modelo del vehículo es obligatorio" });
    if (!anio || isNaN(anio)) return res.status(400).json({ message: "El año es obligatorio y debe ser numérico" });
    
    // Validación del color para evitar el error 500 de Mongoose
    if (!color || color.trim() === "") return res.status(400).json({ message: "El color del vehículo es obligatorio" });

    // INSERCIÓN: Guardamos el documento con todos los campos en MongoDB
    const nuevoVehiculo = new Vehiculo({ marca, modelo, anio, color });
    await nuevoVehiculo.save();

    // RESPUESTA EXITOSA (201 Created)
    return res.status(201).json({
      message: "Vehículo insertado en MongoDB correctamente",
      data: nuevoVehiculo
    });

  } catch (error) {
    return res.status(500).json({ 
      message: "Error interno al guardar en MongoDB", 
      detail: error.message 
    });
  }
});

// Arranque oficial del puerto
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor de Alejandro corriendo en el puerto ${PORT}`);
});