import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { supabase } from "../lib/supabase";
import { ROLES, checkBanStatus, ensureProfileExists } from "../lib/database";
import { useToast } from "./ToastContext";
import BannedUserCard from "../components/UI/BannedUserCard";

// ──────────────────────────────────────────────────────────────
// HELPER: Logger condicional (solo en dev)
// ──────────────────────────────────────────────────────────────
const log = {
  info: (...args) => import.meta.env.DEV && console.log("[Auth]", ...args),
  warn: (...args) => console.warn("[Auth]", ...args),
  error: (...args) => console.error("[Auth]", ...args),
};

// ──────────────────────────────────────────────────────────────
// REDUCER: Un solo dispatch para user + role = un solo re-render
// ──────────────────────────────────────────────────────────────
const AUTH_ACTIONS = {
  SET_AUTH: "SET_AUTH", // user + role en un solo dispatch
  CLEAR_AUTH: "CLEAR_AUTH", // logout
  SET_LOADING: "SET_LOADING",
  INITIALIZED: "INITIALIZED",
  SET_BAN: "SET_BAN",
  CLEAR_BAN: "CLEAR_BAN",
};

const initialState = {
  user: null,
  userRole: ROLES.USER,
  loading: true,
  initialized: false,
  banInfo: null,
  showBanCard: false,
};

function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.SET_AUTH:
      return {
        ...state,
        user: action.payload.user,
        userRole: action.payload.role ?? state.userRole,
        loading: false,
      };

    case AUTH_ACTIONS.CLEAR_AUTH:
      return {
        ...state,
        user: null,
        userRole: ROLES.USER,
        loading: false,
      };

    case AUTH_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };

    case AUTH_ACTIONS.INITIALIZED:
      return { ...state, initialized: true, loading: false };

    case AUTH_ACTIONS.SET_BAN:
      return {
        ...state,
        banInfo: action.payload,
        showBanCard: true,
      };

    case AUTH_ACTIONS.CLEAR_BAN:
      return {
        ...state,
        banInfo: null,
        showBanCard: false,
      };

    default:
      return state;
  }
}

// ──────────────────────────────────────────────────────────────
// CONTEXTO
// ──────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};

/**
 * AuthProvider refactorizado
 *
 * MEJORAS vs versión anterior:
 * 1. useReducer → user + role se actualizan en UN solo re-render
 * 2. Toast separado → cambios de toast ya no re-renderizan consumidores de auth
 * 3. Funciones con useCallback → referencias estables en el value
 * 4. console.log solo en DEV → sin ruido en producción
 * 5. Visibilitychange usa ref → no se re-registra al cambiar user
 * 6. useMemo en el value → evita object nuevo cada render si nada cambió
 */
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const { user, userRole, loading, initialized, banInfo, showBanCard } = state;

  // Toast vive en su propio contexto ahora
  const { showToast } = useToast();

  // ── Refs ──────────────────────────────────────────────────
  const roleCache = useRef({ userId: null, role: ROLES.USER });
  const rolePendingPromise = useRef(null);
  const isMountedRef = useRef(true);
  // Ref para user en el listener de visibilidad (evita re-registrar el listener)
  const userRef = useRef(user);
  const showToastRef = useRef(showToast);

  // Mantener refs sincronizadas sin causar re-renders
  useEffect(() => {
    userRef.current = user;
    showToastRef.current = showToast;
  });

  // ── Cargar rol con cache y deduplicación de promesas ─────
  const loadUserRole = useCallback(async (userId, forceRefresh = false) => {
    if (!userId) return ROLES.USER;

    // Cache hit
    if (!forceRefresh && roleCache.current.userId === userId) {
      log.info("Rol desde cache:", roleCache.current.role);
      return roleCache.current.role;
    }

    // Si ya hay una consulta en vuelo para este userId, reusar la promesa
    if (rolePendingPromise.current) {
      log.info("Esperando consulta de rol en curso...");
      try {
        return await rolePendingPromise.current;
      } catch {
        return ROLES.USER;
      }
    }

    // Crear nueva consulta y almacenar la promesa
    const fetchRole = async () => {
      try {
        log.info("Cargando rol desde DB para:", userId);

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Timeout cargando rol")), 5000);
        });

        const queryPromise = supabase
          .from("profiles")
          .select("rol")
          .eq("id", userId)
          .maybeSingle();

        const { data, error } = await Promise.race([
          queryPromise,
          timeoutPromise,
        ]);

        if (error) {
          log.error("Error al obtener rol:", error);
          return roleCache.current.userId === userId
            ? roleCache.current.role
            : ROLES.USER;
        }

        const role = data?.rol || ROLES.USER;
        roleCache.current = { userId, role };
        log.info("Rol cacheado:", role);

        return role;
      } catch (error) {
        log.error("Error/Timeout al cargar rol:", error);
        return roleCache.current.userId === userId
          ? roleCache.current.role
          : ROLES.USER;
      } finally {
        rolePendingPromise.current = null;
      }
    };

    rolePendingPromise.current = fetchRole();
    return rolePendingPromise.current;
  }, []);

  // ── Inicialización (una sola vez) ─────────────────────────
  useEffect(() => {
    if (initialized) return;
    isMountedRef.current = true;

    const initialize = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!isMountedRef.current) return;

        if (session?.user) {
          // Verificar ban
          const banStatus = await checkBanStatus(session.user.id);
          if (!isMountedRef.current) return;

          if (banStatus.isBanned) {
            dispatch({ type: AUTH_ACTIONS.SET_BAN, payload: banStatus });
            await supabase.auth.signOut();
            if (isMountedRef.current) {
              dispatch({ type: AUTH_ACTIONS.INITIALIZED });
            }
            return;
          }

          // Asegurar que el perfil exista antes de cargar el rol
          await ensureProfileExists(session.user.id);

          // Cargar user + role en un solo dispatch
          const role = await loadUserRole(session.user.id);
          if (isMountedRef.current) {
            dispatch({
              type: AUTH_ACTIONS.SET_AUTH,
              payload: { user: session.user, role },
            });
          }
        }
      } catch (error) {
        log.error("Error inicializando:", error);
      } finally {
        if (isMountedRef.current) {
          dispatch({ type: AUTH_ACTIONS.INITIALIZED });
        }
      }
    };

    initialize();
    return () => {
      isMountedRef.current = false;
    };
  }, [initialized, loadUserRole]);

  // ── Listener de auth events ───────────────────────────────
  // ⚠️ CRÍTICO: Este callback se ejecuta DENTRO del navigator.lock de Supabase
  // (vía _notifyAllSubscribers, llamado desde _recoverAndRefresh dentro de _acquireLock).
  // Si hacemos await de cualquier query Supabase aquí (como checkBanStatus o loadUserRole),
  // esa query necesita getSession() → _acquireLock → pendingInLock → espera a que
  // _recoverAndRefresh termine → pero _recoverAndRefresh espera a que ESTE callback termine.
  // Resultado: DEADLOCK CIRCULAR → loading infinito tras cambio de pestaña.
  //
  // SOLUCIÓN: El callback NO debe ser async. Las operaciones que necesitan queries
  // de Supabase se difieren con setTimeout para ejecutarse DESPUÉS de que el lock se libere.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!initialized || event === "INITIAL_SESSION") return;

      log.info("Auth event:", event);

      switch (event) {
        case "SIGNED_IN":
          if (session?.user) {
            // Detectar si es un login real (no había usuario antes)
            // vs una re-notificación por visibilitychange / _recoverAndRefresh
            const isNewLogin = userRef.current?.id !== session.user.id;

            // Dispatch inmediato con datos disponibles (sin DB queries)
            const cachedRole =
              roleCache.current.userId === session.user.id
                ? roleCache.current.role
                : ROLES.USER;

            dispatch({
              type: AUTH_ACTIONS.SET_AUTH,
              payload: { user: session.user, role: cachedRole },
            });

            // Diferir ban check y role load para ejecutarse FUERA del lock
            setTimeout(async () => {
              try {
                // Asegurar que el perfil exista (especialmente para nuevos usuarios OAuth)
                await ensureProfileExists(session.user.id);

                // Verificar ban
                const banStatus = await checkBanStatus(session.user.id);
                if (banStatus.isBanned) {
                  log.info("Usuario baneado detectado");
                  dispatch({ type: AUTH_ACTIONS.SET_BAN, payload: banStatus });
                  await supabase.auth.signOut();
                  return;
                }

                // Cargar rol real si no estaba en cache
                if (roleCache.current.userId !== session.user.id) {
                  const role = await loadUserRole(session.user.id);
                  dispatch({
                    type: AUTH_ACTIONS.SET_AUTH,
                    payload: { user: session.user, role },
                  });
                }
              } catch (err) {
                log.error("Error en post-SIGNED_IN:", err);
              }
            }, 0);

            // Solo mostrar toast en login real, no en re-validaciones
            // por cambio de pestaña o visibilitychange
            if (isNewLogin) {
              showToastRef.current?.(
                "¡Has iniciado sesión correctamente!",
                "success",
              );
            }
          }
          break;

        case "SIGNED_OUT":
          // Limpiar estado si aún había user (caso: sesión cerrada externamente)
          // El toast se muestra desde signOut() directamente, no aquí,
          // porque CLEAR_AUTH se despacha antes del evento SIGNED_OUT
          if (userRef.current !== null) {
            roleCache.current = { userId: null, role: ROLES.USER };
            dispatch({ type: AUTH_ACTIONS.CLEAR_AUTH });
          }
          break;

        case "TOKEN_REFRESHED":
          if (session?.user) {
            // Dispatch inmediato con rol cacheado
            const cachedRefreshRole =
              roleCache.current.userId === session.user.id
                ? roleCache.current.role
                : ROLES.USER;

            dispatch({
              type: AUTH_ACTIONS.SET_AUTH,
              payload: {
                user: session.user,
                role: cachedRefreshRole,
              },
            });

            // Si el rol no estaba cacheado, cargarlo fuera del lock
            if (roleCache.current.userId !== session.user.id) {
              setTimeout(async () => {
                try {
                  const role = await loadUserRole(session.user.id);
                  dispatch({
                    type: AUTH_ACTIONS.SET_AUTH,
                    payload: { user: session.user, role },
                  });
                } catch (err) {
                  log.error("Error cargando rol post-TOKEN_REFRESHED:", err);
                }
              }, 0);
            }
          } else {
            log.warn("TOKEN_REFRESHED sin sesión válida, forzando signOut");
            roleCache.current = { userId: null, role: ROLES.USER };
            dispatch({ type: AUTH_ACTIONS.CLEAR_AUTH });
            showToastRef.current?.(
              "Tu sesión ha expirado. Por favor inicia sesión nuevamente.",
              "error",
            );
          }
          break;

        case "USER_UPDATED":
          if (session?.user) {
            dispatch({
              type: AUTH_ACTIONS.SET_AUTH,
              payload: { user: session.user },
            });
          }
          break;

        default:
          break;
      }
    });

    return () => subscription.unsubscribe();
  }, [initialized, loadUserRole]);

  // ── Revalidar sesión al volver al tab ─────────────────────
  // NOTA: Supabase GoTrueClient YA maneja internamente el visibilitychange:
  //   - _onVisibilityChanged() adquiere un Navigator Lock exclusivo (acquireTimeout=-1, ESPERA INFINITA)
  //   - llama _recoverAndRefresh() que lee la sesión de storage y refresca si está expirada
  //   - reinicia el auto-refresh ticker
  //
  // Tener un handler DUPLICADO aquí causaba un deadlock:
  //   1. Tab se hace visible → Supabase interno adquiere el lock y llama refreshSession()
  //   2. ESTE handler también dispara getSession() + refreshSession()
  //   3. El lock usa navigator.locks con timeout=-1 (espera infinita)
  //   4. Si ambos intentan refreshSession(), el refresh token se rota en el primero
  //      y el segundo falla con "Invalid Refresh Token: Already Used"
  //   5. La sesión se destruye → o el segundo queda esperando el lock infinitamente
  //   → Resultado: "Publicar" se queda en loading infinito
  //
  // El onAuthStateChange listener (arriba) ya maneja TOKEN_REFRESHED y SIGNED_OUT,
  // por lo que no necesitamos hacer nada adicional aquí.
  // Supabase se encarga de todo automáticamente.

  // ── Auth Actions (todas con useCallback para referencia estable) ──

  const signUp = useCallback(async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });

    // Enviar email de bienvenida (sin bloquear el registro)
    if (data?.user && !error) {
      supabase.functions
        .invoke("send-email", {
          body: {
            to: email,
            type: "welcome",
            data: { nombre: metadata.nombre || "" },
          },
        })
        .catch((err) =>
          console.error("Error enviando email de bienvenida:", err),
        );
    }

    return { data, error };
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }, []);

  const signOut = useCallback(async () => {
    // Limpiar estado local PRIMERO para UI responsiva inmediata
    roleCache.current = { userId: null, role: ROLES.USER };
    rolePendingPromise.current = null;
    dispatch({ type: AUTH_ACTIONS.CLEAR_AUTH });

    // Mostrar toast AQUÍ porque el listener SIGNED_OUT ya no verá user
    showToastRef.current?.("Has cerrado sesión correctamente", "success");

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout")), 5000);
      });

      const { error } = await Promise.race([
        supabase.auth.signOut(),
        timeoutPromise,
      ]);

      if (error) {
        log.error("Error en signOut:", error);
      }
      return { error: error || null };
    } catch (error) {
      log.error("Timeout en signOut:", error);
      // Reintentar en background sin bloquear
      supabase.auth.signOut().catch(() => {});
      return { error };
    }
  }, []);

  const signInWithGoogle = useCallback(async (credential) => {
    if (!credential) {
      return {
        data: null,
        error: new Error("No se recibió credencial de Google"),
      };
    }
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: credential,
    });
    return { data, error };
  }, []);

  const signInWithGoogleRedirect = useCallback(async () => {
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      sessionStorage.setItem("authReturnUrl", window.location.pathname);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        log.error("Error iniciando OAuth redirect:", error);
      }
      return { error };
    } catch (error) {
      log.error("Error en signInWithGoogleRedirect:", error);
      return { error };
    }
  }, []);

  /**
   * Popup Google OAuth directo — muestra "Ir a extrovertidos.cl" en Google.
   *
   * Flujo:
   * 1. Genera nonce raw → hashea SHA-256 → envía hash a Google
   * 2. Google devuelve id_token con el hash en el claim "nonce"
   * 3. AuthCallback (en el popup) extrae id_token del hash fragment
   *    y lo envía al opener via postMessage
   * 4. El opener llama signInWithIdToken({ token, nonce: rawNonce })
   *    → Supabase hashea rawNonce, compara con el claim del token → match ✓
   * 5. Si popup bloqueado → cae a redirect y AuthCallback lo procesa local
   */
  const signInWithGooglePopup = useCallback(async () => {
    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        return { error: new Error("VITE_GOOGLE_CLIENT_ID no configurado") };
      }

      const redirectUri = `${window.location.origin}/auth/callback`;
      const rawNonce = crypto.randomUUID();

      // Google recibe el HASH, Supabase recibe el RAW
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest(
        "SHA-256",
        encoder.encode(rawNonce),
      );
      const hashedNonce = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "id_token",
        scope: "openid email profile",
        nonce: hashedNonce,
        prompt: "select_account",
      });

      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

      // Guardar nonce y flag de popup en localStorage (compartido cross-tab)
      localStorage.setItem("googleAuthNonce", rawNonce);
      localStorage.setItem("googleAuthIsPopup", "true");

      // Abrir popup
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        googleAuthUrl,
        "google-auth-popup",
        `width=${width},height=${height},left=${left},top=${top},popup=yes,toolbar=no,menubar=no,scrollbars=yes`,
      );

      // Popup bloqueado → fallback a redirect
      if (!popup || popup.closed) {
        log.info("Popup bloqueado, usando redirect");
        localStorage.removeItem("googleAuthIsPopup");
        sessionStorage.setItem("authReturnUrl", window.location.pathname);
        localStorage.setItem("googleAuthNonce", rawNonce);
        window.location.href = googleAuthUrl;
        return { error: null };
      }

      // Escuchar la sesión establecida por el popup via múltiples canales
      return new Promise((resolve) => {
        let resolved = false;

        const cleanup = () => {
          if (resolved) return;
          resolved = true;
          window.removeEventListener("message", handleMessage);
          clearInterval(checkClosed);
          authSubscription?.unsubscribe();
        };

        // Canal 1: postMessage del popup (funciona si COOP no cortó opener)
        const handleMessage = (event) => {
          if (event.origin !== window.location.origin) return;
          if (event.data?.type !== "GOOGLE_AUTH_COMPLETE") return;
          log.info("Auth completado via postMessage");
          cleanup();
          resolve({ error: null });
        };

        // Canal 2: Supabase onAuthStateChange (cross-tab via localStorage)
        // El popup hace signInWithIdToken → guarda sesión → storage event
        const {
          data: { subscription: authSubscription },
        } = supabase.auth.onAuthStateChange((event) => {
          if (event === "SIGNED_IN") {
            log.info("Auth completado via onAuthStateChange (cross-tab)");
            cleanup();
            resolve({ error: null });
          }
        });

        // Canal 3: popup cerrado (puede fallar por COOP, envuelto en try-catch)
        const checkClosed = setInterval(() => {
          try {
            if (popup.closed) {
              // Esperar un momento para que la sesión se propague via storage
              setTimeout(() => {
                cleanup();
                resolve({ error: null });
              }, 500);
            }
          } catch {
            // COOP bloquea acceso a popup.closed — ignorar
          }
        }, 500);

        window.addEventListener("message", handleMessage);
      });
    } catch (error) {
      log.error("Error en signInWithGooglePopup:", error);
      return { error };
    }
  }, []);

  const resetPassword = useCallback(async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    return { data, error };
  }, []);

  const refreshRole = useCallback(async () => {
    if (userRef.current?.id) {
      const role = await loadUserRole(userRef.current.id, true);
      dispatch({
        type: AUTH_ACTIONS.SET_AUTH,
        payload: { user: userRef.current, role },
      });
      return role;
    }
    return ROLES.USER;
  }, [loadUserRole]);

  const closeBanCard = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_BAN });
  }, []);

  // ── Context value (useMemo para evitar object nuevo si nada cambió) ──
  const value = useMemo(
    () => ({
      // Estado
      user,
      userRole,
      loading,
      isAuthenticated: !!user,
      isAdmin: userRole === ROLES.ADMIN,
      isModerator: userRole === ROLES.ADMIN || userRole === ROLES.MODERATOR,

      // Acciones de auth
      signUp,
      signIn,
      signOut,
      signInWithGoogle,
      signInWithGoogleRedirect,
      signInWithGooglePopup,
      resetPassword,
      refreshRole,

      // Compatibilidad: exponer showToast desde aquí también
      // para no romper componentes existentes que hacen useAuth().showToast
      showToast,
    }),
    [
      user,
      userRole,
      loading,
      signUp,
      signIn,
      signOut,
      signInWithGoogle,
      signInWithGoogleRedirect,
      signInWithGooglePopup,
      resetPassword,
      refreshRole,
      showToast,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {showBanCard && banInfo && (
        <BannedUserCard
          reason={banInfo.reason}
          bannedAt={banInfo.bannedAt}
          onClose={closeBanCard}
        />
      )}
    </AuthContext.Provider>
  );
};

export default AuthContext;
