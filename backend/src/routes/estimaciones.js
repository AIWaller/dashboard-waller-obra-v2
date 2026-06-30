const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const analizarEstimacion = require('../services/aiAnalyzer/analizarEstimacion');
const { subirArchivo } = require('../services/minioService');
const pool = require('../models/db');

// POST — Subir y analizar estimacion
router.post('/:obra_id/estimaciones', upload.single('archivo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subio ningun archivo' });
    }

    const { obra_id } = req.params;
    const datos = await analizarEstimacion(req.file.path);

    const rutaMinio = await subirArchivo(req.file.path, req.file.filename, 'estimaciones');

    // Guardar cada estimacion del arreglo
    for (const est of datos.estimaciones || []) {
      await pool.query(
        `INSERT INTO estimaciones 
          (obra_id, numero, periodo_inicio, periodo_fin, importe_estimado,
           amortizacion_anticipo, fondo_garantia, total_estimacion,
           acumulado_estimacion, saldo_por_estimar, valor_factura,
           nombre_archivo, ruta_minio, datos_completos)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         ON CONFLICT DO NOTHING`,
        [obra_id, est.numero, est.periodo_inicio || null, est.periodo_fin || null,
         est.importe_estimado || 0, est.amortizacion_anticipo || 0,
         est.fondo_garantia || 0, est.total_estimacion || 0,
         est.acumulado_estimacion || 0, est.saldo_por_estimar || 0,
         est.valor_factura || 0, req.file.originalname, rutaMinio,
         JSON.stringify(datos)]
      );
    }

    // Registrar en archivos
    await pool.query(
      `INSERT INTO archivos (obra_id, tipo, nombre_original, ruta_minio)
       VALUES ($1, $2, $3, $4)`,
      [obra_id, 'estimaciones', req.file.originalname, rutaMinio]
    );

    res.json({
      mensaje: 'Estimacion analizada correctamente',
      datos
    });

  } catch (err) {
    console.error('Error procesando estimacion:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET — Obtener estimaciones de una obra
router.get('/:obra_id/estimaciones', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM estimaciones WHERE obra_id = $1 ORDER BY numero',
      [req.params.obra_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
