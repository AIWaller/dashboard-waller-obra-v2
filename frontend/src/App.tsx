import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NuevaObra from './pages/NuevaObra';
import SubirCotizacion from './pages/SubirCotizacion';
import SubirCotizacionCompleta from './pages/SubirCotizacionCompleta';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NuevaObra />} />
        <Route path="/nueva-obra" element={<NuevaObra />} />
        <Route path="/cotizacion" element={<SubirCotizacion />} />
        <Route path="/cotizacion-completa" element={<SubirCotizacionCompleta />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
