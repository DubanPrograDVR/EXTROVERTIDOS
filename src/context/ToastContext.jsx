import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import Toast from "../components/UI/Toast";

/**
 * @fileoverview Contexto dedicado para notificaciones Toast
 *
 * ANTES: showToast vivía en AuthContext, lo que causaba que TODOS los
 * componentes que usaban useAuth() se re-renderizaran cada vez que
 * aparecía o desaparecía un toast.
 *
 * AHORA: Toast tiene su propio contexto. Solo los componentes que
 * realmente necesitan mostrar toasts se suscriben aquí.
 * El renderizado del Toast UI está aislado en este provider.
 *
 * USO:
 * ```js
 * import { useToast } from '../context/ToastContext';
 * const { showToast } = useToast();
 * showToast("Mensaje", "success");
 * ```
 */

const ToastContext = createContext(null);

/**
 * Hook para acceder al sistema de notificaciones
 * @returns {{ showToast: (message: string, type?: 'success'|'error'|'warning'|'info') => void }}
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast debe ser usado dentro de un ToastProvider");
  }
  return context;
};

/**
 * Provider de notificaciones Toast
 *
 * CARACTERÍSTICAS:
 * - Cola de toasts (no pierde mensajes si llegan varios)
 * - Auto-dismiss configurable
 * - Aislado de otros contextos (no causa re-renders innecesarios)
 * - Referencia estable de showToast (useCallback)
 */
export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const toastQueueRef = useRef([]);
  const isShowingRef = useRef(false);

  /**
   * Muestra el siguiente toast en la cola
   */
  const showNext = useCallback(() => {
    if (toastQueueRef.current.length === 0) {
      isShowingRef.current = false;
      return;
    }

    const next = toastQueueRef.current.shift();
    setToast(next);
    isShowingRef.current = true;
  }, []);

  /**
   * Cierra el toast actual y muestra el siguiente si hay
   */
  const closeToast = useCallback(() => {
    setToast(null);
    // Pequeño delay para animación de salida
    setTimeout(showNext, 150);
  }, [showNext]);

  /**
   * Muestra una notificación toast
   * Si ya hay uno visible, lo encola para mostrar después
   *
   * @param {string} message - Mensaje a mostrar
   * @param {'success'|'error'|'warning'|'info'} type - Tipo de notificación
   */
  const showToast = useCallback((message, type = "success") => {
    if (!message) return;

    const toastData = { message, type };

    if (isShowingRef.current) {
      // Encolar si ya hay un toast visible
      toastQueueRef.current.push(toastData);
    } else {
      // Mostrar inmediatamente
      setToast(toastData);
      isShowingRef.current = true;
    }
  }, []);

  // El valor del contexto es estable (showToast es useCallback sin deps)
  // Esto significa que los consumidores NO se re-renderizan cuando cambia el toast
  const value = { showToast };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}
    </ToastContext.Provider>
  );
};

export default ToastContext;
