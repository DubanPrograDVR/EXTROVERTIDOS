import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getEventById } from "../../../../lib/database";
import { INITIAL_FORM_STATE } from "../constants";

/**
 * Hook especializado para manejar la carga y edición de eventos existentes
 *
 * RESPONSABILIDADES:
 * - Detectar modo edición desde URL params
 * - Cargar datos del evento para edición
 * - Validar permisos de edición
 * - Manejar estados de carga
 *
 * PROTECCIONES:
 * - AbortController para cancelar requests en desmontaje
 * - Flag isMounted para evitar updates en componentes desmontados
 * - Ref para showToast evitando dependencias inestables
 * - Limpieza explícita en cleanup function
 *
 * @param {Object} options - Opciones del hook
 * @param {Object} options.user - Usuario actual
 * @param {boolean} options.isAuthenticated - Si el usuario está autenticado
 * @param {boolean} options.isAdmin - Si el usuario es admin
 * @param {Function} options.showToast - Función para mostrar notificaciones
 * @returns {Object} Estado y funciones de edición
 */
const useEventEditor = ({ user, isAuthenticated, isAdmin, showToast }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Estados
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [eventFormData, setEventFormData] = useState(null);
  const [existingImages, setExistingImages] = useState([]);

  // Refs para evitar dependencias inestables y race conditions
  const showToastRef = useRef(showToast);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef(null);
  const lastLoadedEventId = useRef(null);

  // Lifecycle management para isMountedRef
  // Necesario para compatibilidad con React.StrictMode (doble montaje en dev)
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Derivar valores de URL params
  const editEventId = searchParams.get("editar");
  const isEditing = !!editEventId;

  // Mantener ref actualizada sin causar re-renders
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  /**
   * Carga un evento para edición
   * Protegido contra:
   * - Componente desmontado
   * - Requests cancelados
   * - Doble carga del mismo evento
   */
  const loadEventForEdit = useCallback(
    async (eventId) => {
      // Evitar cargar el mismo evento múltiples veces
      if (lastLoadedEventId.current === eventId) {
        return;
      }

      // Cancelar request anterior si existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setLoadingEvent(true);

      try {
        const event = await getEventById(eventId);

        // Verificar si el componente sigue montado
        if (!isMountedRef.current) return;

        if (!event) {
          showToastRef.current?.("No se encontró la publicación", "error");
          navigate("/");
          return;
        }

        // Verificar permisos: solo admin o el autor pueden editar
        if (!isAdmin && event.user_id !== user?.id) {
          showToastRef.current?.(
            "No tienes permisos para editar esta publicación",
            "error",
          );
          navigate("/");
          return;
        }

        // Marcar como cargado exitosamente
        lastLoadedEventId.current = eventId;

        // Determinar si es multi-día
        const esMultidia =
          event.fecha_fin &&
          event.fecha_fin !== event.fecha_evento &&
          !event.es_recurrente;

        // Mapear datos del evento al formato del formulario
        const mappedFormData = {
          titulo: event.titulo || "",
          descripcion: event.descripcion || "",
          mensaje_marketing: event.mensaje_marketing || "",
          mensaje_marketing_2: event.mensaje_marketing_2 || "",
          organizador: event.organizador || "",
          category_id: event.category_id || "",
          fecha_evento: event.fecha_evento || "",
          fecha_fin: event.fecha_fin || "",
          es_multidia: esMultidia,
          mismo_horario: event.mismo_horario !== false,
          // Campos de recurrencia
          es_recurrente: event.es_recurrente || false,
          dia_recurrencia: event.dia_recurrencia || "",
          cantidad_repeticiones: event.cantidad_repeticiones || 2,
          fechas_recurrencia: event.fechas_recurrencia || [],
          hora_inicio: event.hora_inicio || "",
          hora_fin: event.hora_fin || "",
          provincia: event.provincia || "",
          comuna: event.comuna || "",
          direccion: event.direccion || "",
          ubicacion_url: event.ubicacion_url || "",
          tipo_entrada: event.tipo_entrada || "gratuito",
          precio: event.precio || "",
          url_venta: event.url_venta || "",
          telefono_contacto: event.telefono_contacto || "",
          hashtags: event.hashtags || "",
          etiqueta_directa: event.etiqueta_directa || "",
          redes_sociales: event.redes_sociales || {
            instagram: "",
            facebook: "",
            whatsapp: "",
            tiktok: "",
            youtube: "",
          },
          imagenes: [], // Las nuevas imágenes se agregan aquí
        };

        setEventFormData(mappedFormData);

        // Guardar las imágenes existentes
        if (event.imagenes && event.imagenes.length > 0) {
          setExistingImages(event.imagenes);
        }
      } catch (error) {
        // Ignorar errores de abort - pero SIEMPRE resetear loadingEvent
        if (error.name === "AbortError") {
          // Aún así resetear loadingEvent si el componente sigue montado
          if (isMountedRef.current) {
            setLoadingEvent(false);
          }
          return;
        }

        if (!isMountedRef.current) return;

        console.error("Error cargando evento para editar:", error);
        showToastRef.current?.("Error al cargar la publicación", "error");
      } finally {
        if (isMountedRef.current) {
          setLoadingEvent(false);
        }
      }
    },
    [isAdmin, user?.id, navigate],
  ); // ← showToast NO está en dependencias

  // Efecto para cargar evento cuando hay ID de edición
  useEffect(() => {
    // Condiciones de salida temprana
    if (!editEventId) {
      // Reset si ya no estamos editando
      if (lastLoadedEventId.current) {
        lastLoadedEventId.current = null;
        setEventFormData(null);
        setExistingImages([]);
        setLoadingEvent(false);
      }
      return;
    }

    if (!isAuthenticated) {
      return;
    }

    // Cargar el evento
    loadEventForEdit(editEventId);

    // Cleanup function
    return () => {
      // Resetear lastLoadedEventId para permitir re-carga en StrictMode
      // El dedup check (lastLoadedEventId === eventId) debe permitir
      // que el segundo mount de StrictMode vuelva a cargar el evento
      lastLoadedEventId.current = null;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [editEventId, isAuthenticated, loadEventForEdit]); // ← Dependencias estables

  /**
   * Resetea el estado de edición
   */
  const resetEditState = useCallback(() => {
    lastLoadedEventId.current = null;
    setEventFormData(null);
    setExistingImages([]);
    setLoadingEvent(false);
  }, []);

  /**
   * Actualiza las imágenes existentes (para cuando se elimina una)
   */
  const updateExistingImages = useCallback((newImages) => {
    setExistingImages(newImages);
  }, []);

  return {
    // Estados
    isEditing,
    editEventId,
    loadingEvent,
    eventFormData,
    existingImages,

    // Acciones
    resetEditState,
    updateExistingImages,
  };
};

export default useEventEditor;
