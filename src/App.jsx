import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Home/Navbar";
import Home from "./components/Home/Home";
import { SuperguiaContainer } from "./components/Superguia";
import SupabaseTest from "./components/SupabaseTest";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/superguia" element={<SuperguiaContainer />} />
      </Routes>

      {/* Componente de prueba - ELIMINAR después de verificar conexión */}
      <SupabaseTest />
    </Router>
  );
}

export default App;
