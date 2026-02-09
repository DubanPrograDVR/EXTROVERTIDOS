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
import { ROLES, checkBanStatus } from "../lib/database";
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
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!initialized || event === "INITIAL_SESSION") return;

      log.info("Auth event:", event);

      switch (event) {
        case "SIGNED_IN":
          if (session?.user) {
            const banStatus = await checkBanStatus(session.user.id);

            if (banStatus.isBanned) {
              log.info("Usuario baneado detectado");
              dispatch({ type: AUTH_ACTIONS.SET_BAN, payload: banStatus });
              await supabase.auth.signOut();
              return;
            }

            // Cargar rol (o usar cache) + set user en un dispatch
            const role =
              roleCache.current.userId !== session.user.id
                ? await loadUserRole(session.user.id)
                : roleCache.current.role;

            dispatch({
              type: AUTH_ACTIONS.SET_AUTH,
              payload: { user: session.user, role },
            });

            showToastRef.current?.(
              "¡Has iniciado sesión correctamente!",
              "success",
            );
          }
          break;

        case "SIGNED_OUT":
          // Solo limpiar si había un user (evitar toast duplicado)
          if (userRef.current !== null) {
            roleCache.current = { userId: null, role: ROLES.USER };
            dispatch({ type: AUTH_ACTIONS.CLEAR_AUTH });
            showToastRef.current?.(
              "Has cerrado sesión correctamente",
              "success",
            );
          }
          break;

        case "TOKEN_REFRESHED":
          if (session?.user) {
            // Siempre reconsultar rol si el cache no coincide
            const refreshedRole =
              roleCache.current.userId === session.user.id
                ? roleCache.current.role
                : await loadUserRole(session.user.id);

            dispatch({
              type: AUTH_ACTIONS.SET_AUTH,
              payload: {
                user: session.user,
                role: refreshedRole,
              },
            });
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
  // Usa userRef para no re-registrar el listener cada vez que cambia user
  useEffect(() => {
    if (!initialized) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState !== "visible") return;
      if (!userRef.current) return;

      try {
        log.info("Tab visible, revalidando sesión...");
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error || !session) {
          log.warn("Sesión inválida, intentando refresh...");
          const { data: refreshData, error: refreshError } =
            await supabase.auth.refreshSession();

          if (refreshError || !refreshData?.session) {
            log.error("No se pudo recuperar la sesión");
            roleCache.current = { userId: null, role: ROLES.USER };
            dispatch({ type: AUTH_ACTIONS.CLEAR_AUTH });
            showToastRef.current?.(
              "Tu sesión ha expirado. Por favor inicia sesión nuevamente.",
              "error",
            );
            await supabase.auth.signOut().catch(() => {});
            return;
          }

          // Refresh exitoso
          dispatch({
            type: AUTH_ACTIONS.SET_AUTH,
            payload: { user: refreshData.session.user },
          });
          log.info("Sesión recuperada");
        } else {
          // Sesión válida - NO despachar SET_AUTH innecesariamente
          // (evita re-renders en cascada en todos los consumidores de useAuth)
          // Solo despachar si el user ID cambió o si hay refresh necesario

          // Refrescar preventivamente si le quedan menos de 2 minutos
          const expiresAt = session.expires_at;
          const now = Math.floor(Date.now() / 1000);
          if (expiresAt && expiresAt - now < 120) {
            log.info("Token cerca de expirar, refrescando preventivamente...");
            const { data: refreshData } = await supabase.auth.refreshSession();
            if (refreshData?.session) {
              dispatch({
                type: AUTH_ACTIONS.SET_AUTH,
                payload: { user: refreshData.session.user },
              });
            }
          }
          // Si la sesión es válida y no necesita refresh, no hacer nada
          // El auth listener ya maneja TOKEN_REFRESHED
        }
      } catch (err) {
        log.error("Error revalidando sesión:", err);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [initialized]); // ← SIN user → no se re-registra

  // ── Auth Actions (todas con useCallback para referencia estable) ──

  const signUp = useCallback(async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
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

  const signInWithGoogle = useCallback(async () => {
    // Guardar URL para redirigir después del login
    const currentPath = window.location.pathname + window.location.search;
    if (currentPath !== "/" && currentPath !== "/auth/callback") {
      sessionStorage.setItem("authReturnUrl", currentPath);
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
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
