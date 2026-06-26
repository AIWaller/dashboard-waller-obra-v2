import { useState, useEffect } from 'react';
import api from '../services/api';

interface Obra {
  id: number;
  nombre: string;
  cliente: string;
  monto_contratado: number;
}

export default function SubirCotizacionCompleta() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [obraSeleccionada, setObraSeleccionada] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [resultados, setResultados] = useState<any>(null);

  useEffect(() => {
    api.get('/obras').then(res => setObras(res.data));
  }, []);

  const subirCotizacion = async () => {
    if (!archivo || !obraSeleccionada) return;
    setCargando(true);
    setMensaje('Analizando todas las pestañas con IA...');
    try {
      const formData = new FormData();
      formData.append('cotizacion', archivo);
      const res = await api.post(`/obras/${obraSeleccionada}/cotizacion-completa`, formData);
      setResultados(res.data.resultados);
      setMensaje(`✅ ${res.data.pestanas_analizadas.length} pestañas analizadas correctamente`);
    } catch (err) {
      setMensaje('Error al analizar la cotización');
    }
    setCargando(false);
  };

  const resumen = resultados?.['Resumen Cotizacion'];
  const obraActual = obras.find(o => o.id === Number(obraSeleccionada));
  const montoContrato = Number(obraActual?.monto_contratado || 0);
  const diferencia = resumen ? resumen.total_con_iva - montoContrato : 0;
  const colorDiff = Math.abs(diferencia) < 100 ? '#22c55e' : Math.abs(diferencia / montoContrato) < 0.05 ? '#f59e0b' : '#ef4444';
  const iconoDiff = Math.abs(diferencia) < 100 ? '✅' : Math.abs(diferencia / montoContrato) < 0.05 ? '⚠️' : '❌';

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>Subir Cotización Completa</h1>
      <p style={{ color: '#94a3b8' }}>El sistema analiza todas las pestañas del Excel automáticamente.</p>

      <div style={{ marginTop: '1.5rem' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Selecciona la obra</label>
        <select
          value={obraSeleccionada}
          onChange={(e) => setObraSeleccionada(e.target.value)}
          style={{ width: '100%', padding: '0.5rem' }}
        >
          <option value="">-- Seleccionar obra --</option>
          {obras.map(o => (
            <option key={o.id} value={o.id}>{o.nombre} — {o.cliente}</option>
          ))}
        </select>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Archivo Excel de cotización
        </label>
        <input type="file" accept=".xlsx,.xls" onChange={(e) => setArchivo(e.target.files?.[0] || null)} />
      </div>

      <button
        onClick={subirCotizacion}
        disabled={!archivo || !obraSeleccionada || cargando}
        style={{ marginTop: '1.5rem', padding: '0.5rem 2rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px' }}
      >
        {cargando ? 'Analizando...' : 'Analizar Cotización Completa'}
      </button>

      {mensaje && <p style={{ marginTop: '1rem', color: mensaje.includes('✅') ? '#22c55e' : '#94a3b8' }}>{mensaje}</p>}

      {resumen && (
        <div style={{ marginTop: '2rem' }}>

          {/* VALIDACIÓN */}
          <div style={{ padding: '1.5rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Validación de Montos</h2>
            <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
              <div>
                <p style={{ color: '#94a3b8' }}>Monto Contrato</p>
                <p style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>${montoContrato.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p style={{ color: '#94a3b8' }}>Total Cotización</p>
                <p style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>${resumen.total_con_iva?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p style={{ color: '#94a3b8' }}>Diferencia</p>
                <p style={{ fontSize: '1.4rem', fontWeight: 'bold', color: colorDiff }}>
                  {diferencia >= 0 ? '+' : ''}${diferencia.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {iconoDiff}
                </p>
              </div>
            </div>
          </div>

          {/* RESUMEN FINANCIERO */}
          <div style={{ padding: '1.5rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Resumen Cotización</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  ['Panel Waller', resumen.costo_panel],
                  ['Complementarios', resumen.costo_complementarios],
                  ['Mano de Obra', resumen.costo_mano_obra],
                  ['Fletes y Logística', resumen.costo_fletes_logistica],
                  ['Subtotal sin IVA', resumen.subtotal_sin_iva],
                  ['Indirectos', `${(resumen.indirectos_porcentaje > 1 ? resumen.indirectos_porcentaje.toFixed(2) : (resumen.indirectos_porcentaje * 100).toFixed(2))}%`],
                  ['Utilidad', `${(resumen.utilidad_porcentaje > 1 ? resumen.utilidad_porcentaje.toFixed(2) : (resumen.utilidad_porcentaje * 100).toFixed(2))}%`],
                  ['Total sin IVA', resumen.total_sin_iva],
                  ['IVA', resumen.iva],
                  ['Total con IVA', resumen.total_con_iva],
                ].map(([label, valor], i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '0.5rem', color: '#94a3b8' }}>{label}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: typeof valor === 'number' ? 'bold' : 'normal' }}>
                      {typeof valor === 'number' ? `$${valor.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : valor}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '2rem' }}>
              <div>
                <p style={{ color: '#94a3b8' }}>Precio m² sin IVA</p>
                <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>${resumen.precio_m2_sin_iva?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p style={{ color: '#94a3b8' }}>Precio m² con IVA</p>
                <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>${resumen.precio_m2_con_iva?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          {/* M2 POR TIPO DE MURO */}
          {resumen.m2_cotizados && (
            <div style={{ padding: '1.5rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155' }}>
              <h2 style={{ marginBottom: '1rem' }}>m² Cotizados</h2>
              <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
                <div>
                  <p style={{ color: '#94a3b8' }}>Total sin desperdicio</p>
                  <p style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{resumen.m2_cotizados.total_sin_desperdicio?.toLocaleString('en-US')} m²</p>
                </div>
                <div>
                  <p style={{ color: '#94a3b8' }}>Total con desperdicio</p>
                  <p style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{resumen.m2_cotizados.total_con_desperdicio?.toLocaleString('en-US')} m²</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
