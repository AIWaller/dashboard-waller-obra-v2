const express = require('express');
const router = express.Router();
const pool = require('../models/db');
const upload = require('../middleware/upload');
const { subirArchivo } = require('../services/minioService');

// GET — Listar todas las obras
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM obras ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST — Registrar obra nueva
router.post('/', async (req, res) => {
  const {
    nombre, cliente, centro_costo, monto_contratado,
    fecha_inicio, fecha_vigencia, condiciones_pago, retenciones
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO obras 
        (nombre, cliente, centro_costo, monto_contratado, 
         fecha_inicio, fecha_vigencia, condiciones_pago, retenciones)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [nombre, cliente, centro_costo, monto_contratado,
       fecha_inicio, fecha_vigencia, condiciones_pago, retenciones]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET — Ver una obra por ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM obras WHERE id = $1', [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Obra no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
