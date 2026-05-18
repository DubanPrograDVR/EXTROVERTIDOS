import { Navigate } from "react-router-dom";
import AuthModal from "../Auth/AuthModal";
import { useAuth } from "../../context/AuthContext";

/**
 * Ruta de acceso para el cliente mientras el sitio público muestra el splash.
 * Si no hay sesión, abre el login. Cuando inicia sesión, entra al panel.
 */
const AccessGate = () => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/admin" replace />;

  return (
    <AuthModal
      isOpen={true}
      persistent={true}
      onClose={() => window.location.assign("/")}
    />
  );
};

export default AccessGate;
