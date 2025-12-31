import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import "./styles/protected-route.css";

/**
 * Componente para proteger rutas basado en autenticación y roles
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componente a renderizar si tiene acceso
 * @param {string[]} props.allowedRoles - Roles permitidos para acceder (ej: ['admin', 'moderator'])
 * @param {boolean} props.requireAuth - Si requiere estar autenticado (default: true)
 * @param {string} props.redirectTo - Ruta a la que redirigir si no tiene acceso (default: '/')
 */
export default function ProtectedRoute({
  children,
  allowedRoles = [],
  requireAuth = true,
  redirectTo = "/",
}) {
  const { user, userRole, loading, isAdmin, isModerator } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="protected-route-loading">
        <FontAwesomeIcon icon={faSpinner} spin size="2x" />
        <p>Verificando acceso...</p>
      </div>
    );
  }

  // Si requiere autenticación y no hay usuario, redirigir
  if (requireAuth && !user) {
    console.warn(
      "ProtectedRoute: Usuario no autenticado, redirigiendo a",
      redirectTo
    );
    return <Navigate to={redirectTo} replace />;
  }

  // Si hay roles permitidos, verificar que el usuario tenga uno de ellos
  if (allowedRoles.length > 0) {
    const hasAllowedRole = allowedRoles.some((role) => {
      if (role === "admin") return isAdmin;
      if (role === "moderator") return isModerator;
      return userRole === role;
    });

    if (!hasAllowedRole) {
      console.warn(
        `ProtectedRoute: Usuario con rol '${userRole}' no tiene acceso. Roles permitidos:`,
        allowedRoles
      );
      return <Navigate to={redirectTo} replace />;
    }
  }

  // Si pasó todas las verificaciones, renderizar el contenido
  return children;
}
