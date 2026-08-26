import { lazy, Suspense, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CityProvider } from "./context/CityContext";
import { ToastProvider } from "./context/ToastContext";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import UserOnlyRoute from "./components/Auth/UserOnlyRoute";
import AuthCallback from "./components/Auth/AuthCallback";
import Navbar from "./components/Home/Navbar";
import Home from "./components/Home/Home";
import WelcomeSplash from "./components/WelcomeSplash";
import AccessGate from "./components/WelcomeSplash/AccessGate";
import { ACCESS_ROUTE } from "./components/WelcomeSplash/WelcomeSplash";
import { cleanAuthTokensFromUrl } from "./lib/supabase";
import useAnalytics from "./hooks/useAnalytics";
import { LOCATIONS } from "./components/Superguia/data";

// Lazy loading de rutas menos frecuentes para optimizar bundle inicial
const CrearPublicacion = lazy(
  () => import("./components/Home/CrearPublicacion/CrearPublicacion"),
);
const Publicar = lazy(() => import("./components/Home/Panorama/Publicar"));
const PublicarNegocio = lazy(
  () => import("./components/Home/Negocio/PublicarNegocio"),
);
const Perfil = lazy(() => import("./components/Perfil/Perfil"));
const AdminPanel = lazy(() => import("./components/Admin/AdminPanel"));
const FAQ = lazy(() => import("./components/FAQ/FAQ"));
const Terminos = lazy(() => import("./components/Legal/Terminos"));
const Privacidad = lazy(() => import("./components/Legal/Privacidad"));
const ActivarPlan = lazy(() => import("./components/Planes/ActivarPlan"));
const PaymentResult = lazy(() => import("./components/Planes/PaymentResult"));

// Componente de loading para Suspense
const PageLoader = () => (
  <div className="page-loader">
    <div className="page-loader__spinner"></div>
    <p>Cargando...</p>
  </div>
);

const normalizarRuta = (valor) =>
  String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CL")
    .trim();

const encontrarUbicacion = (valor) => {
  const buscado = normalizarRuta(valor);
  return Object.entries(LOCATIONS).find(
    ([clave, ciudad]) =>
      buscado === normalizarRuta(clave) ||
      buscado === normalizarRuta(ciudad.nombre) ||
      ciudad.comunas.some((comuna) => normalizarRuta(comuna) === buscado),
  )?.[0];
};

/** Traduce deep links antiguos al namespace de cada sección del Home. */
const LegacyHomeRedirect = ({ namespace }) => {
  const location = useLocation();
  const parametros = new URLSearchParams(location.search);
  const ciudad = parametros.get("ciudad");
  const ciudadKey = ciudad ? encontrarUbicacion(ciudad) : null;
  const prefijo = namespace === "p" ? "p_" : "sg_";

  if (ciudad) {
    parametros.delete("ciudad");
    parametros.set(
      `${prefijo}${ciudadKey ? "ciudad" : "busqueda"}`,
      ciudadKey || ciudad,
    );
  }

  const highlight = parametros.get("highlight");
  if (highlight) {
    parametros.delete("highlight");
    parametros.set(`${prefijo}highlight`, highlight);
  }

  return (
    <Navigate
      replace
      to={{
        pathname: "/",
        search: parametros.toString() ? `?${parametros.toString()}` : "",
        hash: location.hash,
      }}
    />
  );
};

/**
 * Componente wrapper que limpia tokens de URL al montar.
 * Actúa como backup de seguridad en caso de que lleguen tokens
 * a rutas que no son /auth/callback.
 */
const AppWithCleanup = ({ children }) => {
  useAnalytics();

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
            {/* Splash de bienvenida — overlay desacoplado del router.
                Para desactivarlo: src/components/WelcomeSplash/WelcomeSplash.jsx -> SPLASH_ENABLED = false */}
            <WelcomeSplash />
            <Router>
              <AppWithCleanup>
                <Navbar />
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Ruta de acceso para cliente: abre login sin mostrar el splash. */}
                    <Route path={ACCESS_ROUTE} element={<AccessGate />} />

                    {/* Callback de autenticación OAuth - DEBE estar antes de las rutas protegidas */}
                    <Route path="/auth/callback" element={<AuthCallback />} />

                    {/* Rutas públicas frecuentes */}
                    <Route path="/" element={<Home />} />
                    {/* Alias compatible: el Home canónico continúa siendo /. */}
                    <Route
                      path="/home"
                      element={<LegacyHomeRedirect namespace="p" />}
                    />

                    {/* Rutas antiguas: el contenido vive ahora en el Home. */}
                    <Route
                      path="/panoramas"
                      element={<LegacyHomeRedirect namespace="p" />}
                    />
                    <Route
                      path="/superguia"
                      element={<LegacyHomeRedirect namespace="sg" />}
                    />

                    {/* Pantalla única de selección: panorama gratuito,
                        panorama destacado o negocio. Navega a las rutas de
                        formulario con el plan ya resuelto en la query. */}
                    <Route
                      path="/crear-publicacion"
                      element={
                        <UserOnlyRoute>
                          <CrearPublicacion />
                        </UserOnlyRoute>
                      }
                    />
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
                    <Route path="/terminos" element={<Terminos />} />
                    <Route path="/privacidad" element={<Privacidad />} />
                    <Route
                      path="/activar-plan"
                      element={
                        <UserOnlyRoute>
                          <ActivarPlan />
                        </UserOnlyRoute>
                      }
                    />
                    {/* Resultado de pago - accesible sin auth obligatoria
                        porque Transbank redirige aquí después del pago */}
                    <Route path="/payment/result" element={<PaymentResult />} />

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
