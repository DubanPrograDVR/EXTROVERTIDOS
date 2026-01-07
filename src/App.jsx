import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CityProvider } from "./context/CityContext";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import Navbar from "./components/Home/Navbar";
import Home from "./components/Home/Home";
import { SuperguiaContainer } from "./components/Superguia";

// Lazy loading de rutas menos frecuentes para optimizar bundle inicial
const Publicar = lazy(() => import("./components/Home/Panorama/Publicar"));
const PublicarNegocio = lazy(() =>
  import("./components/Home/Negocio/PublicarNegocio")
);
const PanoramasPage = lazy(() => import("./components/Home/PanoramasPage"));
const Perfil = lazy(() => import("./components/Perfil/Perfil"));
const AdminPanel = lazy(() => import("./components/Admin/AdminPanel"));

// Componente de loading para Suspense
const PageLoader = () => (
  <div className="page-loader">
    <div className="page-loader__spinner"></div>
    <p>Cargando...</p>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CityProvider>
          <Router>
            <Navbar />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Rutas públicas frecuentes */}
                <Route path="/" element={<Home />} />
                <Route path="/superguia" element={<SuperguiaContainer />} />

                {/* Rutas públicas menos frecuentes (lazy loaded) */}
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
            </Suspense>
          </Router>
        </CityProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
