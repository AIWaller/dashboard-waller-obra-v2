const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const analizarCotizacion = require('../services/aiAnalyzer/analizarCotizacion');
const { subirArchivo } = require('../services/minioService');
const pool = require('../models/db');

// POST — Subir cotización y analizarla con IA
router.post('/:obra_id/cotizacion', upload.single('cotizacion'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    const { obra_id } = req.params;

    // Analizar con IA
    const datos = await analizarCotizacion(req.file.path);

    // Subir a MinIO
    const rutaMinio = await subirArchivo(
      req.file.path,
      req.file.filename,
      'cotizaciones'
    );

    // Guardar partidas en base de datos
    for (const partida of datos.partidas) {
      await pool.query(
        `INSERT INTO partidas 
          (obra_id, codigo, descripcion, unidad, cantidad, 
           precio_unitario, importe, espesor, capitulo)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [obra_id, partida.codigo, partida.descripcion, partida.unidad,
         partida.cantidad, partida.precio_unitario, partida.importe,
         partida.espesor, partida.capitulo]
      );
    }

    // Registrar archivo
    await pool.query(
      `INSERT INTO archivos (obra_id, tipo, nombre_original, ruta_minio)
       VALUES ($1, $2, $3, $4)`,
      [obra_id, 'cotizacion', req.file.originalname, rutaMinio]
    );

    res.json({
      mensaje: 'Cotización analizada y guardada correctamente',
      total_partidas: datos.partidas.length,
      partidas: datos.partidas
    });

  } catch (err) {
    console.error('Error analizando cotización:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET — Obtener partidas de una obra
router.get('/:obra_id/partidas', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM partidas WHERE obra_id = $1 ORDER BY capitulo, codigo',
      [req.params.obra_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
