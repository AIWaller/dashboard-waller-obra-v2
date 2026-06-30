require('dotenv').config({ path: '/var/www/dashboard-waller-obra-v2/backend/.env' });
const express = require('express');
const cors = require('cors');
const pool = require('./models/db');

// Rutas
const obrasRoutes = require('./routes/obras');
const contratosRoutes = require('./routes/contratos');
const cotizacionesRoutes = require('./routes/cotizaciones');
const cotizacionCompletaRoutes = require('./routes/cotizacionCompleta');
const archivosRoutes = require('./routes/archivos');
const programaObraRoutes = require('./routes/programaObra');
const catalogosRoutes = require('./routes/catalogos');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/obras', obrasRoutes);
app.use('/api/contratos', contratosRoutes);
app.use('/api/obras', cotizacionesRoutes);
app.use('/api/obras', cotizacionCompletaRoutes);
app.use('/api/obras', archivosRoutes);
app.use('/api/obras', programaObraRoutes);
app.use('/api/catalogos', catalogosRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    mensaje: 'Dashboard Waller API funcionando',
    version: '1.0.0',
    estado: 'OK'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
