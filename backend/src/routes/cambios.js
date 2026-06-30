const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { subirArchivo } = require('../services/minioService');
const pool = require('../models/db');

// POST - Registrar additiva/deductiva (con o sin documento)
router.post('/:obra_id/cambios', upload.single('documento'), async (req, res) => {
  try {
    const { obra_id } = req.params;
    const { tipo, numero, descripcion, monto, fecha } = req.body;

    if (!tipo || !monto) {
      return res.status(400).json({ error: 'Tipo y monto son requeridos' });
    }

    let rutaMinio = null;
    let nombreArchivo = null;
    let tieneDocumento = false;

    if (req.file) {
      rutaMinio = await subirArchivo(req.file.path, req.file.filename, 'cambios');
      nombreArchivo = req.file.originalname;
      tieneDocumento = true;
    }

    const result = await pool.query(
      `INSERT INTO cambios 
        (obra_id, tipo, numero, descripcion, monto, fecha, nombre_archivo, ruta_minio, tiene_documento)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [obra_id, tipo, numero || null, descripcion || null, monto, fecha || null,
       nombreArchivo, rutaMinio, tieneDocumento]
    );

    res.json({
      mensaje: 'Movimiento registrado correctamente',
      cambio: result.rows[0]
    });

  } catch (err) {
    console.error('Error registrando cambio:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET - Listar additivas/deductivas de una obra
router.get('/:obra_id/cambios', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM cambios WHERE obra_id = $1 ORDER BY fecha DESC, created_at DESC',
      [req.params.obra_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST - Subir documento de respaldo a un cambio existente
router.post('/:obra_id/cambios/:cambio_id/documento', upload.single('documento'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se subio ningun archivo' });

    const rutaMinio = await subirArchivo(req.file.path, req.file.filename, 'cambios');

    await pool.query(
      'UPDATE cambios SET nombre_archivo = $1, ruta_minio = $2, tiene_documento = true WHERE id = $3',
      [req.file.originalname, rutaMinio, req.params.cambio_id]
    );

    res.json({ mensaje: 'Documento vinculado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
