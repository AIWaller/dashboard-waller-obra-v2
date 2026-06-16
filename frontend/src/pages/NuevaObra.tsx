import { useState } from 'react';
import api from '../services/api';

interface DatosContrato {
  nombre_obra: string;
  cliente: string;
  centro_costo: string;
  monto_contratado: number;
  fecha_inicio: string;
  fecha_vigencia: string;
  condiciones_pago: string;
  retenciones: string;
  notas_importantes: string;
}

export default function NuevaObra() {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [cargando, setCargando] = useState(false);
  const [datos, setDatos] = useState<DatosContrato | null>(null);
  const [archivoMinio, setArchivoMinio] = useState('');
  const [mensaje, setMensaje] = useState('');

  const subirContrato = async () => {
    if (!archivo) return;
    setCargando(true);
    setMensaje('Analizando contrato con IA...');
    try {
      const formData = new FormData();
      formData.append('contrato', archivo);
      const res = await api.post('/contratos/analizar', formData);
      setDatos(res.data.datos_extraidos);
      setArchivoMinio(res.data.archivo);
      setMensaje('');
    } catch (err) {
      setMensaje('Error al analizar el contrato');
    }
    setCargando(false);
  };

  const confirmarObra = async () => {
    if (!datos) return;
    setCargando(true);
    setMensaje('Registrando obra...');
    try {
      await api.post('/contratos/confirmar', {
        ...datos,
        archivo_minio: archivoMinio
      });
      setMensaje('Obra registrada correctamente');
      setDatos(null);
      setArchivo(null);
    } catch (err) {
      setMensaje('Error al registrar la obra');
    }
    setCargando(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Registrar Obra Nueva</h1>
      {!datos && (
        <div style={{ marginTop: '1rem' }}>
          <p>Sube el contrato en PDF para que la IA extraiga los datos.</p>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setArchivo(e.target.files?.[0] || null)}
            style={{ marginTop: '1rem', display: 'block' }}
          />
          <button
            onClick={subirContrato}
            disabled={!archivo || cargando}
            style={{ marginTop: '1rem', padding: '0.5rem 1.5rem' }}
          >
            {cargando ? 'Analizando...' : 'Analizar Contrato'}
          </button>
        </div>
      )}
      {mensaje && (
        <p style={{ marginTop: '1rem', color: 'green' }}>{mensaje}</p>
      )}
      {datos && (
        <div style={{ marginTop: '2rem' }}>
          <h2>Datos Extraidos - Verifica y corrige si es necesario</h2>
          {Object.entries(datos).map(([campo, valor]) => (
            <div key={campo} style={{ marginTop: '0.75rem' }}>
              <label style={{ display: 'block', fontWeight: 'bold' }}>
                {campo.replace(/_/g, ' ')}
              </label>
              <input
                type="text"
                value={valor as string}
                onChange={(e) => setDatos({ ...datos, [campo]: e.target.value })}
                style={{ width: '100%', padding: '0.4rem', marginTop: '0.2rem' }}
              />
            </div>
          ))}
          <button
            onClick={confirmarObra}
            disabled={cargando}
            style={{ marginTop: '1.5rem', padding: '0.5rem 2rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            {cargando ? 'Registrando...' : 'Confirmar y Registrar Obra'}
          </button>
        </div>
      )}
    </div>
  );
}
