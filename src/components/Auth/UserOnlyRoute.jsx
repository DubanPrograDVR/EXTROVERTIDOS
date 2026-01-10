import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import "./styles/protected-route.css";

/**
 * Componente para rutas exclusivas de usuarios regulares
 * Los administradores y moderadores serán redirigidos al panel admin
 *
 * Uso: Rutas como /publicar-panorama, /publicar-negocio, /perfil
 * que NO deben ser accesibles para admins/moderadores
 */
export default function UserOnlyRoute({ children }) {
  const { user, loading, isModerator } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="protected-route-loading">
        <FontAwesomeIcon icon={faSpinner} spin size="2x" />
        <p>Verificando acceso...</p>
      </div>
    );
  }

  // Si es admin o moderador, redirigir al panel admin
  if (user && isModerator) {
    console.log(
      "UserOnlyRoute: Admin/Moderador detectado, redirigiendo a /admin"
    );
    return <Navigate to="/admin" replace />;
  }

  // Usuario regular o no autenticado puede continuar
  return children;
}
