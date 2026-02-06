import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CityProvider } from "./context/CityContext";
import { ToastProvider } from "./context/ToastContext";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import UserOnlyRoute from "./components/Auth/UserOnlyRoute";
import AuthCallback from "./components/Auth/AuthCallback";
import Navbar from "./components/Home/Navbar";
import Home from "./components/Home/Home";
import { SuperguiaContainer } from "./components/Superguia";
import { cleanAuthTokensFromUrl } from "./lib/supabase";

// Lazy loading de rutas menos frecuentes para optimizar bundle inicial
const Publicar = lazy(() => import("./components/Home/Panorama/Publicar"));
const PublicarNegocio = lazy(
  () => import("./components/Home/Negocio/PublicarNegocio"),
);
const PanoramasPage = lazy(() => import("./components/Home/PanoramasPage"));
const Perfil = lazy(() => import("./components/Perfil/Perfil"));
const AdminPanel = lazy(() => import("./components/Admin/AdminPanel"));
const FAQ = lazy(() => import("./components/FAQ/FAQ"));

// Componente de loading para Suspense
const PageLoader = () => (
  <div className="page-loader">
    <div className="page-loader__spinner"></div>
    <p>Cargando...</p>
  </div>
);

/**
 * Componente wrapper que limpia tokens de URL al montar.
 * Actúa como backup de seguridad en caso de que lleguen tokens
 * a rutas que no son /auth/callback.
 */
const AppWithCleanup = ({ children }) => {
  useEffect(() => {
    // Limpiar tokens de la URL al cargar la app (backup de seguridad)
    // Solo si NO estamos en la ruta de callback (esa ruta lo maneja específicamente)
    if (!window.location.pathname.includes("/auth/callback")) {
      cleanAuthTokensFromUrl();
    }
  }, []);

  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <CityProvider>
            <Router>
              <AppWithCleanup>
                <Navbar />
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Callback de autenticación OAuth - DEBE estar antes de las rutas protegidas */}
                    <Route path="/auth/callback" element={<AuthCallback />} />

                    {/* Rutas públicas frecuentes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/superguia" element={<SuperguiaContainer />} />

                    {/* Rutas públicas menos frecuentes (lazy loaded) */}
                    <Route path="/panoramas" element={<PanoramasPage />} />
                    <Route
                      path="/publicar-panorama"
                      element={
                        <UserOnlyRoute>
                          <Publicar />
                        </UserOnlyRoute>
                      }
                    />
                    <Route
                      path="/publicar-negocio"
                      element={
                        <UserOnlyRoute>
                          <PublicarNegocio />
                        </UserOnlyRoute>
                      }
                    />
                    <Route path="/faq" element={<FAQ />} />

                    {/* Rutas que requieren autenticación - solo usuarios regulares */}
                    <Route
                      path="/perfil"
                      element={
                        <ProtectedRoute>
                          <UserOnlyRoute>
                            <Perfil />
                          </UserOnlyRoute>
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
              </AppWithCleanup>
            </Router>
          </CityProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
