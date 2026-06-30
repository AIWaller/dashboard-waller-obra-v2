const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const parsearAuxiliar = require('../services/fileParser/parsearAuxiliar');
const pool = require('../models/db');

// POST — Subir libro de auxiliares
router.post('/auxiliar', upload.single('auxiliar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    const resultado = await parsearAuxiliar(req.file.path, req.file.originalname);

    res.json({
      mensaje: 'Libro de auxiliares procesado correctamente',
      total_movimientos: resultado.total_movimientos,
      obras_detectadas: resultado.obras_detectadas,
      periodo: resultado.periodo
    });

  } catch (err) {
    console.error('Error procesando auxiliar:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET — Ver historial de cargas
router.get('/auxiliar/historial', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM cargas_auxiliar ORDER BY fecha_carga DESC LIMIT 10'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
