// 3. Conserva la configuración inicial
const express = require('express');
const app = express();
const port = 3000;

// 4. Agrega una nueva ruta GET con el endpoint /usuario
app.get('/usuario', (req, res) => {
    
    // 5. Crea un objeto JavaScript hardcodeado con al menos 3 propiedades
    const usuarioData = {
        id: 101,
        nombre: "Alejandro Gonzalez",
        rol: "Desarrollador Backend"
    };

    // 6. Regresa ese objeto usando res.json()
    res.json(usuarioData);
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
    console.log(`Prueba tu endpoint en: http://localhost:${port}/usuario`);
});
