import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, cleanAuthTokensFromUrl } from "../../lib/supabase";

/**
 * AuthCallback - Componente para manejar el callback de autenticación OAuth.
 *
 * Este componente se encarga de:
 * 1. Procesar el código de autorización de OAuth (PKCE flow)
 * 2. Intercambiar el código por una sesión válida
 * 3. Limpiar la URL de cualquier token o código sensible
 * 4. Redirigir al usuario a la página principal
 *
 * ⚠️ IMPORTANTE: Esta ruta debe estar configurada en Supabase Dashboard
 * como una URL de redirección permitida:
 * - Development: http://localhost:5173/auth/callback
 * - Production: https://tu-dominio.com/auth/callback
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const redirectTimerRef = useRef(null);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("[AuthCallback] Procesando callback de autenticación...");

        // Obtener la sesión - esto procesa automáticamente el código PKCE
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error(
            "[AuthCallback] Error obteniendo sesión:",
            sessionError,
          );
          setError(sessionError.message);
          // Esperar un momento antes de redirigir para que el usuario vea el error
          redirectTimerRef.current = setTimeout(
            () => navigate("/", { replace: true }),
            2000,
          );
          return;
        }

        // Limpiar tokens de la URL inmediatamente
        cleanAuthTokensFromUrl();

        if (session) {
          console.log("[AuthCallback] Sesión establecida correctamente");
        } else {
          console.log(
            "[AuthCallback] No hay sesión, el listener de auth se encargará",
          );
        }

        // Obtener la URL de retorno guardada o usar la raíz
        let returnUrl = sessionStorage.getItem("authReturnUrl") || "/";
        sessionStorage.removeItem("authReturnUrl");

        // SEGURIDAD: Validar que la URL sea una ruta interna válida
        // Previene open redirect si alguien inyecta una URL externa
        if (!returnUrl.startsWith("/") || returnUrl.startsWith("//")) {
          returnUrl = "/";
        }

        // Redirigir a la página de destino
        navigate(returnUrl, { replace: true });
      } catch (err) {
        console.error("[AuthCallback] Error inesperado:", err);
        setError("Error procesando la autenticación");
        cleanAuthTokensFromUrl();
        redirectTimerRef.current = setTimeout(
          () => navigate("/", { replace: true }),
          2000,
        );
      }
    };

    handleAuthCallback();
  }, [navigate]);

  // UI mínima mientras se procesa
  return (
    <div className="auth-callback">
      <div className="auth-callback__container">
        {error ? (
          <>
            <div className="auth-callback__error">⚠️</div>
            <p className="auth-callback__text auth-callback__text--error">
              {error}
            </p>
            <p className="auth-callback__subtext">Redirigiendo...</p>
          </>
        ) : (
          <>
            <div className="auth-callback__spinner"></div>
            <p className="auth-callback__text">Iniciando sesión...</p>
          </>
        )}
      </div>

      <style>{`
        .auth-callback {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
        }

        .auth-callback__container {
          text-align: center;
          padding: 40px;
        }

        .auth-callback__spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(255, 102, 0, 0.2);
          border-top-color: #ff6600;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        .auth-callback__error {
          font-size: 48px;
          margin-bottom: 20px;
        }

        .auth-callback__text {
          color: #fff;
          font-size: 1.2rem;
          margin: 0;
        }

        .auth-callback__text--error {
          color: #ff4444;
        }

        .auth-callback__subtext {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.9rem;
          margin-top: 10px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AuthCallback;
