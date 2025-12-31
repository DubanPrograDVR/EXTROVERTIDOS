import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CityProvider } from "./context/CityContext";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
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
      <CityProvider>
        <Router>
          <Navbar />
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/superguia" element={<SuperguiaContainer />} />
            <Route path="/panoramas" element={<PanoramasPage />} />
            <Route path="/publicar-panorama" element={<Publicar />} />
            <Route path="/publicar-negocio" element={<PublicarNegocio />} />

            {/* Rutas que requieren autenticación */}
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <Perfil />
                </ProtectedRoute>
              }
            />

            {/* Panel de administración - solo admin y moderator */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin", "moderator"]}>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </CityProvider>
    </AuthProvider>
  );
}

export default App;
