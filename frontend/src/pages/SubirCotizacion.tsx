import { useState, useEffect } from 'react';
import api from '../services/api';

interface Obra {
  id: number;
  nombre: string;
  cliente: string;
  monto_contratado: number;
}

export default function SubirCotizacion() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [obraSeleccionada, setObraSeleccionada] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [partidas, setPartidas] = useState<any[]>([]);

  useEffect(() => {
    api.get('/obras').then(res => setObras(res.data));
  }, []);

  const subirCotizacion = async () => {
    if (!archivo || !obraSeleccionada) return;
    setCargando(true);
    setMensaje('Analizando cotización con IA...');
    try {
      const formData = new FormData();
      formData.append('cotizacion', archivo);
      const res = await api.post(`/obras/${obraSeleccionada}/cotizacion`, formData);
      setPartidas(res.data.partidas);
      setMensaje('');
    } catch (err) {
      setMensaje('Error al analizar la cotización');
    }
    setCargando(false);
  };

  const obraActual = obras.find(o => o.id === Number(obraSeleccionada));
  const montoContrato = Number(obraActual?.monto_contratado || 0);
  const montoCotizacion = partidas.reduce((sum, p) => sum + (p.importe || 0), 0);
  const diferencia = montoCotizacion - montoContrato;
  const colorDiff = Math.abs(diferencia) < 1 ? '#22c55e' : Math.abs(diferencia / montoContrato) < 0.05 ? '#f59e0b' : '#ef4444';
  const iconoDiff = Math.abs(diferencia) < 1 ? '✅' : Math.abs(diferencia / montoContrato) < 0.05 ? '⚠️' : '❌';return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Subir Cotización</h1>

      <div style={{ marginTop: '1rem' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Selecciona la obra
        </label>
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
          Archivo de cotización (Excel)
        </label>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => setArchivo(e.target.files?.[0] || null)}
        />
      </div>

      <button
        onClick={subirCotizacion}
        disabled={!archivo || !obraSeleccionada || cargando}
        style={{ marginTop: '1.5rem', padding: '0.5rem 2rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px' }}
      >
        {cargando ? 'Analizando...' : 'Analizar Cotización'}
      </button>

      {mensaje && <p style={{ marginTop: '1rem', color: 'gray' }}>{mensaje}</p>}
{partidas.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <div style={{ padding: '1.5rem', borderRadius: '8px', backgroundColor: '#1e293b', marginBottom: '2rem', border: '1px solid #334155' }}>
            <h2 style={{ marginBottom: '1rem' }}>Resumen de Validación</h2>
            <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
              <div>
                <p style={{ color: '#94a3b8', marginBottom: '0.25rem' }}>Monto Contrato</p>
                <p style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>
                  ${montoContrato.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p style={{ color: '#94a3b8', marginBottom: '0.25rem' }}>Monto Cotización</p>
                <p style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>
                  ${montoCotizacion.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p style={{ color: '#94a3b8', marginBottom: '0.25rem' }}>Diferencia</p>
                <p style={{ fontSize: '1.4rem', fontWeight: 'bold', color: colorDiff }}>
                  {diferencia >= 0 ? '+' : ''}${diferencia.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {iconoDiff}
                </p>
              </div>
            </div>
          </div>

          <h2>Partidas Extraídas ({partidas.length})</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#1e40af', color: 'white' }}>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Código</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Descripción</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Unidad</th>
                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Cantidad</th>
                <th style={{ padding: '0.5rem', textAlign: 'right' }}>P.U.</th>
                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Importe</th>
              </tr>
            </thead>
            <tbody>
              {partidas.map((p, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '0.5rem' }}>{p.codigo}</td>
                  <td style={{ padding: '0.5rem' }}>{p.descripcion}</td>
                  <td style={{ padding: '0.5rem' }}>{p.unidad}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>{p.cantidad}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>${p.precio_unitario?.toLocaleString()}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>${p.importe?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
