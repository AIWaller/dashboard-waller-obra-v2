-- OBRAS
CREATE TABLE IF NOT EXISTS obras (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  cliente VARCHAR(255),
  centro_costo VARCHAR(100),
  monto_contratado NUMERIC(15,2),
  fecha_inicio DATE,
  fecha_vigencia DATE,
  condiciones_pago TEXT,
  retenciones TEXT,
  estado VARCHAR(50) DEFAULT 'activa',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ARCHIVOS POR OBRA
CREATE TABLE IF NOT EXISTS archivos (
  id SERIAL PRIMARY KEY,
  obra_id INTEGER REFERENCES obras(id),
  tipo VARCHAR(100),
  nombre_original VARCHAR(255),
  ruta_minio VARCHAR(500),
  version INTEGER DEFAULT 1,
  activo BOOLEAN DEFAULT true,
  subido_por VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ESTIMACIONES
CREATE TABLE IF NOT EXISTS estimaciones (
  id SERIAL PRIMARY KEY,
  obra_id INTEGER REFERENCES obras(id),
  numero INTEGER,
  monto NUMERIC(15,2),
  fecha DATE,
  estado VARCHAR(50) DEFAULT 'generada',
  created_at TIMESTAMP DEFAULT NOW()
);

-- CAMBIOS (ADDITIVAS Y DEDUCTIVAS)
CREATE TABLE IF NOT EXISTS cambios (
  id SERIAL PRIMARY KEY,
  obra_id INTEGER REFERENCES obras(id),
  tipo VARCHAR(50),
  descripcion TEXT,
  monto NUMERIC(15,2),
  estado VARCHAR(50) DEFAULT 'pendiente',
  fecha DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- BITÁCORA
CREATE TABLE IF NOT EXISTS bitacora (
  id SERIAL PRIMARY KEY,
  obra_id INTEGER REFERENCES obras(id),
  texto_original TEXT,
  texto_transcrito TEXT,
  nivel_alerta VARCHAR(20),
  ruta_imagen VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);
