import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { getUserRole, ROLES } from "../lib/database";
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
  const isInitialLoad = useRef(true);

  // Función para mostrar notificaciones
  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  // Función para cargar el rol del usuario
  const loadUserRole = async (userId) => {
    if (!userId) {
      setUserRole(ROLES.USER);
      return;
    }
    try {
      const role = await getUserRole(userId);
      setUserRole(role);
    } catch (error) {
      console.error("Error al cargar rol:", error);
      setUserRole(ROLES.USER);
    }
  };

  useEffect(() => {
    // Obtener sesión actual
    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user ?? null);

        // Cargar rol si hay usuario
        if (session?.user) {
          await loadUserRole(session.user.id);
        }
      } catch (error) {
        console.error("Error al obtener sesión:", error);
      } finally {
        setLoading(false);
        // Marcar que la carga inicial terminó después de un pequeño delay
        setTimeout(() => {
          isInitialLoad.current = false;
        }, 1000);
      }
    };

    getSession();

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);

      // Cargar rol cuando cambia la sesión
      if (session?.user) {
        await loadUserRole(session.user.id);
      } else {
        setUserRole(ROLES.USER);
      }

      setLoading(false);

      // Solo mostrar notificaciones después de la carga inicial
      if (!isInitialLoad.current) {
        if (event === "SIGNED_IN" && session?.user) {
          showToast("¡Has iniciado sesión correctamente!", "success");
        } else if (event === "SIGNED_OUT") {
          showToast("Has cerrado sesión correctamente", "success");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Función para registrar usuario
  const signUp = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    return { data, error };
  };

  // Función para iniciar sesión
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  // Función para cerrar sesión
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  // Función para iniciar sesión con Google
  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    return { data, error };
  };

  // Función para recuperar contraseña
  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    return { data, error };
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
    refreshRole: () => loadUserRole(user?.id),
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
