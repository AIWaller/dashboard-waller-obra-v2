import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NuevaObra from './pages/NuevaObra';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NuevaObra />} />
        <Route path="/nueva-obra" element={<NuevaObra />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
