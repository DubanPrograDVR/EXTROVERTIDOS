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
  const processedRef = useRef(false);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  useEffect(() => {
    // Evitar doble ejecución (StrictMode)
    if (processedRef.current) return;
    processedRef.current = true;

    const handleAuthCallback = async () => {
      try {
        console.log("[AuthCallback] Procesando callback de autenticación...");

        // ── Flujo Google directo: id_token en el hash fragment ──
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        const idToken = hashParams.get("id_token");

        if (idToken) {
          console.log("[AuthCallback] id_token detectado (Google directo)");

          // Limpiar hash de la URL por seguridad
          window.history.replaceState(null, "", window.location.pathname);

          // Recuperar nonce raw desde localStorage (compartido cross-tab)
          const rawNonce = localStorage.getItem("googleAuthNonce");
          localStorage.removeItem("googleAuthNonce");

          // SIEMPRE autenticar aquí directamente — esto guarda la sesión
          // en localStorage, y la ventana principal la detecta vía
          // Supabase onAuthStateChange (cross-tab storage event)
          const { error: signInError } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: idToken,
            ...(rawNonce && { nonce: rawNonce }),
          });

          if (signInError) {
            console.error(
              "[AuthCallback] Error signInWithIdToken:",
              signInError,
            );

            // Si el error es de nonce, reintentar SIN nonce
            // (puede ocurrir si el nonce se perdió por COOP/sessionStorage aislado)
            if (signInError.message?.includes("nonce")) {
              console.log("[AuthCallback] Reintentando sin nonce...");
              const { error: retryError } =
                await supabase.auth.signInWithIdToken({
                  provider: "google",
                  token: idToken,
                });

              if (retryError) {
                console.error(
                  "[AuthCallback] Retry sin nonce falló:",
                  retryError,
                );
                setError(retryError.message);
                redirectTimerRef.current = setTimeout(
                  () => navigate("/", { replace: true }),
                  2000,
                );
                return;
              }
            } else {
              setError(signInError.message);
              redirectTimerRef.current = setTimeout(
                () => navigate("/", { replace: true }),
                2000,
              );
              return;
            }
          }

          console.log("[AuthCallback] Sesión establecida correctamente");

          // Detectar si somos un popup via flag en localStorage
          // (window.opener es null por COOP de Google, así que usamos este flag)
          const isPopup = localStorage.getItem("googleAuthIsPopup") === "true";
          localStorage.removeItem("googleAuthIsPopup");

          if (isPopup) {
            // La sesión ya está en localStorage → la ventana principal
            // la detecta vía Supabase onAuthStateChange (cross-tab)
            window.close();
            return;
          }

          // Fallback: si no podemos cerrar (no somos popup), navegar normalmente
          let returnUrl = sessionStorage.getItem("authReturnUrl") || "/";
          sessionStorage.removeItem("authReturnUrl");
          if (!returnUrl.startsWith("/") || returnUrl.startsWith("//")) {
            returnUrl = "/";
          }
          navigate(returnUrl, { replace: true });
          return;
        }

        // ── Flujo Supabase PKCE (redirect normal) ──
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

        // Navegar a la URL de retorno
        let returnUrl = sessionStorage.getItem("authReturnUrl") || "/";
        sessionStorage.removeItem("authReturnUrl");

        // SEGURIDAD: Validar que la URL sea una ruta interna válida
        if (!returnUrl.startsWith("/") || returnUrl.startsWith("//")) {
          returnUrl = "/";
        }

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
