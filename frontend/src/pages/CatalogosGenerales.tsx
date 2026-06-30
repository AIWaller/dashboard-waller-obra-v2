import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

interface CargaAuxiliar {
  id: number;
  fecha_carga: string;
  nombre_archivo: string;
  periodo: string;
  total_movimientos: number;
  obras_detectadas: string;
}

export default function CatalogosGenerales() {
  const [historial, setHistorial] = useState<CargaAuxiliar[]>([]);
  const [subiendo, setSubiendo] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Record<string, string>>({});
  const inputAuxiliarRef = useRef<HTMLInputElement | null>(null);
  const inputCatalogoRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    try {
      const res = await api.get('/catalogos/auxiliar/historial');
      setHistorial(res.data);
    } catch (err) {
      console.error('Error cargando historial');
    }
  };
const subirAuxiliar = async (file: File) => {
    setSubiendo('auxiliar');
    setMensajes(prev => ({ ...prev, auxiliar: 'Procesando libro de auxiliares...' }));
    try {
      const formData = new FormData();
      formData.append('auxiliar', file);
      const res = await api.post('/catalogos/auxiliar', formData);
      setMensajes(prev => ({ ...prev, auxiliar: `✅ ${res.data.total_movimientos} movimientos procesados — Obras: ${res.data.obras_detectadas.join(', ')}` }));
      cargarHistorial();
    } catch (err) {
      setMensajes(prev => ({ ...prev, auxiliar: '❌ Error al procesar el archivo' }));
    }
    setSubiendo(null);
  };

  const subirCatalogo = async (file: File) => {
    setSubiendo('catalogo');
    setMensajes(prev => ({ ...prev, catalogo: 'Subiendo catálogo de cuentas...' }));
    try {
      const formData = new FormData();
      formData.append('catalogo', file);
      await api.post('/catalogos/cuentas', formData);
      setMensajes(prev => ({ ...prev, catalogo: '✅ Catálogo actualizado correctamente' }));
    } catch (err) {
      setMensajes(prev => ({ ...prev, catalogo: '❌ Error al subir el catálogo' }));
    }
    setSubiendo(null);
  };return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Catálogos Generales</h1>
      <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>
        Estos archivos aplican a todas las obras. El Libro de Auxiliares se actualiza diario.
      </p>

      <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* CATÁLOGO DE CUENTAS */}
        <div style={{ padding: '1.5rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ marginBottom: '0.25rem' }}>Catálogo de Cuentas</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>ContPAQ — Se actualiza ocasionalmente</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <input
                type="file"
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                ref={inputCatalogoRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) subirCatalogo(file);
                }}
              />
              <button
                onClick={() => inputCatalogoRef.current?.click()}
                disabled={subiendo === 'catalogo'}
                style={{ padding: '0.5rem 1.5rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                {subiendo === 'catalogo' ? 'Subiendo...' : 'Actualizar'}
              </button>
              {mensajes.catalogo && (
                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: mensajes.catalogo.includes('✅') ? '#22c55e' : mensajes.catalogo.includes('❌') ? '#ef4444' : '#94a3b8' }}>
                  {mensajes.catalogo}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* LIBRO DE AUXILIARES */}
        <div style={{ padding: '1.5rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ marginBottom: '0.25rem' }}>Libro de Auxiliares</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>ContPAQ — Se actualiza diario</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <input
                type="file"
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                ref={inputAuxiliarRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) subirAuxiliar(file);
                }}
              />
              <button
                onClick={() => inputAuxiliarRef.current?.click()}
                disabled={subiendo === 'auxiliar'}
                style={{ padding: '0.5rem 1.5rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                {subiendo === 'auxiliar' ? 'Procesando...' : 'Actualizar'}
              </button>
              {mensajes.auxiliar && (
                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: mensajes.auxiliar.includes('✅') ? '#22c55e' : mensajes.auxiliar.includes('❌') ? '#ef4444' : '#94a3b8' }}>
                  {mensajes.auxiliar}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* HISTORIAL */}
        {historial.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <h3 style={{ marginBottom: '0.75rem', color: '#94a3b8' }}>Historial de cargas</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#1e40af', color: 'white' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Fecha</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Archivo</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Periodo</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Movimientos</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Obras</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((h) => (
                  <tr key={h.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '0.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                      {new Date(h.fecha_carga).toLocaleString('es-MX')}
                    </td>
                    <td style={{ padding: '0.5rem', fontSize: '0.85rem' }}>{h.nombre_archivo}</td>
                    <td style={{ padding: '0.5rem', fontSize: '0.85rem' }}>{h.periodo}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', fontSize: '0.85rem' }}>{h.total_movimientos?.toLocaleString()}</td>
                    <td style={{ padding: '0.5rem', fontSize: '0.85rem' }}>{h.obras_detectadas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
