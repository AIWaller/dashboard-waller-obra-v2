const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const analizarCotizacionCompleta = require('../services/aiAnalyzer/analizarCotizacionCompleta');
const { subirArchivo } = require('../services/minioService');
const pool = require('../models/db');

// POST — Subir Excel completo de cotización
router.post('/:obra_id/cotizacion-completa', upload.single('cotizacion'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    const { obra_id } = req.params;

    // Analizar todas las pestañas con IA
    const resultados = await analizarCotizacionCompleta(req.file.path);

    // Subir a MinIO
    const rutaMinio = await subirArchivo(
      req.file.path,
      req.file.filename,
      'cotizaciones'
    );

    // Guardar resultados en base de datos
    await pool.query(
      `INSERT INTO archivos (obra_id, tipo, nombre_original, ruta_minio)
       VALUES ($1, $2, $3, $4)`,
      [obra_id, 'cotizacion_completa', req.file.originalname, rutaMinio]
    );

    // Actualizar datos de la obra con el resumen
    if (resultados['Resumen Cotizacion']) {
      const r = resultados['Resumen Cotizacion'];
      await pool.query(
        `UPDATE obras SET 
          updated_at = NOW()
         WHERE id = $1`,
        [obra_id]
      );
    }

    res.json({
      mensaje: 'Cotización analizada correctamente',
      pestanas_analizadas: Object.keys(resultados),
      resultados
    });

  } catch (err) {
    console.error('Error analizando cotización completa:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET — Obtener análisis de cotización de una obra
router.get('/:obra_id/cotizacion-completa', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM archivos 
       WHERE obra_id = $1 AND tipo = 'cotizacion_completa'
       ORDER BY created_at DESC LIMIT 1`,
      [req.params.obra_id]
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
