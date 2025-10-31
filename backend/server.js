const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const shipmentsRouter = require('./routes/shipments');
const reportsRouter = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Rutas API
app.use('/api/shipments', shipmentsRouter);
app.use('/api/reports', reportsRouter);

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Algo salió mal en el servidor'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📦 Sistema de gestión de envíos iniciado`);
});

module.exports = app;
