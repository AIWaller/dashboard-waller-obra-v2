const XLSX = require('xlsx');
const pool = require('../../models/db');

const MESES = {
  'Ene': '01', 'Feb': '02', 'Mar': '03', 'Abr': '04',
  'May': '05', 'Jun': '06', 'Jul': '07', 'Ago': '08',
  'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dic': '12'
};

const convertirFecha = (fechaStr) => {
  const partes = fechaStr.split('/');
  if (partes.length !== 3) return null;
  const dia = partes[0].padStart(2, '0');
  const mes = MESES[partes[1]];
  const anio = partes[2];
  if (!mes) return null;
  return anio + '-' + mes + '-' + dia;
};

const parsearAuxiliar = async (rutaArchivo, nombreArchivo) => {
  const workbook = XLSX.readFile(rutaArchivo);
  const ws = workbook.Sheets[workbook.SheetNames[0]];
  const filas = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

  const obrasResult = await pool.query('SELECT id, centro_costo FROM obras');
  const mapaObras = {};
  obrasResult.rows.forEach(o => {
    if (o.centro_costo) mapaObras[String(o.centro_costo).trim()] = o.id;
  });

  let cuentaActual = null;
  let nombreCuentaActual = null;
  let movimientos = [];
  let obrasDetectadas = new Set();
  let periodo = '';

  for (let i = 0; i < Math.min(10, filas.length); i++) {
    const fila = filas[i];
    if (fila && fila[0] && String(fila[0]).includes('del ')) {
      periodo = String(fila[0]).trim();
      break;
    }
  }
  if (!periodo) periodo = nombreArchivo + '_' + Date.now();

  const regexFecha = /^\d{1,2}\/[A-Za-z]{3}\/\d{4}$/;
  const regexCuenta = /^\d{3}-\d{2}-\d{3}$/;

  for (const fila of filas) {
    if (!fila || fila.every(v => v === null || v === '')) continue;

    const col0 = fila[0] !== null && fila[0] !== undefined ? String(fila[0]).trim() : '';

    if (regexCuenta.test(col0)) {
      cuentaActual = col0;
      nombreCuentaActual = fila[1] ? String(fila[1]).trim() : '';
      continue;
    }

    if (cuentaActual && regexFecha.test(col0)) {
      const fechaConvertida = convertirFecha(col0);
      if (!fechaConvertida) continue;

      const prefixCC = cuentaActual.split('-')[0];
      const obraId = mapaObras[prefixCC] || null;
      if (obraId) obrasDetectadas.add(prefixCC);

      const cargos = parseFloat(fila[5]) || 0;
      const abonos = parseFloat(fila[6]) || 0;
      const saldo = parseFloat(fila[7]) || 0;

      movimientos.push([
        obraId,
        cuentaActual,
        nombreCuentaActual,
        fechaConvertida,
        fila[1] ? String(fila[1]).trim() : null,
        fila[2] ? String(fila[2]).trim() : null,
        fila[3] ? String(fila[3]).trim() : null,
        fila[4] ? String(fila[4]).trim() : null,
        cargos,
        abonos,
        saldo,
        periodo
      ]);
    }
  }

  if (periodo) {
    await pool.query('DELETE FROM movimientos_contables WHERE periodo = $1', [periodo]);
  }

  const loteSize = 500;
  for (let i = 0; i < movimientos.length; i += loteSize) {
    const lote = movimientos.slice(i, i + loteSize);
    const values = [];
    const placeholders = lote.map((m, idx) => {
      const base = idx * 12;
      values.push(...m);
      return '($' + (base+1) + ',$' + (base+2) + ',$' + (base+3) + ',$' + (base+4) + ',$' + (base+5) + ',$' + (base+6) + ',$' + (base+7) + ',$' + (base+8) + ',$' + (base+9) + ',$' + (base+10) + ',$' + (base+11) + ',$' + (base+12) + ')';
    }).join(',');

    const query = 'INSERT INTO movimientos_contables (obra_id, cuenta, nombre_cuenta, fecha, tipo, numero_poliza, concepto, referencia, cargos, abonos, saldo, periodo) VALUES ' + placeholders;

    await pool.query(query, values);
  }

  await pool.query(
    'INSERT INTO cargas_auxiliar (nombre_archivo, periodo, total_movimientos, obras_detectadas) VALUES ($1,$2,$3,$4)',
    [nombreArchivo, periodo, movimientos.length, Array.from(obrasDetectadas).join(',')]
  );

  return {
    total_movimientos: movimientos.length,
    obras_detectadas: Array.from(obrasDetectadas),
    periodo
  };
};

module.exports = parsearAuxiliar;
