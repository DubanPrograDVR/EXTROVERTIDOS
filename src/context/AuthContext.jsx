import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { supabase } from "../lib/supabase";
import { ROLES, checkBanStatus } from "../lib/database";
import Toast from "../components/UI/Toast";
import BannedUserCard from "../components/UI/BannedUserCard";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(ROLES.USER);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Estado para usuario baneado
  const [banInfo, setBanInfo] = useState(null);
  const [showBanCard, setShowBanCard] = useState(false);

  // Refs para evitar consultas duplicadas
  const roleCache = useRef({ userId: null, role: ROLES.USER });
  const isLoadingRole = useRef(false);
  const isMountedRef = useRef(true);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  // Función para cargar el rol con cache y timeout
  const loadUserRole = async (userId, forceRefresh = false) => {
    if (!userId) {
      return ROLES.USER;
    }

    // Si ya tenemos el rol en cache para este usuario, usarlo
    if (!forceRefresh && roleCache.current.userId === userId) {
      console.log("Usando rol desde cache:", roleCache.current.role);
      return roleCache.current.role;
    }

    // Evitar consultas simultáneas
    if (isLoadingRole.current) {
      console.log("Ya hay una consulta en progreso, esperando...");
      // Esperar un poco y devolver el cache actual
      await new Promise((resolve) => setTimeout(resolve, 100));
      return roleCache.current.role;
    }

    isLoadingRole.current = true;

    try {
      console.log("Cargando rol desde DB para:", userId);

      // Crear una promesa con timeout de 5 segundos
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout")), 5000);
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
        console.error("Error al obtener rol:", error);
        return roleCache.current.userId === userId
          ? roleCache.current.role
          : ROLES.USER;
      }

      const role = data?.rol || ROLES.USER;

      // Guardar en cache
      roleCache.current = { userId, role };
      console.log("Rol obtenido y cacheado:", role);

      return role;
    } catch (error) {
      console.error("Error/Timeout al cargar rol:", error);
      return roleCache.current.userId === userId
        ? roleCache.current.role
        : ROLES.USER;
    } finally {
      isLoadingRole.current = false;
    }
  };

  // Inicialización - solo se ejecuta una vez
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
          // Verificar si el usuario está baneado al inicializar
          const banStatus = await checkBanStatus(session.user.id);

          if (!isMountedRef.current) return;

          if (banStatus.isBanned) {
            setBanInfo(banStatus);
            setShowBanCard(true);
            await supabase.auth.signOut();
            if (isMountedRef.current) {
              setLoading(false);
              setInitialized(true);
            }
            return;
          }

          setUser(session.user);
          const role = await loadUserRole(session.user.id);
          if (isMountedRef.current) {
            setUserRole(role);
          }
        }
      } catch (error) {
        console.error("Error inicializando auth:", error);
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initialize();

    return () => {
      isMountedRef.current = false;
    };
  }, [initialized]);

  // Listener de cambios de auth
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Ignorar durante la inicialización
      if (!initialized) return;

      // Ignorar INITIAL_SESSION
      if (event === "INITIAL_SESSION") return;

      console.log("Auth event:", event);

      switch (event) {
        case "SIGNED_IN":
          if (session?.user) {
            // Verificar si el usuario está baneado
            const banStatus = await checkBanStatus(session.user.id);

            if (banStatus.isBanned) {
              // Usuario baneado - cerrar sesión y mostrar card
              console.log("Usuario baneado detectado, cerrando sesión...");
              setBanInfo(banStatus);
              setShowBanCard(true);
              await supabase.auth.signOut();
              return;
            }

            setUser(session.user);
            // Solo cargar rol si es un usuario diferente
            if (roleCache.current.userId !== session.user.id) {
              const role = await loadUserRole(session.user.id);
              setUserRole(role);
            } else {
              // Usar rol cacheado
              setUserRole(roleCache.current.role);
            }
            showToast("¡Has iniciado sesión correctamente!", "success");
          }
          break;

        case "SIGNED_OUT":
          // Solo limpiar si no se hizo ya (el estado local puede estar ya limpio)
          // Esto evita doble limpieza y toast duplicado
          if (user !== null) {
            setUser(null);
            setUserRole(ROLES.USER);
            roleCache.current = { userId: null, role: ROLES.USER };
            showToast("Has cerrado sesión correctamente", "success");
          }
          break;

        case "TOKEN_REFRESHED":
          // Solo actualizar el usuario, NO recargar el rol
          if (session?.user) {
            setUser(session.user);
            // Mantener el rol actual del cache
            if (roleCache.current.userId === session.user.id) {
              setUserRole(roleCache.current.role);
            }
          }
          break;

        case "USER_UPDATED":
          if (session?.user) {
            setUser(session.user);
          }
          break;

        default:
          break;
      }
    });

    return () => subscription.unsubscribe();
  }, [initialized]);

  const signUp = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    // Limpiar estado local PRIMERO para evitar UI bloqueada
    // Esto asegura que la UI responda inmediatamente
    const previousUser = user;
    const previousRole = userRole;

    // Limpiar cache y estados inmediatamente
    roleCache.current = { userId: null, role: ROLES.USER };
    isLoadingRole.current = false; // Cancelar cualquier carga de rol en progreso
    setUser(null);
    setUserRole(ROLES.USER);

    try {
      // Crear promesa con timeout de 5 segundos
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout al cerrar sesión")), 5000);
      });

      const signOutPromise = supabase.auth.signOut();

      // Race entre signOut y timeout
      const { error } = await Promise.race([signOutPromise, timeoutPromise]);

      if (error) {
        console.error("Error en signOut:", error);
        // Mostrar toast de éxito de todos modos porque ya limpiamos el estado local
        showToast("Sesión cerrada localmente", "success");
        return { error };
      }

      return { error: null };
    } catch (error) {
      // Si hay timeout o error de red, la sesión ya está cerrada localmente
      console.error("Error/Timeout en signOut:", error);
      showToast("Sesión cerrada", "success");

      // Intentar limpiar la sesión de Supabase en segundo plano sin bloquear
      supabase.auth.signOut().catch(() => {
        // Ignorar errores silenciosamente en el retry
      });

      return { error };
    }
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    return { data, error };
  };

  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    return { data, error };
  };

  const refreshRole = async () => {
    if (user?.id) {
      const role = await loadUserRole(user.id, true); // forceRefresh = true
      setUserRole(role);
      return role;
    }
    return ROLES.USER;
  };

  // Cerrar tarjeta de baneo
  const closeBanCard = () => {
    setShowBanCard(false);
    setBanInfo(null);
  };

  const value = {
    user,
    userRole,
    loading,
    isAuthenticated: !!user,
    isAdmin: userRole === ROLES.ADMIN,
    isModerator: userRole === ROLES.ADMIN || userRole === ROLES.MODERATOR,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    resetPassword,
    showToast,
    refreshRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}
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
