const express = require('express');
const router = express.Router();
const pool = require('../models/db');
const upload = require('../middleware/upload');
const { subirArchivo } = require('../services/minioService');

router.get('/:obra_id/archivos', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT tipo, nombre_original, created_at FROM archivos WHERE obra_id = $1 AND activo = true ORDER BY created_at DESC',
      [req.params.obra_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:obra_id/archivo', upload.single('archivo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se subio ningun archivo' });
    const { obra_id } = req.params;
    const tipo = req.body.tipo || 'archivo';
    const rutaMinio = await subirArchivo(req.file.path, req.file.filename, 'archivos');
    await pool.query(
      'INSERT INTO archivos (obra_id, tipo, nombre_original, ruta_minio) VALUES ($1, $2, $3, $4)',
      [obra_id, tipo, req.file.originalname, rutaMinio]
    );
    res.json({ mensaje: 'Archivo subido correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
