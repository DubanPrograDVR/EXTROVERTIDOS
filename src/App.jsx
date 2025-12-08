import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Home/Navbar";
import Home from "./components/Home/Home";
import { SuperguiaContainer } from "./components/Superguia";
import Publicar from "./components/Home/Panorama/Publicar";
import SupabaseTest from "./components/SupabaseTest";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/superguia" element={<SuperguiaContainer />} />
          <Route path="/publicar-panorama" element={<Publicar />} />
        </Routes>

        {/* Componente de prueba - ELIMINAR después de verificar conexión */}
      </Router>
    </AuthProvider>
  );
}

export default App;
