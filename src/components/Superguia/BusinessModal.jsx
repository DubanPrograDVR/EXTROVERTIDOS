import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useRealtimeRefetch } from "../../hooks/useRealtimeRefetch";
import {
  updateBusiness,
  getBusinessCategories,
  toggleBusinessFavorite,
  isBusinessFavorite,
  toggleBusinessLike,
  hasUserLikedBusiness,
  getBusinessLikesCount,
} from "../../lib/database";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faMapMarkerAlt,
  faPhone,
  faEnvelope,
  faGlobe,
  faClock,
  faChevronLeft,
  faChevronRight,
  faChevronDown,
  faChevronUp,
  faCheckCircle,
  faRoute,
  faAlignLeft,
  faAddressCard,
  faUser,
  faExternalLinkAlt,
  faShareAlt,
  faBookmark,
  faStar,
  faBullhorn,
  faPencil,
  faSave,
  faSpinner,
  faInfoCircle,
  faImage,
} from "@fortawesome/free-solid-svg-icons";
import {
  faWhatsapp,
  faInstagram,
  faFacebook,
  faTiktok,
  faXTwitter,
  faYoutube,
  faLinkedin,
} from "@fortawesome/free-brands-svg-icons";
import "./styles/BusinessModal.css";
import "../Home/Negocio/styles/publicar-negocio.css";
import AuthModal from "../Auth/AuthModal";
import HorariosSection from "../Home/Negocio/components/HorariosSection";

// Convierte horarios JSONB → campos del formulario
const parseHorarios = (horarios) => {
  if (
    !horarios ||
    typeof horarios !== "object" ||
    Object.keys(horarios).length === 0
  ) {
    return { dias_atencion: [], horarios_detalle: {}, abierto_24h: false };
  }
  const abierto_24h = Boolean(horarios.abierto_24h);
  const dias = Object.keys(horarios).filter(
    (k) => k !== "abierto_24h" && !horarios[k]?.cerrado,
  );
  const horarios_detalle = {};
  dias.forEach((dia) => {
    horarios_detalle[dia] = Array.isArray(horarios[dia])
      ? horarios[dia]
      : horarios[dia]
        ? [horarios[dia]]
        : [{ apertura: "09:00", cierre: "18:00" }];
  });
  return { dias_atencion: dias, horarios_detalle, abierto_24h };
};

// Convierte campos del formulario → horarios JSONB
const serializeHorarios = (dias_atencion, horarios_detalle, abierto_24h) => {
  if (abierto_24h) return { abierto_24h: true };
  const result = {};
  dias_atencion.forEach((dia) => {
    result[dia] = horarios_detalle[dia] || [
      { apertura: "09:00", cierre: "18:00" },
    ];
  });
  return result;
};

const PLACEHOLDER_IMAGE = "/img/Home1.png";

// Tipos de secciones del acordeón
const ACCORDION_SECTIONS = {
  DESCRIPTION: "description",
  MARKETING_1: "marketing_1",
  MARKETING_2: "marketing_2",
  LOCATION: "location",
  SCHEDULE: "schedule",
  INFO: "info",
};

const shouldPreserveLineBreaks = (lines) =>
  lines.length > 1 &&
  lines.every((line) => {
    const trimmedLine = line.trim();
    return /^[^\p{L}\p{N}]/u.test(trimmedLine) || /^\d+[.)-]/.test(trimmedLine);
  });

const getFormattedTextBlocks = (text) => {
  if (!text) return [];

  return text
    .split(/\n\s*\n/)
    .map((block) => {
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length === 0) return null;

      return shouldPreserveLineBreaks(lines)
        ? lines.join("\n")
        : lines.join(" ");
    })
    .filter(Boolean);
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
        aria-expanded={isOpen}>
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
      <div className={`accordion-section__content ${isOpen ? "open" : ""}`}>
        <div className="accordion-section__body">{children}</div>
      </div>
    </div>
  );
};

export default function BusinessModal({
  business: rawBusiness,
  isOpen,
  onClose,
  onUpdate,
  startInEditMode = false,
}) {
  const { user, isAdmin, isModerator } = useAuth();
  const { showToast } = useToast();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [activeSection, setActiveSection] = useState(
    ACCORDION_SECTIONS.DESCRIPTION,
  );
  const [isEditMode, setIsEditMode] = useState(startInEditMode);
  const [editData, setEditData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [categoriesList, setCategoriesList] = useState([]);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isTogglingSave, setIsTogglingSave] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isTogglingLike, setIsTogglingLike] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Overrides locales aplicados tras un guardado para reflejar los cambios
  // en vivo sin depender de que el padre recargue el negocio.
  const [liveOverrides, setLiveOverrides] = useState(null);
  const business = useMemo(
    () =>
      liveOverrides && rawBusiness
        ? { ...rawBusiness, ...liveOverrides }
        : rawBusiness,
    [rawBusiness, liveOverrides],
  );

  const canEdit = isAdmin || isModerator;

  // Cargar categorías para el selector de edición
  useEffect(() => {
    if (canEdit) {
      getBusinessCategories()
        .then((cats) => setCategoriesList(cats || []))
        .catch((err) => console.error("Error cargando categorías:", err));
    }
  }, [canEdit]);

  // Cargar estado de favorito y like al montar
  const loadInteractions = useCallback(() => {
    if (!business?.id) return;
    getBusinessLikesCount(business.id)
      .then((count) => setLikeCount(count))
      .catch((err) => console.error("Error cargando likes:", err));

    if (user) {
      Promise.all([
        isBusinessFavorite(user.id, business.id),
        hasUserLikedBusiness(user.id, business.id),
      ])
        .then(([saved, liked]) => {
          setIsSaved(saved);
          setIsLiked(liked);
        })
        .catch((err) => console.error("Error cargando interacciones:", err));
    }
  }, [user, business?.id]);

  useEffect(() => {
    loadInteractions();
  }, [loadInteractions]);

  // Tiempo real: refrescar cuando cualquier usuario reacciona
  useRealtimeRefetch({
    table: "business_likes",
    event: "*",
    filter: business?.id ? `business_id=eq.${business.id}` : undefined,
    enabled: Boolean(business?.id),
    onChange: () => loadInteractions(),
  });

  // Subcategorías filtradas según categoría seleccionada
  const availableSubcategories =
    categoriesList.find(
      (c) => c.nombre === (isEditMode ? editData.categoria : ""),
    )?.subcategorias || [];

  // Función para alternar secciones del acordeón
  const toggleSection = useCallback((section) => {
    setActiveSection((prev) => (prev === section ? null : section));
  }, []);

  // Cerrar con ESC y manejar scroll
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    } else {
      setActiveSection(ACCORDION_SECTIONS.DESCRIPTION);
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  // Resetear imagen al cambiar negocio
  useEffect(() => {
    setCurrentImageIndex(0);
    setImageError(false);
    setIsEditMode(startInEditMode);
    setIsInfoExpanded(false);
    setLiveOverrides(null);
    // Inicializar datos de edición
    if (business) {
      setEditData({
        nombre: business.nombre || "",
        descripcion: business.descripcion || "",
        categoria: business.categoria || "",
        subcategoria: business.subcategoria || "",
        telefono: business.telefono || "",
        email: business.email || "",
        whatsapp: business.whatsapp || "",
        instagram: business.instagram || "",
        facebook: business.facebook || "",
        tiktok: business.tiktok || "",
        youtube: business.youtube || "",
        twitter: business.twitter || "",
        linkedin: business.linkedin || "",
        sitio_web: business.sitio_web || "",
        ubicacion_url: business.ubicacion_url || "",
        titulo_marketing: business.titulo_marketing || "",
        mensaje_marketing: business.mensaje_marketing || "",
        titulo_marketing_2: business.titulo_marketing_2 || "",
        mensaje_marketing_2: business.mensaje_marketing_2 || "",
        ...parseHorarios(business.horarios),
      });
    }
  }, [business?.id, isOpen]);

  if (!isOpen || !business) return null;

  const {
    nombre,
    slogan,
    descripcion,
    imagen_url,
    logo_url,
    imagen_portada_url,
    galeria,
    imagenes,
    comuna,
    provincia,
    region,
    direccion,
    ubicacion_url,
    categoria,
    subcategoria,
    telefono,
    email,
    whatsapp,
    instagram,
    facebook,
    tiktok,
    sitio_web,
    redes_sociales,
    horarios,
    dias_atencion,
    horario_apertura,
    horario_cierre,
    verificado,
    profiles,
    titulo_marketing,
    mensaje_marketing,
    titulo_marketing_2,
    mensaje_marketing_2,
  } = business;

  // Obtener array de imágenes válidas
  const getValidImages = () => {
    if (Array.isArray(galeria) && galeria.length > 0) {
      return galeria;
    }
    if (Array.isArray(imagenes) && imagenes.length > 0) {
      return imagenes;
    }
    if (imagen_portada_url) {
      return [imagen_portada_url];
    }
    if (imagen_url) {
      return [imagen_url];
    }
    if (logo_url) {
      return [logo_url];
    }
    return [PLACEHOLDER_IMAGE];
  };

  const validImages = getValidImages();
  const hasMultipleImages = validImages.length > 1;

  const getCurrentImageUrl = () => {
    if (imageError) return PLACEHOLDER_IMAGE;
    return validImages[currentImageIndex] || PLACEHOLDER_IMAGE;
  };

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

  // Obtener detalle de horarios por día
  const getHorarioDetalle = () => {
    const diasOrden = [
      { keys: ["Lunes", "lunes"], label: "LUN" },
      { keys: ["Martes", "martes"], label: "MAR" },
      {
        keys: ["Miércoles", "miércoles", "Miercoles", "miercoles"],
        label: "MIE",
      },
      { keys: ["Jueves", "jueves"], label: "JUE" },
      { keys: ["Viernes", "viernes"], label: "VIE" },
      { keys: ["Sábado", "sábado", "Sabado", "sabado"], label: "SÁB" },
      { keys: ["Domingo", "domingo"], label: "DOM" },
    ];

    const formatHora = (hora) => {
      if (!hora) return "";
      const partes = hora.split(":");
      return `${partes[0]}:${partes[1]}`;
    };

    // Intentar usar horarios JSONB (fuente principal)
    if (
      horarios &&
      typeof horarios === "object" &&
      Object.keys(horarios).length > 0
    ) {
      if (horarios.abierto_24h) {
        return [{ label: "TODOS", horario: "Abierto 24h", abierto: true }];
      }

      const detalle = [];
      diasOrden.forEach(({ keys, label }) => {
        const data = keys.reduce((found, k) => found || horarios[k], null);
        if (data && !data.cerrado) {
          let horarioTexto = "Consultar";
          if (Array.isArray(data) && data.length > 0) {
            const turno = data[0];
            if (turno.apertura && turno.cierre) {
              horarioTexto = `${formatHora(turno.apertura)} - ${formatHora(turno.cierre)}`;
            }
          } else if (data.apertura && data.cierre) {
            horarioTexto = `${formatHora(data.apertura)} - ${formatHora(data.cierre)}`;
          }
          detalle.push({ label, horario: horarioTexto, abierto: true });
        }
      });

      return detalle.length > 0 ? detalle : null;
    }

    // Fallback: dias_atencion + horario_apertura/horario_cierre
    const tieneDias = Array.isArray(dias_atencion) && dias_atencion.length > 0;
    const tieneHorario = horario_apertura || horario_cierre;
    if (!tieneDias && !tieneHorario) return null;

    const diasAbrev = {
      Lunes: "LUN",
      Martes: "MAR",
      Miércoles: "MIE",
      Miercoles: "MIE",
      Jueves: "JUE",
      Viernes: "VIE",
      Sábado: "SÁB",
      Sabado: "SÁB",
      Domingo: "DOM",
    };

    let horarioTexto = "Consultar";
    if (horario_apertura && horario_cierre) {
      horarioTexto = `${formatHora(horario_apertura)} - ${formatHora(horario_cierre)}`;
    }

    if (tieneDias) {
      return dias_atencion.map((dia) => ({
        label: diasAbrev[dia] || dia.substring(0, 3).toUpperCase(),
        horario: horarioTexto,
        abierto: true,
      }));
    }

    return [{ label: "TODOS", horario: horarioTexto, abierto: true }];
  };

  const horarioDetalle = getHorarioDetalle();

  // Handlers para acciones
  const handleWhatsApp = () => {
    if (whatsapp) {
      const cleanNumber = whatsapp.replace(/\D/g, "");
      window.open(`https://wa.me/${cleanNumber}`, "_blank");
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Guardar cambios de edición
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const { dias_atencion, horarios_detalle, abierto_24h, ...rest } =
        editData;
      const dataToSave = {
        ...rest,
        horarios: serializeHorarios(
          dias_atencion,
          horarios_detalle,
          abierto_24h,
        ),
      };
      await updateBusiness(business.id, dataToSave, undefined, {
        adminOverride: canEdit,
      });
      showToast("Cambios guardados exitosamente", "success");
      setIsEditMode(false);
      // Aplicar los cambios en vivo sobre la vista previa del modal
      setLiveOverrides((prev) => ({ ...(prev || {}), ...dataToSave }));
      if (onUpdate) {
        onUpdate({ ...business, ...dataToSave });
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
      nombre: business.nombre || "",
      descripcion: business.descripcion || "",
      categoria: business.categoria || "",
      subcategoria: business.subcategoria || "",
      telefono: business.telefono || "",
      email: business.email || "",
      whatsapp: business.whatsapp || "",
      instagram: business.instagram || "",
      facebook: business.facebook || "",
      tiktok: business.tiktok || "",
      youtube: business.youtube || "",
      twitter: business.twitter || "",
      linkedin: business.linkedin || "",
      sitio_web: business.sitio_web || "",
      ubicacion_url: business.ubicacion_url || "",
      titulo_marketing: business.titulo_marketing || "",
      mensaje_marketing: business.mensaje_marketing || "",
      titulo_marketing_2: business.titulo_marketing_2 || "",
      mensaje_marketing_2: business.mensaje_marketing_2 || "",
      ...parseHorarios(business.horarios),
    });
  };

  return (
    <div className="publication-modal-overlay" onClick={handleOverlayClick}>
      <div
        className="publication-modal publication-modal--business"
        role="dialog"
        aria-modal="true"
        aria-label="Detalle del negocio">
        {/* Header con logo y branding */}
        <div className="publication-modal__category-header">
          <div className="publication-modal__brand-group">
            <img
              src="/img/SG_Extro.png"
              alt="Superguía"
              className="publication-modal__brand-logo"
            />
            <span className="publication-modal__brand-text">superguía</span>
          </div>
          {!isEditMode && subcategoria && (
            <span className="publication-modal__subcategory-tag">
              {subcategoria}
            </span>
          )}
          {isEditMode && (
            <div className="publication-modal__category-edit">
              <select
                className="publication-modal__category-select"
                value={editData.categoria}
                onChange={(e) => {
                  const newCat = e.target.value;
                  setEditData({
                    ...editData,
                    categoria: newCat,
                    subcategoria: "",
                  });
                }}>
                <option value="">Seleccionar categoría</option>
                {categoriesList.map((cat) => (
                  <option key={cat.id} value={cat.nombre}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
              <select
                className="publication-modal__category-select"
                value={editData.subcategoria}
                onChange={(e) =>
                  setEditData({ ...editData, subcategoria: e.target.value })
                }
                disabled={
                  !editData.categoria || availableSubcategories.length === 0
                }>
                <option value="">Seleccionar subcategoría</option>
                {availableSubcategories.map((sub, idx) => (
                  <option key={idx} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          )}
          {verificado && (
            <span className="publication-modal__verified-badge">
              <FontAwesomeIcon icon={faCheckCircle} />
              Verificado
            </span>
          )}
        </div>

        {/* Barra de edición (solo visible en modo edición) */}
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

        {/* Botón cerrar */}
        <button className="publication-modal__close" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>

        {/* Cuerpo del modal */}
        <div
          className={`publication-modal__body ${isInfoExpanded ? "publication-modal__body--expanded" : ""}`}>
          {/* SECCIÓN IZQUIERDA: IMAGEN */}
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
            <div
              className="publication-modal__image-bg"
              style={{ backgroundImage: `url(${getCurrentImageUrl()})` }}
            />
            <img
              src={getCurrentImageUrl()}
              alt={nombre}
              className="publication-modal__main-image"
              onError={() => setImageError(true)}
            />

            {/* Navegación de imágenes */}
            {hasMultipleImages && (
              <>
                <button
                  className="publication-modal__nav publication-modal__nav--prev"
                  onClick={handlePrevImage}>
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>
                <button
                  className="publication-modal__nav publication-modal__nav--next"
                  onClick={handleNextImage}>
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
                <div className="publication-modal__indicators">
                  {validImages.map((_, index) => (
                    <span
                      key={index}
                      className={`publication-modal__indicator ${index === currentImageIndex ? "active" : ""}`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* SECCIÓN DERECHA: CONTENIDO */}
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
            {/* Título - Modo Lectura */}
            {!isEditMode && (
              <div className="publication-modal__title-section">
                <h2>{nombre}</h2>
                {slogan && (
                  <p className="publication-modal__slogan">{slogan}</p>
                )}
              </div>
            )}

            {/* Título - Modo Edición */}
            {isEditMode && (
              <div className="publication-modal__edit-section">
                <div className="publication-modal__edit-field">
                  <label>Nombre del negocio</label>
                  <input
                    type="text"
                    value={editData.nombre}
                    onChange={(e) =>
                      setEditData({ ...editData, nombre: e.target.value })
                    }
                    placeholder="Nombre del negocio"
                  />
                </div>
              </div>
            )}

            {/* ACORDEÓN DE INFORMACIÓN */}
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
                  {!isEditMode && (
                    <div className="publication-modal__description-content">
                      {getFormattedTextBlocks(descripcion).map(
                        (paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ),
                      )}
                    </div>
                  )}
                  {isEditMode && (
                    <div className="publication-modal__edit-field">
                      <textarea
                        value={editData.descripcion}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            descripcion: e.target.value,
                          })
                        }
                        placeholder="Descripción del negocio"
                        rows="6"
                      />
                    </div>
                  )}
                </AccordionSection>
              )}

              {/* Sección: Mensaje de Marketing 1 */}
              {(mensaje_marketing || isEditMode) && (
                <AccordionSection
                  title={titulo_marketing || "¡Información Destacada!"}
                  icon={faBullhorn}
                  isOpen={activeSection === ACCORDION_SECTIONS.MARKETING_1}
                  onToggle={() =>
                    toggleSection(ACCORDION_SECTIONS.MARKETING_1)
                  }>
                  {!isEditMode && (
                    <div className="publication-modal__marketing-content">
                      {getFormattedTextBlocks(mensaje_marketing).map(
                        (paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ),
                      )}
                    </div>
                  )}
                  {isEditMode && (
                    <div className="publication-modal__edit-section">
                      <div className="publication-modal__edit-field">
                        <label>Título Marketing 1</label>
                        <input
                          type="text"
                          value={editData.titulo_marketing}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              titulo_marketing: e.target.value,
                            })
                          }
                          maxLength={100}
                          placeholder="Título destacado"
                        />
                      </div>
                      <div className="publication-modal__edit-field">
                        <label>Mensaje Marketing 1</label>
                        <textarea
                          value={editData.mensaje_marketing}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              mensaje_marketing: e.target.value,
                            })
                          }
                          maxLength={1000}
                          placeholder="Mensaje destacado"
                          rows="4"
                        />
                      </div>
                    </div>
                  )}
                </AccordionSection>
              )}

              {/* Sección: Mensaje de Marketing 2 */}
              {(mensaje_marketing_2 || isEditMode) && (
                <AccordionSection
                  title={titulo_marketing_2 || "¡No te lo pierdas!"}
                  icon={faBullhorn}
                  isOpen={activeSection === ACCORDION_SECTIONS.MARKETING_2}
                  onToggle={() =>
                    toggleSection(ACCORDION_SECTIONS.MARKETING_2)
                  }>
                  {!isEditMode && (
                    <div className="publication-modal__marketing-content">
                      {getFormattedTextBlocks(mensaje_marketing_2).map(
                        (paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ),
                      )}
                    </div>
                  )}
                  {isEditMode && (
                    <div className="publication-modal__edit-section">
                      <div className="publication-modal__edit-field">
                        <label>Título Marketing 2</label>
                        <input
                          type="text"
                          value={editData.titulo_marketing_2}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              titulo_marketing_2: e.target.value,
                            })
                          }
                          maxLength={100}
                          placeholder="Segundo título destacado"
                        />
                      </div>
                      <div className="publication-modal__edit-field">
                        <label>Mensaje Marketing 2</label>
                        <textarea
                          value={editData.mensaje_marketing_2}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              mensaje_marketing_2: e.target.value,
                            })
                          }
                          maxLength={1000}
                          placeholder="Segundo mensaje destacado"
                          rows="4"
                        />
                      </div>
                    </div>
                  )}
                </AccordionSection>
              )}

              {/* Sección: Horario */}
              <AccordionSection
                title="Horario"
                icon={faClock}
                isOpen={activeSection === ACCORDION_SECTIONS.SCHEDULE}
                onToggle={() => toggleSection(ACCORDION_SECTIONS.SCHEDULE)}>
                {!isEditMode && (
                  <div className="publication-modal__edit-section">
                    <div className="publication-modal__schedule-simple">
                      {horarioDetalle && horarioDetalle.length > 0 ? (
                        horarioDetalle.map((dia, idx) => (
                          <div
                            key={idx}
                            className="publication-modal__schedule-row">
                            <span className="publication-modal__schedule-day">
                              {dia.label}
                            </span>
                            <span className="publication-modal__schedule-time">
                              {dia.horario}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="publication-modal__no-data">
                          Horarios no disponibles
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {isEditMode && (
                  <HorariosSection
                    formData={{
                      dias_atencion: editData.dias_atencion || [],
                      horarios_detalle: editData.horarios_detalle || {},
                      abierto_24h: editData.abierto_24h || false,
                    }}
                    errors={{}}
                    onDiaChange={(dia) => {
                      const dias = editData.dias_atencion || [];
                      const newDias = dias.includes(dia)
                        ? dias.filter((d) => d !== dia)
                        : [...dias, dia];
                      setEditData({ ...editData, dias_atencion: newDias });
                    }}
                    onSaveHorarios={(horarios_detalle, abierto_24h) =>
                      setEditData({
                        ...editData,
                        horarios_detalle,
                        abierto_24h,
                      })
                    }
                    onFieldFocus={() => {}}
                  />
                )}
              </AccordionSection>

              {/* Sección: Información */}
              <AccordionSection
                title="Información"
                icon={faInfoCircle}
                isOpen={activeSection === ACCORDION_SECTIONS.INFO}
                onToggle={() => toggleSection(ACCORDION_SECTIONS.INFO)}>
                {!isEditMode && (
                  <div className="publication-modal__info-combined">
                    {/* Dirección/Lugar */}
                    <div className="publication-modal__info-section">
                      <h4 className="publication-modal__info-subtitle">
                        <FontAwesomeIcon icon={faMapMarkerAlt} />{" "}
                        Dirección/Lugar
                      </h4>
                      <p className="publication-modal__location-address">
                        {direccion || "Sin dirección"}
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
                    </div>

                    {/* Horarios */}
                    <div className="publication-modal__info-section">
                      <div className="publication-modal__schedule-simple">
                        {horarioDetalle && horarioDetalle.length > 0 ? (
                          horarioDetalle.map((dia, idx) => (
                            <div
                              key={idx}
                              className="publication-modal__schedule-row">
                              <span className="publication-modal__schedule-day">
                                {dia.label}
                              </span>
                              <span className="publication-modal__schedule-time">
                                {dia.horario}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="publication-modal__no-data">
                            Horarios no disponibles
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Contacto */}
                    {(telefono ||
                      email ||
                      sitio_web ||
                      whatsapp ||
                      instagram ||
                      facebook ||
                      tiktok ||
                      redes_sociales?.twitter ||
                      redes_sociales?.youtube ||
                      redes_sociales?.linkedin) && (
                      <div className="publication-modal__info-section">
                        <h4 className="publication-modal__info-subtitle">
                          <FontAwesomeIcon icon={faAddressCard} /> Contacto
                        </h4>
                        <div className="publication-modal__contact-content">
                          {telefono && (
                            <a
                              href={`tel:${telefono}`}
                              className="publication-modal__contact-item">
                              <FontAwesomeIcon icon={faPhone} />
                              <span>{telefono}</span>
                            </a>
                          )}
                          {email && (
                            <a
                              href={`mailto:${email}`}
                              className="publication-modal__contact-item">
                              <FontAwesomeIcon icon={faEnvelope} />
                              <span>{email}</span>
                            </a>
                          )}
                          {sitio_web && (
                            <a
                              href={sitio_web}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="publication-modal__contact-item">
                              <FontAwesomeIcon icon={faGlobe} />
                              <span>Sitio web</span>
                            </a>
                          )}
                          {(whatsapp ||
                            instagram ||
                            facebook ||
                            tiktok ||
                            redes_sociales?.twitter ||
                            redes_sociales?.youtube ||
                            redes_sociales?.linkedin) && (
                            <div className="publication-modal__social">
                              {whatsapp && (
                                <button
                                  className="publication-modal__social-btn publication-modal__social-btn--whatsapp"
                                  onClick={handleWhatsApp}>
                                  <FontAwesomeIcon icon={faWhatsapp} />
                                  WhatsApp
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
                                  className="publication-modal__social-btn publication-modal__social-btn--instagram">
                                  <FontAwesomeIcon icon={faInstagram} />
                                  Instagram
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
                                  className="publication-modal__social-btn publication-modal__social-btn--facebook">
                                  <FontAwesomeIcon icon={faFacebook} />
                                  Facebook
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
                                  className="publication-modal__social-btn publication-modal__social-btn--tiktok">
                                  <FontAwesomeIcon icon={faTiktok} />
                                  TikTok
                                </a>
                              )}
                              {redes_sociales?.twitter && (
                                <a
                                  href={
                                    redes_sociales.twitter.startsWith("http")
                                      ? redes_sociales.twitter
                                      : `https://x.com/${redes_sociales.twitter.replace("@", "")}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="publication-modal__social-btn publication-modal__social-btn--twitter">
                                  <FontAwesomeIcon icon={faXTwitter} />X
                                </a>
                              )}
                              {redes_sociales?.youtube && (
                                <a
                                  href={
                                    redes_sociales.youtube.startsWith("http")
                                      ? redes_sociales.youtube
                                      : `https://youtube.com/@${redes_sociales.youtube}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="publication-modal__social-btn publication-modal__social-btn--youtube">
                                  <FontAwesomeIcon icon={faYoutube} />
                                  YouTube
                                </a>
                              )}
                              {redes_sociales?.linkedin && (
                                <a
                                  href={
                                    redes_sociales.linkedin.startsWith("http")
                                      ? redes_sociales.linkedin
                                      : `https://linkedin.com/company/${redes_sociales.linkedin}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="publication-modal__social-btn publication-modal__social-btn--linkedin">
                                  <FontAwesomeIcon icon={faLinkedin} />
                                  LinkedIn
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {isEditMode && (
                  <div className="publication-modal__edit-section">
                    <div className="publication-modal__edit-field">
                      <label>URL de Ubicación (Google Maps)</label>
                      <input
                        type="url"
                        value={editData.ubicacion_url}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            ubicacion_url: e.target.value,
                          })
                        }
                        placeholder="https://maps.google.com/maps?q=..."
                      />
                    </div>
                    <div className="publication-modal__edit-field">
                      <label>Teléfono</label>
                      <input
                        type="tel"
                        value={editData.telefono}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            telefono: e.target.value,
                          })
                        }
                        placeholder="Número de teléfono"
                      />
                    </div>
                    <div className="publication-modal__edit-field">
                      <label>Email</label>
                      <input
                        type="email"
                        value={editData.email}
                        onChange={(e) =>
                          setEditData({ ...editData, email: e.target.value })
                        }
                        placeholder="Correo electrónico"
                      />
                    </div>
                    <div className="publication-modal__edit-field">
                      <label>WhatsApp</label>
                      <input
                        type="tel"
                        value={editData.whatsapp}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            whatsapp: e.target.value,
                          })
                        }
                        placeholder="Número de WhatsApp"
                      />
                    </div>
                    <div className="publication-modal__edit-field">
                      <label>Sitio Web</label>
                      <input
                        type="url"
                        value={editData.sitio_web}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            sitio_web: e.target.value,
                          })
                        }
                        placeholder="https://ejemplo.com"
                      />
                    </div>
                    <div className="publication-modal__edit-field">
                      <label>Instagram</label>
                      <input
                        type="text"
                        value={editData.instagram}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            instagram: e.target.value,
                          })
                        }
                        placeholder="@usuario o URL"
                      />
                    </div>
                    <div className="publication-modal__edit-field">
                      <label>Facebook</label>
                      <input
                        type="text"
                        value={editData.facebook}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            facebook: e.target.value,
                          })
                        }
                        placeholder="URL de Facebook"
                      />
                    </div>
                    <div className="publication-modal__edit-field">
                      <label>TikTok</label>
                      <input
                        type="text"
                        value={editData.tiktok}
                        onChange={(e) =>
                          setEditData({ ...editData, tiktok: e.target.value })
                        }
                        placeholder="@usuario"
                      />
                    </div>
                    <div className="publication-modal__edit-field">
                      <label>YouTube</label>
                      <input
                        type="text"
                        value={editData.youtube}
                        onChange={(e) =>
                          setEditData({ ...editData, youtube: e.target.value })
                        }
                        placeholder="URL del canal"
                      />
                    </div>
                    <div className="publication-modal__edit-field">
                      <label>Twitter / X</label>
                      <input
                        type="text"
                        value={editData.twitter}
                        onChange={(e) =>
                          setEditData({ ...editData, twitter: e.target.value })
                        }
                        placeholder="@usuario o URL"
                      />
                    </div>
                    <div className="publication-modal__edit-field">
                      <label>LinkedIn</label>
                      <input
                        type="text"
                        value={editData.linkedin}
                        onChange={(e) =>
                          setEditData({ ...editData, linkedin: e.target.value })
                        }
                        placeholder="URL de perfil"
                      />
                    </div>
                  </div>
                )}
              </AccordionSection>
            </div>

            {/* Publicado por */}
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
              <button
                className={`publication-modal__cta-btn publication-modal__cta-btn--outline ${isLiked ? "publication-modal__cta-btn--liked" : ""}`}
                onClick={async () => {
                  if (!user) {
                    setShowAuthModal(true);
                    return;
                  }
                  if (isTogglingLike) return;
                  setIsTogglingLike(true);
                  try {
                    const result = await toggleBusinessLike(
                      user.id,
                      business.id,
                    );
                    setIsLiked(result.isLiked);
                    setLikeCount(result.count);
                  } catch (error) {
                    console.error("Error al recomendar:", error);
                    showToast("Error al procesar tu recomendación", "error");
                  } finally {
                    setIsTogglingLike(false);
                  }
                }}
                disabled={isTogglingLike}>
                <FontAwesomeIcon icon={faStar} />
                {likeCount > 0 ? `${likeCount} Recomendado` : "Recomendado"}
              </button>
              {sitio_web && (
                <button
                  className="publication-modal__cta-btn publication-modal__cta-btn--primary"
                  onClick={() => window.open(sitio_web, "_blank")}>
                  <FontAwesomeIcon icon={faExternalLinkAlt} />
                  Ver sitio web
                </button>
              )}
              <button
                className="publication-modal__cta-btn publication-modal__cta-btn--secondary"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: nombre,
                      text: `¡Mira este negocio! ${nombre}`,
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
                className={`publication-modal__cta-btn publication-modal__cta-btn--outline ${isSaved ? "publication-modal__cta-btn--saved" : ""}`}
                onClick={async () => {
                  if (!user) {
                    setShowAuthModal(true);
                    return;
                  }
                  if (isTogglingSave) return;
                  setIsTogglingSave(true);
                  try {
                    const result = await toggleBusinessFavorite(
                      user.id,
                      business.id,
                    );
                    setIsSaved(result.isFavorite);
                    showToast(
                      result.isFavorite
                        ? "Negocio guardado"
                        : "Negocio eliminado de guardados",
                      "success",
                    );
                  } catch (error) {
                    console.error("Error al guardar:", error);
                    showToast("Error al guardar", "error");
                  } finally {
                    setIsTogglingSave(false);
                  }
                }}
                disabled={isTogglingSave}>
                <FontAwesomeIcon icon={faBookmark} />
                {isSaved ? "Guardado" : "Guardar"}
              </button>
              {canEdit && !isEditMode && (
                <button
                  className="publication-modal__cta-btn publication-modal__cta-btn--edit"
                  onClick={() => setIsEditMode(true)}
                  title="Editar negocio">
                  <FontAwesomeIcon icon={faPencil} />
                  Editar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}
