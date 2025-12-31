import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { ROLES } from "../lib/database";
import Toast from "../components/UI/Toast";

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

  // Refs para evitar consultas duplicadas
  const roleCache = useRef({ userId: null, role: ROLES.USER });
  const isLoadingRole = useRef(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

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

    const initialize = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          const role = await loadUserRole(session.user.id);
          setUserRole(role);
        }
      } catch (error) {
        console.error("Error inicializando auth:", error);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    initialize();
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
          setUser(null);
          setUserRole(ROLES.USER);
          roleCache.current = { userId: null, role: ROLES.USER };
          showToast("Has cerrado sesión correctamente", "success");
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
    roleCache.current = { userId: null, role: ROLES.USER };
    const { error } = await supabase.auth.signOut();
    return { error };
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
    </AuthContext.Provider>
  );
};

export default AuthContext;
