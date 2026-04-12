import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  updateEvent,
  getCategories,
  toggleLike,
  hasUserLiked,
  getLikesCount,
  toggleFavorite,
  isFavorite,
} from "../../lib/database";
import "./styles/PublicationModal.css";
import "./styles/BusinessModal.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faCalendarDays,
  faCalendarWeek,
  faClock,
  faTicket,
  faLocationDot,
  faPhone,
  faMapMarkerAlt,
  faUser,
  faChevronDown,
  faChevronUp,
  faChevronLeft,
  faChevronRight,
  faRoute,
  faExternalLinkAlt,
  faShareAlt,
  faHeart,
  faBookmark,
  faBullhorn,
  faTag,
  faHashtag,
  faAlignLeft,
  faAddressCard,
  faGlobe,
  faRepeat,
  faPencil,
  faSave,
  faSpinner,
  faInfoCircle,
  faFire,
  faImage,
} from "@fortawesome/free-solid-svg-icons";
import {
  faInstagram,
  faFacebook,
  faWhatsapp,
  faYoutube,
  faTiktok,
  faXTwitter,
  faLinkedin,
} from "@fortawesome/free-brands-svg-icons";

// Tipos de secciones del acordeón
const ACCORDION_SECTIONS = {
  DESCRIPTION: "description",
  MARKETING_1: "marketing_1",
  MARKETING_2: "marketing_2",
  INFORMATION: "information",
  LOCATION: "location",
  SCHEDULE: "schedule",
  CONTACT: "contact",
  MAP: "map",
};

/**
 * Componente AccordionSection reutilizable con icono
 */
const AccordionSection = ({ title, icon, isOpen, onToggle, children }) => {
  return (
    <div
      className={`accordion-section ${isOpen ? "accordion-section--open" : ""}`}>
      <button
        className={`accordion-section__header ${isOpen ? "open" : ""}`}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${title.toLowerCase().replace(/\s/g, "-")}`}>
        <span className="accordion-section__title">
          {icon && (
            <FontAwesomeIcon
              icon={icon}
              className="accordion-section__title-icon"
            />
          )}
          {title}
        </span>
        <FontAwesomeIcon
          icon={isOpen ? faChevronUp : faChevronDown}
          className="accordion-section__icon"
        />
      </button>
      <div
        className={`accordion-section__content ${isOpen ? "open" : ""}`}
        id={`accordion-content-${title.toLowerCase().replace(/\s/g, "-")}`}
        role="region"
        aria-hidden={!isOpen}>
        <div className="accordion-section__body">{children}</div>
      </div>
    </div>
  );
};

export default function PublicationModal({
  publication,
  isOpen,
  onClose,
  onUpdate,
  startInEditMode = false,
  modalVariant = "",
}) {
  const { user, isAdmin, isModerator } = useAuth();
  const { showToast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isTogglingLike, setIsTogglingLike] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isTogglingSave, setIsTogglingSave] = useState(false);

  // Estado único para controlar qué sección del acordeón está abierta (null = ninguna)
  const [activeSection, setActiveSection] = useState(
    ACCORDION_SECTIONS.DESCRIPTION,
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEditMode, setIsEditMode] = useState(startInEditMode);
  const [editData, setEditData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [categoriesList, setCategoriesList] = useState([]);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);

  const canEdit = isAdmin || isModerator;

  // Provincias del Maule
  const PROVINCIAS = ["Talca", "Curicó", "Linares", "Cauquenes"];

  // Tipos de entrada
  const TIPOS_ENTRADA = [
    { value: "sin_entrada", label: "Sin entrada" },
    { value: "gratuito", label: "Entrada gratuita" },
    { value: "pagado", label: "Entrada pagada" },
    { value: "venta_externa", label: "Venta externa" },
  ];

  // Cargar categorías para el selector
  useEffect(() => {
    if (canEdit) {
      getCategories()
        .then((cats) => setCategoriesList(cats || []))
        .catch((err) => console.error("Error cargando categorías:", err));
    }
  }, [canEdit]);

  // Función para alternar secciones del acordeón (solo una abierta a la vez)
  const toggleSection = useCallback((section) => {
    setActiveSection((prev) => (prev === section ? null : section));
  }, []);

  // Cerrar con ESC y resetear estado al cerrar
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    } else {
      // Resetear sección activa cuando se cierra el modal
      setActiveSection(ACCORDION_SECTIONS.DESCRIPTION);
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  // Cargar estado de likes y favoritos
  useEffect(() => {
    if (!publication?.id) return;
    const loadLikeState = async () => {
      try {
        const count = await getLikesCount(publication.id);
        setLikeCount(count);
        if (user) {
          const liked = await hasUserLiked(user.id, publication.id);
          setIsLiked(liked);
          const saved = await isFavorite(user.id, publication.id);
          setIsSaved(saved);
        }
      } catch (error) {
        console.error("Error cargando likes:", error);
      }
    };
    if (isOpen) loadLikeState();
  }, [publication?.id, user, isOpen]);

  const handleLikeClick = async () => {
    if (!user) {
      showToast("Inicia sesión para reaccionar", "warning");
      return;
    }
    if (isTogglingLike) return;
    setIsTogglingLike(true);
    try {
      const result = await toggleLike(user.id, publication.id);
      setIsLiked(result.isLiked);
      setLikeCount(result.count);
    } catch (error) {
      console.error("Error al cambiar like:", error);
      showToast("Error al procesar tu reacción", "error");
    } finally {
      setIsTogglingLike(false);
    }
  };

  const handleSaveClick = async () => {
    if (!user) {
      showToast("Inicia sesión para guardar", "warning");
      return;
    }
    if (isTogglingSave) return;
    setIsTogglingSave(true);
    try {
      const result = await toggleFavorite(user.id, publication.id);
      setIsSaved(result.isFavorite);
      showToast(
        result.isFavorite ? "Guardado en favoritos" : "Eliminado de favoritos",
        "success",
      );
    } catch (error) {
      console.error("Error al guardar:", error);
      showToast("Error al guardar", "error");
    } finally {
      setIsTogglingSave(false);
    }
  };

  // Resetear índice de imagen cuando cambia la publicación
  useEffect(() => {
    setCurrentImageIndex(0);
    setIsEditMode(startInEditMode);
    setIsInfoExpanded(false);
    // Inicializar datos de edición
    if (publication) {
      setEditData({
        titulo: publication.titulo || "",
        subtitulo: publication.subtitulo || "",
        descripcion: publication.descripcion || "",
        organizador: publication.organizador || "",
        category_id: publication.category_id || "",
        fecha_evento: publication.fecha_evento || "",
        fecha_fin: publication.fecha_fin || "",
        hora_inicio: publication.hora_inicio?.slice(0, 5) || "",
        hora_fin: publication.hora_fin?.slice(0, 5) || "",
        provincia: publication.provincia || "",
        comuna: publication.comuna || "",
        direccion: publication.direccion || "",
        ubicacion_url: publication.ubicacion_url || "",
        tipo_entrada:
          { gratis: "gratuito", externo: "venta_externa" }[
            publication.tipo_entrada
          ] ||
          publication.tipo_entrada ||
          "sin_entrada",
        precio: publication.precio || "",
        url_venta: publication.url_venta || "",
        telefono_contacto:
          publication.telefono_contacto || publication.telefono || "",
        sitio_web: publication.sitio_web || "",
        redes_sociales: {
          instagram: publication.redes_sociales?.instagram || "",
          facebook: publication.redes_sociales?.facebook || "",
          whatsapp: publication.redes_sociales?.whatsapp || "",
          tiktok: publication.redes_sociales?.tiktok || "",
          youtube: publication.redes_sociales?.youtube || "",
          twitter: publication.redes_sociales?.twitter || "",
          linkedin: publication.redes_sociales?.linkedin || "",
        },
        titulo_marketing: publication.titulo_marketing || "",
        mensaje_marketing: publication.mensaje_marketing || "",
        titulo_marketing_2: publication.titulo_marketing_2 || "",
        mensaje_marketing_2: publication.mensaje_marketing_2 || "",
      });
    }
  }, [publication?.id, isOpen]);

  if (!isOpen || !publication) return null;

  const {
    titulo,
    subtitulo,
    imagenes,
    comuna,
    provincia,
    categories,
    descripcion,
    titulo_marketing,
    mensaje_marketing,
    titulo_marketing_2,
    mensaje_marketing_2,
    telefono_contacto,
    sitio_web,
    hashtags,
    etiqueta_directa,
    fecha_evento,
    fecha_fin,
    es_multidia,
    es_recurrente,
    dia_recurrencia,
    cantidad_repeticiones,
    fechas_recurrencia,
    hora_inicio,
    hora_fin,
    tipo_entrada,
    precio,
    url_venta,
    direccion,
    telefono,
    ubicacion_url,
    redes_sociales,
    profiles,
    organizador,
    event_tags,
  } = publication;

  // Extraer redes sociales del objeto JSON
  const instagram = redes_sociales?.instagram || publication.instagram;
  const facebook = redes_sociales?.facebook || publication.facebook;
  const whatsapp = redes_sociales?.whatsapp || publication.whatsapp;
  const youtube = redes_sociales?.youtube || publication.youtube;
  const tiktok = redes_sociales?.tiktok || publication.tiktok;
  const twitter = redes_sociales?.twitter;
  const linkedin = redes_sociales?.linkedin;

  // Usar telefono_contacto si existe, sino usar telefono
  const contactPhone = telefono_contacto || telefono;

  // Parsear hashtags
  const parseHashtags = () => {
    if (!hashtags) return [];
    return hashtags
      .split("#")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
      .map((tag) => `#${tag}`);
  };

  const hashtagsList = parseHashtags();

  // Obtener array de imágenes válidas
  const getValidImages = () => {
    if (Array.isArray(imagenes) && imagenes.length > 0) {
      return imagenes;
    }
    return ["/img/Home1.png"];
  };

  const validImages = getValidImages();
  const hasMultipleImages = validImages.length > 1;

  // Navegación de imágenes
  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? validImages.length - 1 : prev - 1,
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === validImages.length - 1 ? 0 : prev + 1,
    );
  };

  // Determinar si es evento multi-día
  const isMultiDay =
    es_multidia || (fecha_fin && fecha_fin !== fecha_evento && !es_recurrente);

  // Determinar si es evento recurrente
  const isRecurring = es_recurrente && cantidad_repeticiones > 1;
  // Obtener texto inteligente de recurrencia
  const getRecurrenciaText = () => {
    if (!fechas_recurrencia || fechas_recurrencia.length === 0) {
      if (dia_recurrencia) {
        const cap =
          dia_recurrencia.charAt(0).toUpperCase() + dia_recurrencia.slice(1);
        return `Se repite ${cantidad_repeticiones} ${cap}s`;
      }
      return null;
    }

    const diasNombres = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];
    const diasUnicos = [
      ...new Set(
        fechas_recurrencia.map((f) => new Date(f + "T00:00:00").getDay()),
      ),
    ];

    if (diasUnicos.length === 1) {
      return `Se repite ${fechas_recurrencia.length} ${diasNombres[diasUnicos[0]]}s`;
    }

    // Días variados
    const diasOrdenados = diasUnicos.sort((a, b) => a - b);
    const diasTexto = diasOrdenados.map((d) => diasNombres[d]);

    if (diasTexto.length === 2) {
      return `Se repite: ${diasTexto[0]} y ${diasTexto[1]}`;
    }
    const last = diasTexto.pop();
    return `Se repite: ${diasTexto.join(", ")} y ${last}`;
  };

  const recurrenciaText = isRecurring ? getRecurrenciaText() : null;

  // Calcular duración en días
  const calcularDuracion = () => {
    if (!fecha_evento || !fecha_fin) return null;
    const inicio = new Date(fecha_evento);
    const fin = new Date(fecha_fin);
    const diffTime = Math.abs(fin - inicio);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const duracionDias = isMultiDay ? calcularDuracion() : null;

  // Formatear fecha
  const formatearFecha = (fecha, formato = "largo") => {
    if (!fecha) return null;
    const date = new Date(fecha + "T00:00:00");
    if (formato === "corto") {
      return date.toLocaleDateString("es-CL", {
        day: "numeric",
        month: "short",
      });
    }
    return date.toLocaleDateString("es-CL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Obtener display de fecha (simple, rango o recurrente)
  const getFechaDisplay = () => {
    if (isRecurring && fechas_recurrencia?.length > 0) {
      const primera = formatearFecha(fechas_recurrencia[0], "corto");
      const ultima = formatearFecha(
        fechas_recurrencia[fechas_recurrencia.length - 1],
        "corto",
      );
      const anio = new Date(fechas_recurrencia[0] + "T00:00:00").getFullYear();
      return `${primera} al ${ultima}, ${anio}`;
    }
    if (isMultiDay && fecha_fin) {
      const inicioCorto = formatearFecha(fecha_evento, "corto");
      const finCorto = formatearFecha(fecha_fin, "corto");
      const anio = new Date(fecha_evento + "T00:00:00").getFullYear();
      return `${inicioCorto} al ${finCorto}, ${anio}`;
    }
    return formatearFecha(fecha_evento);
  };

  // Formatear hora (de "HH:MM:SS" a "HH:MM")
  const formatTime = (timeString) => {
    if (!timeString) return null;
    // Si viene en formato "HH:MM:SS", extraer solo "HH:MM"
    const parts = timeString.split(":");
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return timeString;
  };

  // Construir string de horario
  const getHorarioDisplay = () => {
    const inicio = formatTime(hora_inicio);
    const fin = formatTime(hora_fin);

    if (inicio && fin) {
      return `${inicio} - ${fin} hrs`;
    } else if (inicio) {
      return `${inicio} hrs`;
    } else if (fin) {
      return `Hasta ${fin} hrs`;
    }
    return "Por confirmar";
  };

  // Formatear entrada/precio
  const getEntradaDisplay = () => {
    if (tipo_entrada === "pagado" && precio) {
      return `$${Number(precio).toLocaleString("es-CL")}`;
    }
    if (tipo_entrada === "pagado" && !precio) {
      return "Por confirmar";
    }
    if (tipo_entrada === "externo" || tipo_entrada === "venta_externa") {
      return "Venta externa";
    }
    if (
      tipo_entrada === "gratis" ||
      tipo_entrada === "gratuito" ||
      tipo_entrada === "sin_entrada"
    ) {
      return "Entrada gratuita";
    }
    if (precio) {
      return `$${Number(precio).toLocaleString("es-CL")}`;
    }
    return "Entrada gratuita";
  };

  // Extraer coordenadas de la URL de Google Maps
  const extractCoordinates = (url) => {
    if (!url) return null;

    // Patrón para URLs de Google Maps con @lat,lng
    const atPattern = /@(-?\d+\.?\d*),(-?\d+\.?\d*)/;
    // Patrón para URLs con query ?q=lat,lng
    const qPattern = /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
    // Patrón para URLs con /place/lat,lng
    const placePattern = /\/place\/(-?\d+\.?\d*),(-?\d+\.?\d*)/;

    let match =
      url.match(atPattern) || url.match(qPattern) || url.match(placePattern);

    if (match) {
      return {
        lat: parseFloat(match[1]),
        lng: parseFloat(match[2]),
      };
    }
    return null;
  };

  // Obtener coordenadas del evento
  const coordinates = extractCoordinates(ubicacion_url);

  // Generar URL de direcciones de Google Maps
  const getDirectionsUrl = () => {
    if (coordinates) {
      return `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`;
    }
    // Fallback: usar la dirección como destino
    const destination = encodeURIComponent(
      direccion || `${comuna}, ${provincia}, Chile`,
    );
    return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Manejar WhatsApp
  const handleWhatsApp = () => {
    if (whatsapp) {
      const cleanNumber = whatsapp.replace(/\D/g, "");
      window.open(`https://wa.me/${cleanNumber}`, "_blank");
    }
  };

  // Guardar cambios de edición
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Limpiar datos: convertir strings vacíos a null para campos que lo requieren
      const cleanedData = { ...editData };
      const nullableFields = [
        "hora_inicio",
        "hora_fin",
        "fecha_evento",
        "fecha_fin",
        "precio",
        "url_venta",
        "subtitulo",
        "ubicacion_url",
        "telefono_contacto",
        "sitio_web",
        "titulo_marketing",
        "mensaje_marketing",
        "titulo_marketing_2",
        "mensaje_marketing_2",
        "category_id",
      ];
      nullableFields.forEach((field) => {
        if (cleanedData[field] === "") {
          cleanedData[field] = null;
        }
      });
      // Convertir precio a número si existe
      if (cleanedData.precio !== null && cleanedData.precio !== undefined) {
        cleanedData.precio = Number(cleanedData.precio) || null;
      }

      // Mapear tipo_entrada de frontend a DB enum
      const tipoEntradaMap = {
        gratuito: "gratis",
        sin_entrada: "gratis",
        pagado: "pagado",
        venta_externa: "externo",
      };
      if (
        cleanedData.tipo_entrada &&
        tipoEntradaMap[cleanedData.tipo_entrada]
      ) {
        cleanedData.tipo_entrada = tipoEntradaMap[cleanedData.tipo_entrada];
      }

      await updateEvent(publication.id, cleanedData, { adminOverride: true });
      showToast("Cambios guardados exitosamente", "success");
      setIsEditMode(false);
      if (onUpdate) {
        onUpdate({ ...publication, ...editData });
      }
    } catch (error) {
      console.error("Error al guardar cambios:", error);
      showToast("Error al guardar cambios: " + error.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Cancelar edición
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditData({
      titulo: publication.titulo || "",
      subtitulo: publication.subtitulo || "",
      descripcion: publication.descripcion || "",
      organizador: publication.organizador || "",
      category_id: publication.category_id || "",
      fecha_evento: publication.fecha_evento || "",
      fecha_fin: publication.fecha_fin || "",
      hora_inicio: publication.hora_inicio?.slice(0, 5) || "",
      hora_fin: publication.hora_fin?.slice(0, 5) || "",
      provincia: publication.provincia || "",
      comuna: publication.comuna || "",
      direccion: publication.direccion || "",
      ubicacion_url: publication.ubicacion_url || "",
      tipo_entrada: publication.tipo_entrada || "sin_entrada",
      precio: publication.precio || "",
      url_venta: publication.url_venta || "",
      telefono_contacto:
        publication.telefono_contacto || publication.telefono || "",
      sitio_web: publication.sitio_web || "",
      redes_sociales: {
        instagram: publication.redes_sociales?.instagram || "",
        facebook: publication.redes_sociales?.facebook || "",
        whatsapp: publication.redes_sociales?.whatsapp || "",
        tiktok: publication.redes_sociales?.tiktok || "",
        youtube: publication.redes_sociales?.youtube || "",
        twitter: publication.redes_sociales?.twitter || "",
        linkedin: publication.redes_sociales?.linkedin || "",
      },
      titulo_marketing: publication.titulo_marketing || "",
      mensaje_marketing: publication.mensaje_marketing || "",
      titulo_marketing_2: publication.titulo_marketing_2 || "",
      mensaje_marketing_2: publication.mensaje_marketing_2 || "",
    });
  };

  const overlayClassName = [
    "publication-modal-overlay",
    modalVariant ? `publication-modal-overlay--${modalVariant}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const modalClassName = [
    "publication-modal",
    "publication-modal--business-style",
    modalVariant ? `publication-modal--${modalVariant}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return createPortal(
    <div className={overlayClassName} onClick={handleOverlayClick}>
      <div
        className={modalClassName}
        role="dialog"
        aria-modal="true"
        aria-label="Detalle de publicación">
        {/* Categoría en la parte superior con logo */}
        {(categories?.nombre || isEditMode || etiqueta_directa) && (
          <div className="publication-modal__category-header">
            <div className="publication-modal__brand-group">
              <img
                src="/img/P_Extro.png"
                alt="Extrovertidos"
                className="publication-modal__brand-logo"
              />
              <span className="publication-modal__brand-text">panoramas</span>
            </div>
            {!isEditMode && etiqueta_directa && (
              <span className="publication-modal__featured-tag">
                <FontAwesomeIcon icon={faTag} />
                {etiqueta_directa}
              </span>
            )}
            {isEditMode && (
              <div className="publication-modal__category-edit">
                <select
                  className="publication-modal__category-select"
                  value={editData.category_id}
                  onChange={(e) =>
                    setEditData({ ...editData, category_id: e.target.value })
                  }>
                  <option value="">Seleccionar categoría</option>
                  {categoriesList.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icono} {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button className="publication-modal__close" onClick={onClose}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        )}

        {/* Botón cerrar cuando no hay header de categoría */}
        {!(categories?.nombre || isEditMode || etiqueta_directa) && (
          <button className="publication-modal__close" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        )}
        {isEditMode && (
          <div className="publication-modal__actions">
            <button
              className="publication-modal__save-btn"
              onClick={handleSaveChanges}
              disabled={isSaving}>
              <FontAwesomeIcon
                icon={isSaving ? faSpinner : faSave}
                spin={isSaving}
              />
              {isSaving ? "Guardando..." : "Guardar"}
            </button>
            <button
              className="publication-modal__cancel-btn"
              onClick={handleCancelEdit}
              disabled={isSaving}>
              Cancelar
            </button>
          </div>
        )}

        {/* Cuerpo del modal (imagen + contenido) */}
        <div
          className={`publication-modal__body ${isInfoExpanded ? "publication-modal__body--expanded" : ""}`}>
          {/* ===== SECCIÓN IZQUIERDA: IMAGEN ===== */}
          <div
            className={`publication-modal__left ${isInfoExpanded ? "publication-modal__left--hidden" : ""}`}>
            {/* Botón "Más info" flotante sobre la imagen (solo móvil) */}
            <button
              className="publication-modal__mobile-info-btn"
              onClick={() => setIsInfoExpanded(true)}>
              <FontAwesomeIcon icon={faInfoCircle} />
              Más info
              <FontAwesomeIcon
                icon={faChevronUp}
                className="publication-modal__mobile-info-btn-arrow"
              />
            </button>
            {/* Fondo blur */}
            <div
              className="publication-modal__image-bg"
              style={{
                backgroundImage: `url(${validImages[currentImageIndex]})`,
              }}
            />
            <img
              src={validImages[currentImageIndex]}
              alt={titulo}
              className="publication-modal__main-image"
              onError={(e) => {
                e.target.src = "/img/Home1.png";
              }}
            />
            {/* Navegación de imágenes */}
            {hasMultipleImages && (
              <>
                <button
                  className="publication-modal__nav publication-modal__nav--prev"
                  onClick={handlePrevImage}
                  aria-label="Imagen anterior">
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>
                <button
                  className="publication-modal__nav publication-modal__nav--next"
                  onClick={handleNextImage}
                  aria-label="Imagen siguiente">
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>

                {/* Indicadores */}
                <div className="publication-modal__indicators">
                  {validImages.map((_, index) => (
                    <span
                      key={index}
                      className={`publication-modal__indicator ${
                        index === currentImageIndex ? "active" : ""
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Badge de duración para eventos multi-día */}
            {isMultiDay && duracionDias && (
              <span className="publication-modal__duration-badge">
                🎉 {duracionDias} días
              </span>
            )}

            {/* Badge de recurrencia */}
            {isRecurring && recurrenciaText && (
              <span className="publication-modal__recurrence-badge">
                <FontAwesomeIcon icon={faRepeat} />
                {recurrenciaText}
              </span>
            )}
          </div>

          {/* ===== SECCIÓN DERECHA: CONTENIDO ===== */}
          <div
            className={`publication-modal__right ${isInfoExpanded ? "publication-modal__right--expanded" : ""}`}>
            {/* Botón "Ver imagen" para volver (solo móvil, solo cuando está expandido) */}
            {isInfoExpanded && (
              <button
                className="publication-modal__mobile-image-btn"
                onClick={() => setIsInfoExpanded(false)}>
                <FontAwesomeIcon icon={faImage} />
                Ver imagen
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className="publication-modal__mobile-info-btn-arrow"
                />
              </button>
            )}
            {/* Título y organizador */}
            <div className="publication-modal__title-section">
              {!isEditMode && <h2>{titulo}</h2>}
              {isEditMode && (
                <input
                  type="text"
                  className="publication-modal__edit-input publication-modal__edit-input--title"
                  value={editData.titulo}
                  onChange={(e) =>
                    setEditData({ ...editData, titulo: e.target.value })
                  }
                  placeholder="Título del evento"
                />
              )}
            </div>

            {/* Organizador */}
            {!isEditMode && (organizador || profiles?.nombre) && (
              <p className="publication-modal__organizer-line">
                <FontAwesomeIcon icon={faUser} />
                Organiza: {organizador || profiles?.nombre}
              </p>
            )}
            {isEditMode && (
              <div className="publication-modal__edit-section">
                <label className="publication-modal__edit-label">
                  Organizador
                </label>
                <input
                  type="text"
                  className="publication-modal__edit-input"
                  value={editData.organizador}
                  onChange={(e) =>
                    setEditData({ ...editData, organizador: e.target.value })
                  }
                  placeholder="Nombre del organizador"
                />
              </div>
            )}

            {/* ===== ACORDEÓN DE INFORMACIÓN ===== */}
            <div className="publication-modal__accordion-container">
              {/* Sección: Descripción */}
              {(descripcion || isEditMode) && (
                <AccordionSection
                  title="Descripción"
                  icon={faAlignLeft}
                  isOpen={activeSection === ACCORDION_SECTIONS.DESCRIPTION}
                  onToggle={() =>
                    toggleSection(ACCORDION_SECTIONS.DESCRIPTION)
                  }>
                  <div className="publication-modal__description-content">
                    {!isEditMode &&
                      descripcion
                        .split(/\n\s*\n/)
                        .map((paragraph, i) => <p key={i}>{paragraph}</p>)}
                    {isEditMode && (
                      <textarea
                        className="publication-modal__edit-textarea"
                        value={editData.descripcion}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            descripcion: e.target.value,
                          })
                        }
                        placeholder="Descripción del evento"
                        rows={5}
                      />
                    )}
                    {/* Hashtags dentro de descripción */}
                    {!isEditMode && hashtagsList.length > 0 && (
                      <div className="publication-modal__hashtags">
                        {hashtagsList.map((tag, index) => (
                          <span
                            key={index}
                            className="publication-modal__hashtag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </AccordionSection>
              )}

              {/* Sección: Mensaje de Marketing 1 */}
              {(mensaje_marketing || isEditMode) && (
                <AccordionSection
                  title={
                    isEditMode
                      ? editData.titulo_marketing || "Marketing 1"
                      : titulo_marketing || "¡Información Destacada!"
                  }
                  icon={faBullhorn}
                  isOpen={activeSection === ACCORDION_SECTIONS.MARKETING_1}
                  onToggle={() =>
                    toggleSection(ACCORDION_SECTIONS.MARKETING_1)
                  }>
                  <div className="publication-modal__marketing-content">
                    {!isEditMode && <p>{mensaje_marketing}</p>}
                    {isEditMode && (
                      <div className="publication-modal__edit-section">
                        <label className="publication-modal__edit-label">
                          Título Marketing 1
                        </label>
                        <input
                          type="text"
                          className="publication-modal__edit-input"
                          value={editData.titulo_marketing}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              titulo_marketing: e.target.value,
                            })
                          }
                          placeholder="Título del mensaje de marketing"
                        />
                        <label className="publication-modal__edit-label">
                          Mensaje Marketing 1
                        </label>
                        <textarea
                          className="publication-modal__edit-textarea"
                          value={editData.mensaje_marketing}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              mensaje_marketing: e.target.value,
                            })
                          }
                          placeholder="Mensaje de marketing"
                          rows={3}
                        />
                      </div>
                    )}
                  </div>
                </AccordionSection>
              )}

              {/* Sección: Mensaje de Marketing 2 */}
              {(mensaje_marketing_2 || isEditMode) && (
                <AccordionSection
                  title={
                    isEditMode
                      ? editData.titulo_marketing_2 || "Marketing 2"
                      : titulo_marketing_2 || "¡No te lo pierdas!"
                  }
                  icon={faBullhorn}
                  isOpen={activeSection === ACCORDION_SECTIONS.MARKETING_2}
                  onToggle={() =>
                    toggleSection(ACCORDION_SECTIONS.MARKETING_2)
                  }>
                  <div className="publication-modal__marketing-content">
                    {!isEditMode && <p>{mensaje_marketing_2}</p>}
                    {isEditMode && (
                      <div className="publication-modal__edit-section">
                        <label className="publication-modal__edit-label">
                          Título Marketing 2
                        </label>
                        <input
                          type="text"
                          className="publication-modal__edit-input"
                          value={editData.titulo_marketing_2}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              titulo_marketing_2: e.target.value,
                            })
                          }
                          placeholder="Título del mensaje de marketing 2"
                        />
                        <label className="publication-modal__edit-label">
                          Mensaje Marketing 2
                        </label>
                        <textarea
                          className="publication-modal__edit-textarea"
                          value={editData.mensaje_marketing_2}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              mensaje_marketing_2: e.target.value,
                            })
                          }
                          placeholder="Mensaje de marketing 2"
                          rows={3}
                        />
                      </div>
                    )}
                  </div>
                </AccordionSection>
              )}

              {/* Sección: Información (contiene Ubicación, Horarios y Mapa) */}
              <AccordionSection
                title="Información"
                icon={faInfoCircle}
                isOpen={activeSection === ACCORDION_SECTIONS.INFORMATION}
                onToggle={() => toggleSection(ACCORDION_SECTIONS.INFORMATION)}>
                <div className="publication-modal__info-nested">
                  {/* Sección: Ubicación */}
                  <div className="publication-modal__info-section">
                    <h4 className="publication-modal__info-section-title">
                      <FontAwesomeIcon icon={faMapMarkerAlt} />
                      Ubicación
                    </h4>
                    <div className="publication-modal__location-content">
                      {!isEditMode && (
                        <>
                          <p className="publication-modal__location-address">
                            {direccion ||
                              `${comuna}${provincia ? `, ${provincia}` : ""}`}
                          </p>
                          {ubicacion_url && (
                            <button
                              className="publication-modal__directions-btn publication-modal__directions-btn--full"
                              onClick={() =>
                                window.open(
                                  ubicacion_url,
                                  "_blank",
                                  "noopener,noreferrer",
                                )
                              }>
                              <FontAwesomeIcon icon={faMapMarkerAlt} />
                              Ir a la ubicación
                            </button>
                          )}
                        </>
                      )}
                      {isEditMode && (
                        <div className="publication-modal__edit-section">
                          <label className="publication-modal__edit-label">
                            Provincia
                          </label>
                          <select
                            className="publication-modal__edit-select"
                            value={editData.provincia}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                provincia: e.target.value,
                              })
                            }>
                            <option value="">Seleccionar provincia</option>
                            {PROVINCIAS.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                          <label className="publication-modal__edit-label">
                            Comuna
                          </label>
                          <input
                            type="text"
                            className="publication-modal__edit-input"
                            value={editData.comuna}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                comuna: e.target.value,
                              })
                            }
                            placeholder="Comuna"
                          />
                          <label className="publication-modal__edit-label">
                            Dirección
                          </label>
                          <input
                            type="text"
                            className="publication-modal__edit-input"
                            value={editData.direccion}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                direccion: e.target.value,
                              })
                            }
                            placeholder="Dirección"
                          />
                          <label className="publication-modal__edit-label">
                            URL de ubicación
                          </label>
                          <input
                            type="url"
                            className="publication-modal__edit-input"
                            value={editData.ubicacion_url}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                ubicacion_url: e.target.value,
                              })
                            }
                            placeholder="https://maps.google.com/..."
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sección: Horarios */}
                  <div className="publication-modal__info-section">
                    <h4 className="publication-modal__info-section-title">
                      <FontAwesomeIcon icon={faClock} />
                      Horarios
                    </h4>
                    <div className="publication-modal__schedule">
                      {!isEditMode && (
                        <>
                          <div className="publication-modal__schedule-row">
                            <span className="publication-modal__schedule-label">
                              <FontAwesomeIcon icon={faCalendarDays} />
                              {isRecurring
                                ? "Fechas"
                                : isMultiDay
                                  ? "Fechas"
                                  : "Fecha"}
                            </span>
                            <span className="publication-modal__schedule-value">
                              {getFechaDisplay() || "Por confirmar"}
                            </span>
                          </div>

                          {/* Fechas individuales de recurrencia */}
                          {isRecurring && fechas_recurrencia?.length > 0 && (
                            <div className="publication-modal__recurrence-dates">
                              <span className="publication-modal__recurrence-label">
                                <FontAwesomeIcon icon={faRepeat} />
                                {recurrenciaText}
                              </span>
                              <div className="publication-modal__recurrence-chips">
                                {fechas_recurrencia.map((fecha, index) => (
                                  <span
                                    key={index}
                                    className="publication-modal__recurrence-chip">
                                    {new Date(
                                      fecha + "T00:00:00",
                                    ).toLocaleDateString("es-CL", {
                                      weekday: "short",
                                      day: "numeric",
                                      month: "short",
                                    })}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="publication-modal__schedule-row">
                            <span className="publication-modal__schedule-label">
                              <FontAwesomeIcon icon={faClock} />
                              Horario
                            </span>
                            <span className="publication-modal__schedule-value">
                              {getHorarioDisplay()}
                            </span>
                          </div>
                          <div className="publication-modal__schedule-row">
                            <span className="publication-modal__schedule-label">
                              <FontAwesomeIcon icon={faTicket} />
                              Entrada
                            </span>
                            <span className="publication-modal__schedule-value publication-modal__schedule-value--price">
                              {(tipo_entrada === "externo" ||
                                tipo_entrada === "venta_externa") &&
                              url_venta ? (
                                <a
                                  href={url_venta}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="publication-modal__entrada-link">
                                  Ver entradas ↗
                                </a>
                              ) : (
                                getEntradaDisplay()
                              )}
                            </span>
                          </div>
                        </>
                      )}
                      {isEditMode && (
                        <div className="publication-modal__edit-section">
                          <div className="publication-modal__edit-row">
                            <div className="publication-modal__edit-field">
                              <label className="publication-modal__edit-label">
                                Fecha inicio
                              </label>
                              <input
                                type="date"
                                className="publication-modal__edit-input"
                                value={editData.fecha_evento}
                                onChange={(e) =>
                                  setEditData({
                                    ...editData,
                                    fecha_evento: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="publication-modal__edit-field">
                              <label className="publication-modal__edit-label">
                                Fecha fin
                              </label>
                              <input
                                type="date"
                                className="publication-modal__edit-input"
                                value={editData.fecha_fin}
                                onChange={(e) =>
                                  setEditData({
                                    ...editData,
                                    fecha_fin: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                          <div className="publication-modal__edit-row">
                            <div className="publication-modal__edit-field">
                              <label className="publication-modal__edit-label">
                                Hora inicio
                              </label>
                              <div className="publication-modal__edit-time-wrap">
                                <input
                                  type="time"
                                  className="publication-modal__edit-input"
                                  value={editData.hora_inicio}
                                  onChange={(e) =>
                                    setEditData({
                                      ...editData,
                                      hora_inicio: e.target.value,
                                    })
                                  }
                                />
                                {editData.hora_inicio && (
                                  <button
                                    type="button"
                                    className="publication-modal__edit-time-clear"
                                    onClick={() =>
                                      setEditData({
                                        ...editData,
                                        hora_inicio: "",
                                      })
                                    }
                                    aria-label="Limpiar hora inicio">
                                    <FontAwesomeIcon icon={faTimes} />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="publication-modal__edit-field">
                              <label className="publication-modal__edit-label">
                                Hora fin
                              </label>
                              <div className="publication-modal__edit-time-wrap">
                                <input
                                  type="time"
                                  className="publication-modal__edit-input"
                                  value={editData.hora_fin}
                                  onChange={(e) =>
                                    setEditData({
                                      ...editData,
                                      hora_fin: e.target.value,
                                    })
                                  }
                                />
                                {editData.hora_fin && (
                                  <button
                                    type="button"
                                    className="publication-modal__edit-time-clear"
                                    onClick={() =>
                                      setEditData({ ...editData, hora_fin: "" })
                                    }
                                    aria-label="Limpiar hora fin">
                                    <FontAwesomeIcon icon={faTimes} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          <label className="publication-modal__edit-label">
                            Tipo de entrada
                          </label>
                          <select
                            className="publication-modal__edit-select"
                            value={editData.tipo_entrada}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                tipo_entrada: e.target.value,
                              })
                            }>
                            {TIPOS_ENTRADA.map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                          {(editData.tipo_entrada === "pagado" ||
                            editData.tipo_entrada === "venta_externa") && (
                            <>
                              <label className="publication-modal__edit-label">
                                Precio
                              </label>
                              <input
                                type="number"
                                className="publication-modal__edit-input"
                                value={editData.precio}
                                onChange={(e) =>
                                  setEditData({
                                    ...editData,
                                    precio: e.target.value,
                                  })
                                }
                                placeholder="Precio en CLP"
                              />
                            </>
                          )}
                          {editData.tipo_entrada === "venta_externa" && (
                            <>
                              <label className="publication-modal__edit-label">
                                URL de venta
                              </label>
                              <input
                                type="url"
                                className="publication-modal__edit-input"
                                value={editData.url_venta}
                                onChange={(e) =>
                                  setEditData({
                                    ...editData,
                                    url_venta: e.target.value,
                                  })
                                }
                                placeholder="https://..."
                              />
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sección: Contacto (dentro de Información) */}
                  {!isEditMode && (contactPhone || sitio_web) && (
                    <div className="publication-modal__info-section">
                      <h4 className="publication-modal__info-section-title">
                        <FontAwesomeIcon icon={faAddressCard} />
                        Contacto
                      </h4>
                      <div className="publication-modal__contact-content">
                        {contactPhone && (
                          <a
                            href={`tel:${contactPhone}`}
                            className="publication-modal__contact-item">
                            <FontAwesomeIcon icon={faPhone} />
                            <span>{contactPhone}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  {isEditMode && (
                    <div className="publication-modal__info-section">
                      <h4 className="publication-modal__info-section-title">
                        <FontAwesomeIcon icon={faAddressCard} />
                        Contacto
                      </h4>
                      <div className="publication-modal__edit-section">
                        <label className="publication-modal__edit-label">
                          Teléfono de contacto
                        </label>
                        <input
                          type="tel"
                          className="publication-modal__edit-input"
                          value={editData.telefono_contacto}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              telefono_contacto: e.target.value,
                            })
                          }
                          placeholder="+56 9 1234 5678"
                        />
                        <label className="publication-modal__edit-label">
                          Sitio web
                        </label>
                        <input
                          type="url"
                          className="publication-modal__edit-input"
                          value={editData.sitio_web}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              sitio_web: e.target.value,
                            })
                          }
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              </AccordionSection>
            </div>

            {/* ===== SECCIÓN DE REDES SOCIALES (Debajo del mapa) ===== */}
            {!isEditMode &&
              (instagram ||
                facebook ||
                whatsapp ||
                youtube ||
                tiktok ||
                twitter ||
                linkedin ||
                sitio_web) && (
                <div className="publication-modal__social-section">
                  <h4 className="publication-modal__social-title">
                    <FontAwesomeIcon icon={faShareAlt} />
                    Síguenos en redes
                  </h4>
                  <div className="publication-modal__social-bar">
                    {sitio_web && (
                      <a
                        href={
                          sitio_web.startsWith("http")
                            ? sitio_web
                            : `https://${sitio_web}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="publication-modal__social-icon publication-modal__social-icon--website"
                        title="Sitio Web">
                        <FontAwesomeIcon icon={faGlobe} />
                      </a>
                    )}
                    {whatsapp && (
                      <button
                        className="publication-modal__social-icon publication-modal__social-icon--whatsapp"
                        onClick={handleWhatsApp}
                        title="WhatsApp">
                        <FontAwesomeIcon icon={faWhatsapp} />
                      </button>
                    )}
                    {instagram && (
                      <a
                        href={
                          instagram.startsWith("http")
                            ? instagram
                            : `https://instagram.com/${instagram.replace("@", "")}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="publication-modal__social-icon publication-modal__social-icon--instagram"
                        title="Instagram">
                        <FontAwesomeIcon icon={faInstagram} />
                      </a>
                    )}
                    {facebook && (
                      <a
                        href={
                          facebook.startsWith("http")
                            ? facebook
                            : `https://facebook.com/${facebook}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="publication-modal__social-icon publication-modal__social-icon--facebook"
                        title="Facebook">
                        <FontAwesomeIcon icon={faFacebook} />
                      </a>
                    )}
                    {youtube && (
                      <a
                        href={
                          youtube.startsWith("http")
                            ? youtube
                            : `https://youtube.com/${youtube}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="publication-modal__social-icon publication-modal__social-icon--youtube"
                        title="YouTube">
                        <FontAwesomeIcon icon={faYoutube} />
                      </a>
                    )}
                    {tiktok && (
                      <a
                        href={
                          tiktok.startsWith("http")
                            ? tiktok
                            : `https://tiktok.com/@${tiktok.replace("@", "")}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="publication-modal__social-icon publication-modal__social-icon--tiktok"
                        title="TikTok">
                        <FontAwesomeIcon icon={faTiktok} />
                      </a>
                    )}
                    {twitter && (
                      <a
                        href={
                          twitter.startsWith("http")
                            ? twitter
                            : `https://x.com/${twitter.replace("@", "")}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="publication-modal__social-icon publication-modal__social-icon--twitter"
                        title="X (Twitter)">
                        <FontAwesomeIcon icon={faXTwitter} />
                      </a>
                    )}
                    {linkedin && (
                      <a
                        href={
                          linkedin.startsWith("http")
                            ? linkedin
                            : `https://linkedin.com/company/${linkedin}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="publication-modal__social-icon publication-modal__social-icon--linkedin"
                        title="LinkedIn">
                        <FontAwesomeIcon icon={faLinkedin} />
                      </a>
                    )}
                  </div>
                </div>
              )}
            {isEditMode && (
              <div className="publication-modal__social-section">
                <h4 className="publication-modal__social-title">
                  <FontAwesomeIcon icon={faShareAlt} />
                  Redes Sociales
                </h4>
                <div className="publication-modal__edit-section">
                  <label className="publication-modal__edit-label">
                    <FontAwesomeIcon icon={faInstagram} /> Instagram
                  </label>
                  <input
                    type="text"
                    className="publication-modal__edit-input"
                    value={editData.redes_sociales?.instagram || ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        redes_sociales: {
                          ...editData.redes_sociales,
                          instagram: e.target.value,
                        },
                      })
                    }
                    placeholder="@usuario o URL"
                  />
                  <label className="publication-modal__edit-label">
                    <FontAwesomeIcon icon={faFacebook} /> Facebook
                  </label>
                  <input
                    type="text"
                    className="publication-modal__edit-input"
                    value={editData.redes_sociales?.facebook || ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        redes_sociales: {
                          ...editData.redes_sociales,
                          facebook: e.target.value,
                        },
                      })
                    }
                    placeholder="Nombre de página o URL"
                  />
                  <label className="publication-modal__edit-label">
                    <FontAwesomeIcon icon={faWhatsapp} /> WhatsApp
                  </label>
                  <input
                    type="text"
                    className="publication-modal__edit-input"
                    value={editData.redes_sociales?.whatsapp || ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        redes_sociales: {
                          ...editData.redes_sociales,
                          whatsapp: e.target.value,
                        },
                      })
                    }
                    placeholder="+56 9 1234 5678"
                  />
                  <label className="publication-modal__edit-label">
                    <FontAwesomeIcon icon={faTiktok} /> TikTok
                  </label>
                  <input
                    type="text"
                    className="publication-modal__edit-input"
                    value={editData.redes_sociales?.tiktok || ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        redes_sociales: {
                          ...editData.redes_sociales,
                          tiktok: e.target.value,
                        },
                      })
                    }
                    placeholder="@usuario"
                  />
                  <label className="publication-modal__edit-label">
                    <FontAwesomeIcon icon={faYoutube} /> YouTube
                  </label>
                  <input
                    type="text"
                    className="publication-modal__edit-input"
                    value={editData.redes_sociales?.youtube || ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        redes_sociales: {
                          ...editData.redes_sociales,
                          youtube: e.target.value,
                        },
                      })
                    }
                    placeholder="URL del canal"
                  />
                  <label className="publication-modal__edit-label">
                    <FontAwesomeIcon icon={faXTwitter} /> Twitter / X
                  </label>
                  <input
                    type="text"
                    className="publication-modal__edit-input"
                    value={editData.redes_sociales?.twitter || ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        redes_sociales: {
                          ...editData.redes_sociales,
                          twitter: e.target.value,
                        },
                      })
                    }
                    placeholder="@usuario o URL"
                  />
                  <label className="publication-modal__edit-label">
                    <FontAwesomeIcon icon={faLinkedin} /> LinkedIn
                  </label>
                  <input
                    type="text"
                    className="publication-modal__edit-input"
                    value={editData.redes_sociales?.linkedin || ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        redes_sociales: {
                          ...editData.redes_sociales,
                          linkedin: e.target.value,
                        },
                      })
                    }
                    placeholder="URL de perfil"
                  />
                </div>
              </div>
            )}

            {/* Publicado por - Abajo */}
            {profiles?.nombre && (
              <div className="publication-modal__owner publication-modal__owner--bottom">
                {profiles.avatar_url ? (
                  <img src={profiles.avatar_url} alt={profiles.nombre} />
                ) : (
                  <div className="publication-modal__owner-placeholder">
                    <FontAwesomeIcon icon={faUser} />
                  </div>
                )}
                <div>
                  <span>Publicado por</span>
                  <strong>{profiles.nombre}</strong>
                </div>
              </div>
            )}

            {/* Botones CTA */}
            <div className="publication-modal__cta-section">
              {canEdit && !isEditMode && (
                <button
                  className="publication-modal__cta-btn publication-modal__cta-btn--edit"
                  onClick={() => setIsEditMode(true)}>
                  <FontAwesomeIcon icon={faPencil} />
                  Editar
                </button>
              )}
              <button
                className={`publication-modal__cta-btn publication-modal__cta-btn--imperdible ${isLiked ? "publication-modal__cta-btn--imperdible-active" : ""}`}
                onClick={handleLikeClick}
                disabled={isTogglingLike}>
                <FontAwesomeIcon icon={faFire} />
                {likeCount > 0 ? likeCount : ""} Imperdible
              </button>
              <button
                className="publication-modal__cta-btn publication-modal__cta-btn--secondary"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: titulo,
                      text: `¡Mira este evento! ${titulo}`,
                      url: window.location.href,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert("¡Enlace copiado al portapapeles!");
                  }
                }}>
                <FontAwesomeIcon icon={faShareAlt} />
                Compartir
              </button>
              <button
                className={`publication-modal__cta-btn publication-modal__cta-btn--outline${isSaved ? " publication-modal__cta-btn--saved" : ""}`}
                onClick={handleSaveClick}
                disabled={isTogglingSave}>
                <FontAwesomeIcon icon={faBookmark} />
                {isSaved ? "Guardado" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
