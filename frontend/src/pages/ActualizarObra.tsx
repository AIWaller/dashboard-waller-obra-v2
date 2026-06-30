import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

interface Obra {
  id: number;
  nombre: string;
  cliente: string;
  centro_costo: string;
  monto_contratado: number;
  estado: string;
  link_programa_obra?: string;
}

interface Archivo {
  tipo: string;
  nombre_original: string;
  created_at: string;
}

const ARCHIVOS_REQUERIDOS = [
  { tipo: 'contrato', label: 'Contrato', accept: '.pdf', campo: 'contrato', esLink: false },
  { tipo: 'cotizacion_completa', label: 'Cotización', accept: '.xlsx,.xls', campo: 'cotizacion', esLink: false },
  { tipo: 'programa_obra', label: 'Cronograma (Programa + Avance)', accept: '', campo: '', esLink: true },
  { tipo: 'estimaciones', label: 'Estimaciones', accept: '.xlsx,.xls,.pdf', campo: 'archivo', esLink: false },
  { tipo: 'additivas', label: 'Additivas / Deductivas', accept: '.xlsx,.xls,.pdf', campo: 'archivo', esLink: false },
];

export default function ActualizarObra() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [obraSeleccionada, setObraSeleccionada] = useState<Obra | null>(null);
  const [archivos, setArchivos] = useState<Archivo[]>([]);
  const [cargando, setCargando] = useState(false);
  const [subiendo, setSubiendo] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Record<string, string>>({});
  const [mostrarInputLink, setMostrarInputLink] = useState(false);
  const [linkSheets, setLinkSheets] = useState('');
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});useEffect(() => {
    api.get('/obras').then(res => setObras(res.data));
  }, []);

  const seleccionarObra = async (obra: Obra) => {
    setObraSeleccionada(obra);
    setCargando(true);
    const res = await api.get(`/obras/${obra.id}/archivos`);
    setArchivos(res.data);
    setCargando(false);
  };

  const recargarArchivos = async () => {
    if (!obraSeleccionada) return;
    const res = await api.get(`/obras/${obraSeleccionada.id}/archivos`);
    setArchivos(res.data);
    const resObra = await api.get('/obras');
    const actualizada = resObra.data.find((o: Obra) => o.id === obraSeleccionada.id);
    if (actualizada) setObraSeleccionada(actualizada);
  };

  const getEstado = (tipo: string) => {
    const archivo = archivos.find(a => a.tipo === tipo);
    if (archivo) return {
      icono: '✅', label: tipo === 'programa_obra' ? 'Vinculado' : 'Subido',
      fecha: new Date(archivo.created_at).toLocaleDateString('es-MX'),
      color: '#22c55e'
    };
    return { icono: '⚪', label: 'Pendiente', fecha: '—', color: '#64748b' };
  };

  const subirArchivo = async (tipo: string, campo: string, file: File) => {
    if (!obraSeleccionada) return;
    setSubiendo(tipo);
    setMensajes(prev => ({ ...prev, [tipo]: 'Subiendo...' }));
    try {
      const formData = new FormData();
      formData.append(campo, file);
      if (tipo === 'cotizacion_completa') {
        await api.post(`/obras/${obraSeleccionada.id}/cotizacion-completa`, formData);
      } else if (tipo === 'estimaciones') {
        await api.post(`/obras/${obraSeleccionada.id}/estimaciones`, formData);
      } else {
        await api.post(`/obras/${obraSeleccionada.id}/archivo`, formData);
      }
      await recargarArchivos();
      setMensajes(prev => ({ ...prev, [tipo]: '✅ Subido correctamente' }));
      setTimeout(() => setMensajes(prev => ({ ...prev, [tipo]: '' })), 3000);
    } catch (err) {
      setMensajes(prev => ({ ...prev, [tipo]: '❌ Error al subir' }));
    }
    setSubiendo(null);
  };

  const guardarLink = async () => {
    if (!obraSeleccionada || !linkSheets) return;
    setSubiendo('programa_obra');
    setMensajes(prev => ({ ...prev, programa_obra: 'Validando link...' }));
    try {
      await api.post(`/obras/${obraSeleccionada.id}/programa-obra/link`, { link: linkSheets });
      await recargarArchivos();
      setMensajes(prev => ({ ...prev, programa_obra: '✅ Vinculado correctamente' }));
      setMostrarInputLink(false);
      setLinkSheets('');
      setTimeout(() => setMensajes(prev => ({ ...prev, programa_obra: '' })), 3000);
    } catch (err) {
      setMensajes(prev => ({ ...prev, programa_obra: '❌ Link inválido o sin acceso' }));
    }
    setSubiendo(null);
  };return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Actualizar Obra</h1>

      {!obraSeleccionada ? (
        <div style={{ marginTop: '1.5rem' }}>
          <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>Selecciona la obra que quieres actualizar:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {obras.map(obra => (
              <div
                key={obra.id}
                onClick={() => seleccionarObra(obra)}
                style={{
                  padding: '1rem 1.5rem',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <p style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{obra.nombre}</p>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{obra.cliente} — CC: {obra.centro_costo}</p>
                </div>
                <span style={{ color: '#22c55e', fontSize: '0.85rem' }}>● {obra.estado}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ marginBottom: '0.25rem' }}>{obraSeleccionada.nombre}</h2>
              <p style={{ color: '#94a3b8' }}>{obraSeleccionada.cliente} — CC: {obraSeleccionada.centro_costo}</p>
            </div>
            <button
              onClick={() => { setObraSeleccionada(null); setArchivos([]); setMensajes({}); }}
              style={{ padding: '0.4rem 1rem', backgroundColor: 'transparent', border: '1px solid #334155', borderRadius: '4px', color: '#94a3b8', cursor: 'pointer' }}
            >
              ← Cambiar obra
            </button>
          </div>
{cargando ? (
            <p style={{ color: '#94a3b8' }}>Cargando archivos...</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#1e40af', color: 'white' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Archivo</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Estado</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Última versión</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {ARCHIVOS_REQUERIDOS.map(({ tipo, label, accept, campo, esLink }) => {
                  const estado = getEstado(tipo);
                  return (
                    <tr key={tipo} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{label}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', color: estado.color }}>
                        {estado.icono} {estado.label}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', color: '#94a3b8' }}>
                        {estado.fecha}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {esLink ? (
                          <button
                            onClick={() => setMostrarInputLink(true)}
                            disabled={subiendo === tipo}
                            style={{
                              padding: '0.3rem 0.75rem',
                              backgroundColor: estado.label === 'Vinculado' ? '#334155' : '#2563eb',
                              color: 'white', border: 'none', borderRadius: '4px',
                              cursor: 'pointer', fontSize: '0.85rem'
                            }}
                          >
                            {estado.label === 'Vinculado' ? 'Actualizar link' : 'Pegar link'}
                          </button>
                        ) : (
                          <>
                            <input
                              type="file"
                              accept={accept}
                              style={{ display: 'none' }}
                              ref={el => { inputRefs.current[tipo] = el; }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) subirArchivo(tipo, campo, file);
                              }}
                            />
                            <button
                              onClick={() => inputRefs.current[tipo]?.click()}
                              disabled={subiendo === tipo}
                              style={{
                                padding: '0.3rem 0.75rem',
                                backgroundColor: estado.label === 'Subido' ? '#334155' : '#2563eb',
                                color: 'white', border: 'none', borderRadius: '4px',
                                cursor: 'pointer', fontSize: '0.85rem'
                              }}
                            >
                              {subiendo === tipo ? 'Subiendo...' : estado.label === 'Subido' ? 'Actualizar' : 'Subir'}
                            </button>
                          </>
                        )}
                        {mensajes[tipo] && (
                          <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: mensajes[tipo].includes('✅') ? '#22c55e' : '#ef4444' }}>
                            {mensajes[tipo]}
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}{mostrarInputLink && (
            <div style={{ marginTop: '1.5rem', padding: '1.5rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '0.75rem' }}>Pega el link de Google Sheets del cronograma</p>
              <input
                type="text"
                value={linkSheets}
                onChange={(e) => setLinkSheets(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={guardarLink}
                  disabled={!linkSheets || subiendo === 'programa_obra'}
                  style={{ padding: '0.4rem 1.5rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  {subiendo === 'programa_obra' ? 'Validando...' : 'Guardar'}
                </button>
                <button
                  onClick={() => { setMostrarInputLink(false); setLinkSheets(''); }}
                  style={{ padding: '0.4rem 1.5rem', backgroundColor: 'transparent', border: '1px solid #334155', color: '#94a3b8', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
