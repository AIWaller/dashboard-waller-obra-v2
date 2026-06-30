import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

interface Cambio {
  id: number;
  tipo: string;
  numero: string;
  descripcion: string;
  monto: number;
  fecha: string;
  tiene_documento: boolean;
  nombre_archivo: string;
}

export default function CambiosObra() {
  const { obraId } = useParams();
  const [cambios, setCambios] = useState<Cambio[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [tipo, setTipo] = useState('Additiva');
  const [numero, setNumero] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
useEffect(() => {
    cargarCambios();
  }, []);

  const cargarCambios = async () => {
    try {
      const res = await api.get(`/obras/${obraId}/cambios`);
      setCambios(res.data);
    } catch (err) {
      console.error('Error cargando cambios');
    }
  };

  const guardarCambio = async () => {
    if (!monto || !fecha) return;
    setGuardando(true);
    try {
      const formData = new FormData();
      formData.append('tipo', tipo);
      formData.append('numero', numero);
      formData.append('descripcion', descripcion);
      formData.append('monto', monto);
      formData.append('fecha', fecha);
      if (archivo) formData.append('documento', archivo);

      await api.post(`/obras/${obraId}/cambios`, formData);
      await cargarCambios();
      setMostrarForm(false);
      setTipo('Additiva');
      setNumero('');
      setDescripcion('');
      setMonto('');
      setFecha('');
      setArchivo(null);
    } catch (err) {
      alert('Error al registrar el movimiento');
    }
    setGuardando(false);
  };

  const totalAdditivas = cambios.filter(c => c.tipo === 'Additiva').reduce((sum, c) => sum + Number(c.monto), 0);
  const totalDeductivas = cambios.filter(c => c.tipo === 'Deductiva').reduce((sum, c) => sum + Number(c.monto), 0);
  const impactoNeto = totalAdditivas - totalDeductivas;
return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Additivas y Deductivas</h1>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1, padding: '1rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Total Additivas</p>
          <p style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#22c55e' }}>+${totalAdditivas.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div style={{ flex: 1, padding: '1rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Total Deductivas</p>
          <p style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#ef4444' }}>-${totalDeductivas.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div style={{ flex: 1, padding: '1rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Impacto Neto</p>
          <p style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>{impactoNeto >= 0 ? '+' : ''}${impactoNeto.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <button
        onClick={() => setMostrarForm(!mostrarForm)}
        style={{ padding: '0.5rem 1.5rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '1.5rem' }}
      >
        {mostrarForm ? 'Cancelar' : '+ Registrar nuevo movimiento'}
      </button>

      {mostrarForm && (
        <div style={{ padding: '1.5rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <label><input type="radio" checked={tipo === 'Additiva'} onChange={() => setTipo('Additiva')} /> Additiva</label>
            <label><input type="radio" checked={tipo === 'Deductiva'} onChange={() => setTipo('Deductiva')} /> Deductiva</label>
          </div>
          <input placeholder="Número" value={numero} onChange={e => setNumero(e.target.value)} style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem' }} />
          <textarea placeholder="Descripción" value={descripcion} onChange={e => setDescripcion(e.target.value)} style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem' }} />
          <input type="number" placeholder="Monto" value={monto} onChange={e => setMonto(e.target.value)} style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem' }} />
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem' }} />
          <input type="file" ref={fileInputRef} onChange={e => setArchivo(e.target.files?.[0] || null)} style={{ marginBottom: '0.75rem' }} />
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.75rem' }}>Documento de respaldo (opcional, puedes subirlo después)</p>
          <button onClick={guardarCambio} disabled={guardando} style={{ padding: '0.5rem 1.5rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#1e40af', color: 'white' }}>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Tipo</th>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>No.</th>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Descripción</th>
            <th style={{ padding: '0.5rem', textAlign: 'right' }}>Monto</th>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Fecha</th>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Documento</th>
          </tr>
        </thead>
        <tbody>
          {cambios.map(c => (
            <tr key={c.id} style={{ borderBottom: '1px solid #334155' }}>
              <td style={{ padding: '0.5rem', color: c.tipo === 'Additiva' ? '#22c55e' : '#ef4444' }}>{c.tipo}</td>
              <td style={{ padding: '0.5rem' }}>{c.numero}</td>
              <td style={{ padding: '0.5rem' }}>{c.descripcion}</td>
              <td style={{ padding: '0.5rem', textAlign: 'right' }}>${Number(c.monto).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              <td style={{ padding: '0.5rem' }}>{c.fecha ? new Date(c.fecha).toLocaleDateString('es-MX') : '—'}</td>
              <td style={{ padding: '0.5rem' }}>{c.tiene_documento ? '✅ ' + c.nombre_archivo : '⚠️ Sin documento'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
