const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const analizarContrato = require('../services/aiAnalyzer/analizarContrato');
const { subirArchivo } = require('../services/minioService');
const pool = require('../models/db');

// POST — Subir contrato y analizarlo con IA
router.post('/analizar', upload.single('contrato'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    // Analizar con IA
    const datos = await analizarContrato(req.file.path);

    // Subir a MinIO
    const rutaMinio = await subirArchivo(
      req.file.path,
      req.file.filename,
      'contratos'
    );

    res.json({
      mensaje: 'Contrato analizado correctamente',
      datos_extraidos: datos,
      archivo: rutaMinio
    });

  } catch (err) {
    console.error('Error analizando contrato:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST — Confirmar datos y registrar obra
router.post('/confirmar', async (req, res) => {
  const {
    nombre_obra, cliente, centro_costo, monto_contratado,
    fecha_inicio, fecha_vigencia, condiciones_pago, 
    retenciones, archivo_minio
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO obras 
        (nombre, cliente, centro_costo, monto_contratado,
         fecha_inicio, fecha_vigencia, condiciones_pago, retenciones)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [nombre_obra, cliente, centro_costo, monto_contratado,
       fecha_inicio, fecha_vigencia, condiciones_pago, retenciones]
    );

    const obra = result.rows[0];

    // Registrar archivo en tabla archivos
    await pool.query(
      `INSERT INTO archivos (obra_id, tipo, nombre_original, ruta_minio)
       VALUES ($1, $2, $3, $4)`,
      [obra.id, 'contrato', 'contrato.pdf', archivo_minio]
    );

    res.json({
      mensaje: 'Obra registrada correctamente',
      obra
    });

  } catch (err) {
    console.error('Error registrando obra:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
