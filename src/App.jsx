import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Home/Navbar";
import Home from "./components/Home/Home";
import { SuperguiaContainer } from "./components/Superguia";
import Publicar from "./components/Home/Panorama/Publicar";
import PublicarNegocio from "./components/Home/Negocio/PublicarNegocio";
import PanoramasPage from "./components/Home/PanoramasPage";
import Perfil from "./components/Perfil/Perfil";
import AdminPanel from "./components/Admin/AdminPanel";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/superguia" element={<SuperguiaContainer />} />
          <Route path="/panoramas" element={<PanoramasPage />} />
          <Route path="/publicar-panorama" element={<Publicar />} />
          <Route path="/publicar-negocio" element={<PublicarNegocio />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
