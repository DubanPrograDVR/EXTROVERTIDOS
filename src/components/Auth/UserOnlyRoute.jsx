import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import "./styles/protected-route.css";

// Rutas de publicación donde los admins SÍ pueden acceder.
// Las subrutas se permiten solo cuando el prefijo termina en un segmento
// completo; /publicar-panorama-falso no debe pasar este guard.
const ADMIN_ALLOWED_PATHS = [
  "/crear-publicacion",
  "/publicar-panorama",
  "/publicar-negocio",
];

/**
 * Componente para rutas exclusivas de usuarios regulares
 * Los administradores y moderadores serán redirigidos al panel admin
 * EXCEPTO en rutas de publicación donde pueden crear contenido
 *
 * Uso: Rutas como /perfil que NO deben ser accesibles para admins/moderadores
 */
export default function UserOnlyRoute({ children }) {
  const { user, loading, isModerator } = useAuth();
  const location = useLocation();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="protected-route-loading">
        <FontAwesomeIcon icon={faSpinner} spin size="2x" />
        <p>Verificando acceso...</p>
      </div>
    );
  }

  // Verificar si la ruta actual está permitida para admins
  const isAdminAllowedPath = ADMIN_ALLOWED_PATHS.some(
    (path) =>
      location.pathname === path || location.pathname.startsWith(`${path}/`),
  );

  // Si es admin o moderador Y NO está en una ruta permitida, redirigir al panel admin
  if (user && isModerator && !isAdminAllowedPath) {
    return <Navigate to="/admin" replace />;
  }

  // Usuario regular, no autenticado, o admin en ruta permitida puede continuar
  return children;
}
