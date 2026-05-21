const mongoose = require("mongoose");

const connectMongoDB = async () => {
  try {
    // Aquí nos conectamos a tu compu local
    await mongoose.connect("mongodb://localhost:27017/backend_clase");
    console.log("Conexión exitosa a MongoDB - Alejandro Gonzalez");
  } catch (error) {
    console.error("Error al conectar con MongoDB:", error);
  }
};

module.exports = connectMongoDB;