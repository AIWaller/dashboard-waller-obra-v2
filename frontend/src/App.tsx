import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NuevaObra from './pages/NuevaObra';
import SubirCotizacion from './pages/SubirCotizacion';
import SubirCotizacionCompleta from './pages/SubirCotizacionCompleta';
import ActualizarObra from './pages/ActualizarObra';
import CatalogosGenerales from './pages/CatalogosGenerales';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ActualizarObra />} />
        <Route path="/nueva-obra" element={<NuevaObra />} />
        <Route path="/cotizacion" element={<SubirCotizacion />} />
        <Route path="/cotizacion-completa" element={<SubirCotizacionCompleta />} />
        <Route path="/actualizar-obra" element={<ActualizarObra />} />
        <Route path="/catalogos-generales" element={<CatalogosGenerales />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
