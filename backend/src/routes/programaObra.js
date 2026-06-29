const express = require('express');
const router = express.Router();
const pool = require('../models/db');
const { getSheetData } = require('../services/googleSheets');

// POST — Guardar link de Google Sheets
router.post('/:obra_id/programa-obra/link', async (req, res) => {
  try {
    const { obra_id } = req.params;
    const { link } = req.body;

    if (!link) return res.status(400).json({ error: 'Link requerido' });

    // Verificar que el link es válido leyendo el título
    const datos = await getSheetData(link);

    await pool.query(
      'UPDATE obras SET link_programa_obra = $1, updated_at = NOW() WHERE id = $2',
      [link, obra_id]
    );

    // Registrar en archivos
    await pool.query(
      `INSERT INTO archivos (obra_id, tipo, nombre_original, ruta_minio)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [obra_id, 'programa_obra', 'Google Sheets', link]
    );

    res.json({
      mensaje: 'Link guardado correctamente',
      filas: datos.length
    });

  } catch (err) {
    console.error('Error guardando link:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET — Leer datos del programa de obra
router.get('/:obra_id/programa-obra', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT link_programa_obra FROM obras WHERE id = $1',
      [req.params.obra_id]
    );

    const obra = result.rows[0];
    if (!obra?.link_programa_obra) {
      return res.status(404).json({ error: 'No hay programa de obra registrado' });
    }

    const datos = await getSheetData(obra.link_programa_obra);
    res.json({ datos });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
