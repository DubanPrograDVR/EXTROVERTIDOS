import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  wrapPersistedFields,
  normalizeLineEndings,
  buildSocialUrl,
  formatChileanPhone,
  normalizeSocialLinks,
} from "../../../lib/textWrap";
import { renderRichText } from "../../../lib/textRender";
import { useScrollOnFocus } from "../../../hooks/useScrollOnFocus";
import WrappingTextarea from "../../UI/WrappingTextarea";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { useRealtimeRefetch } from "../../../hooks/useRealtimeRefetch";
import {
  updateBusiness,
  getBusinessCategories,
  toggleBusinessFavorite,
  isBusinessFavorite,
  toggleBusinessLike,
  hasUserLikedBusiness,
  getBusinessLikesCount,
  uploadBusinessImage,
} from "../../../lib/database";
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
  faTrash,
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
import "../styles/BusinessModal.css";
import "../../Home/Negocio/styles/publicar-negocio.css";
import AuthModal from "../../Auth/AuthModal";
import HorariosSection from "../../Home/Negocio/components/HorariosSection";
import {
  PROVINCIAS,
  COMUNAS_POR_PROVINCIA,
} from "../../Home/Panorama/constants";

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

const isRealBusinessImage = (imageUrl) =>
  Boolean(imageUrl) && !String(imageUrl).includes(PLACEHOLDER_IMAGE);

const getRealBusinessImages = (images) =>
  Array.isArray(images) ? images.filter(isRealBusinessImage) : [];

const normalizeExternalUrl = (url) => {
  if (typeof url !== "string") return "";

  const trimmedUrl = url.trim();
  if (!trimmedUrl) return "";

  return /^[a-z][a-z\d+.-]*:\/\//i.test(trimmedUrl)
    ? trimmedUrl
    : `https://${trimmedUrl}`;
};

// Tipos de secciones del acordeón
const ACCORDION_SECTIONS = {
  DESCRIPTION: "description",
  MARKETING_1: "marketing_1",
  MARKETING_2: "marketing_2",
  IMAGES: "images",
  LOCATION: "location",
  SCHEDULE: "schedule",
  INFO: "info",
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
  disablePlaceholderImage = false,
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
  const scrollOnFocus = useScrollOnFocus({ block: "nearest" });
  const [isSaving, setIsSaving] = useState(false);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isTogglingSave, setIsTogglingSave] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isTogglingLike, setIsTogglingLike] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const fileInputRef = useRef(null);

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
  const canManageBusinessMedia =
    isEditMode && (isAdmin || business?.user_id === user?.id);
  const comunas = editData.provincia
    ? COMUNAS_POR_PROVINCIA[editData.provincia] || []
    : [];

  const newImagePreviews = useMemo(
    () =>
      newImageFiles.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [newImageFiles],
  );

  useEffect(() => {
    return () => {
      newImagePreviews.forEach(({ url }) => URL.revokeObjectURL(url));
    };
  }, [newImagePreviews]);

  // Cargar categorías para el selector de edición
  useEffect(() => {
    if (canEdit || isEditMode) {
      getBusinessCategories()
        .then((cats) => setCategoriesList(cats || []))
        .catch((err) => console.error("Error cargando categorías:", err));
    }
  }, [canEdit, isEditMode]);

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
    setNewImageFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // Inicializar datos de edición
    if (business) {
      setEditData({
        nombre: business.nombre || "",
        descripcion: business.descripcion || "",
        categoria: business.categoria || "",
        subcategoria: business.subcategoria || "",
        imagenes: business.imagenes || business.galeria || [],
        provincia: business.provincia || "",
        comuna: business.comuna || "",
        direccion: business.direccion || "",
        telefono: business.telefono || "",
        email: business.email || "",
        whatsapp: business.whatsapp || business.redes_sociales?.whatsapp || "",
        instagram:
          business.instagram || business.redes_sociales?.instagram || "",
        facebook: business.facebook || business.redes_sociales?.facebook || "",
        tiktok: business.tiktok || business.redes_sociales?.tiktok || "",
        youtube: business.youtube || business.redes_sociales?.youtube || "",
        twitter: business.twitter || business.redes_sociales?.twitter || "",
        linkedin: business.linkedin || business.redes_sociales?.linkedin || "",
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

  const validImagesLength = canManageBusinessMedia
    ? Math.max(editData.imagenes?.length || 0, 1)
    : Array.isArray(business?.imagenes) && business.imagenes.length > 0
      ? business.imagenes.length
      : Array.isArray(business?.galeria) && business.galeria.length > 0
        ? business.galeria.length
        : 1;

  useEffect(() => {
    setCurrentImageIndex((prev) => Math.min(prev, validImagesLength - 1));
  }, [validImagesLength]);

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
    twitter,
    youtube,
    linkedin,
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

  // URL directa a og.php: los bots reciben OG tags con la imagen real del
  // negocio y los usuarios son redirigidos a /superguia?highlight=<id>.
  const shareUrl = business?.id
    ? `${window.location.origin}/og.php?type=business&highlight=${encodeURIComponent(business.id)}`
    : window.location.href;
  const normalizedWebsiteUrl = normalizeExternalUrl(sitio_web);
  const socialLinks = {
    whatsapp: whatsapp || redes_sociales?.whatsapp || "",
    instagram: instagram || redes_sociales?.instagram || "",
    facebook: facebook || redes_sociales?.facebook || "",
    tiktok: tiktok || redes_sociales?.tiktok || "",
    twitter: twitter || redes_sociales?.twitter || "",
    youtube: youtube || redes_sociales?.youtube || "",
    linkedin: linkedin || redes_sociales?.linkedin || "",
  };
  const hasSocialLinks =
    normalizedWebsiteUrl ||
    socialLinks.whatsapp ||
    socialLinks.instagram ||
    socialLinks.facebook ||
    socialLinks.tiktok ||
    socialLinks.twitter ||
    socialLinks.youtube ||
    socialLinks.linkedin;
  const hasContactInfo = telefono || email || hasSocialLinks;

  // Obtener array de imágenes válidas
  const getValidImages = () => {
    if (canManageBusinessMedia) {
      const editableImages = getRealBusinessImages(editData.imagenes);
      if (editableImages.length > 0) {
        return editableImages;
      }
      return [];
    }
    const businessImages = getRealBusinessImages(imagenes);
    if (businessImages.length > 0) {
      return businessImages;
    }
    const galleryImages = getRealBusinessImages(galeria);
    if (galleryImages.length > 0) {
      return galleryImages;
    }
    if (isRealBusinessImage(imagen_portada_url)) {
      return [imagen_portada_url];
    }
    if (isRealBusinessImage(imagen_url)) {
      return [imagen_url];
    }
    if (isRealBusinessImage(logo_url)) {
      return [logo_url];
    }
    return disablePlaceholderImage ? [] : [PLACEHOLDER_IMAGE];
  };

  const validImages = getValidImages();
  const hasMultipleImages = validImages.length > 1;

  const getCurrentImageUrl = () => {
    if (imageError) {
      return canManageBusinessMedia || disablePlaceholderImage
        ? null
        : PLACEHOLDER_IMAGE;
    }
    return (
      validImages[currentImageIndex] ||
      (canManageBusinessMedia || disablePlaceholderImage
        ? null
        : PLACEHOLDER_IMAGE)
    );
  };
  const currentImageUrl = getCurrentImageUrl();

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

  const handleRemoveImage = (index) => {
    setEditData((prev) => ({
      ...prev,
      imagenes: (prev.imagenes || []).filter(
        (_, imageIndex) => imageIndex !== index,
      ),
    }));
  };

  const handleAddImages = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const maxImages = 5;
    const currentTotal =
      (editData.imagenes?.length || 0) + newImageFiles.length;
    const available = maxImages - currentTotal;

    if (available <= 0) {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setNewImageFiles((prev) => [...prev, ...files.slice(0, available)]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveNewImage = (index) => {
    setNewImageFiles((prev) =>
      prev.filter((_, imageIndex) => imageIndex !== index),
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
    if (socialLinks.whatsapp) {
      const cleanNumber = socialLinks.whatsapp.replace(/\D/g, "");
      window.open(`https://wa.me/${cleanNumber}`, "_blank");
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Guardar cambios de edición
  const handleSaveChanges = async () => {
    // Validar que haya al menos una imagen real antes de guardar
    const existingRealImages = getRealBusinessImages(editData.imagenes);
    if (existingRealImages.length === 0 && newImageFiles.length === 0) {
      showToast(
        "Debes agregar al menos una imagen real para guardar.",
        "error",
      );
      return;
    }

    setIsSaving(true);
    try {
      const { dias_atencion, horarios_detalle, abierto_24h, ...rest } =
        editData;
      const normalizedSocialLinks = normalizeSocialLinks(
        {
          whatsapp: rest.whatsapp,
          instagram: rest.instagram,
          facebook: rest.facebook,
          tiktok: rest.tiktok,
          twitter: rest.twitter,
          youtube: rest.youtube,
          linkedin: rest.linkedin,
        },
        { preserveEmpty: true },
      );
      const dataToSave = {
        ...rest,
        ...normalizedSocialLinks,
        redes_sociales: {
          ...(business.redes_sociales || {}),
          ...normalizedSocialLinks,
        },
        horarios: serializeHorarios(
          dias_atencion,
          horarios_detalle,
          abierto_24h,
        ),
      };

      if (canManageBusinessMedia && newImageFiles.length > 0) {
        const imageOwnerId = business.user_id || user?.id;

        if (!imageOwnerId) {
          throw new Error(
            "No se pudo determinar el propietario para subir las imágenes",
          );
        }

        const uploadedUrls = [];
        for (const file of newImageFiles) {
          const imageUrl = await uploadBusinessImage(file, imageOwnerId);
          uploadedUrls.push(imageUrl);
        }

        dataToSave.imagenes = [...(dataToSave.imagenes || []), ...uploadedUrls];
      }

      // Capa defensiva: re-aplicar word-wrap (76 chars) antes de persistir.
      const dataToPersist = wrapPersistedFields(dataToSave);

      await updateBusiness(business.id, dataToPersist, undefined, {
        adminOverride: canEdit,
      });
      showToast("Cambios guardados exitosamente", "success");
      setIsEditMode(false);
      setNewImageFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      // Aplicar los cambios en vivo sobre la vista previa del modal
      setLiveOverrides((prev) => ({
        ...(prev || {}),
        ...dataToSave,
        galeria: dataToSave.imagenes,
        imagenes: dataToSave.imagenes,
      }));
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
    setNewImageFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setEditData({
      nombre: business.nombre || "",
      descripcion: business.descripcion || "",
      categoria: business.categoria || "",
      subcategoria: business.subcategoria || "",
      imagenes: business.imagenes || business.galeria || [],
      provincia: business.provincia || "",
      comuna: business.comuna || "",
      direccion: business.direccion || "",
      telefono: business.telefono || "",
      email: business.email || "",
      whatsapp: business.whatsapp || business.redes_sociales?.whatsapp || "",
      instagram: business.instagram || business.redes_sociales?.instagram || "",
      facebook: business.facebook || business.redes_sociales?.facebook || "",
      tiktok: business.tiktok || business.redes_sociales?.tiktok || "",
      youtube: business.youtube || business.redes_sociales?.youtube || "",
      twitter: business.twitter || business.redes_sociales?.twitter || "",
      linkedin: business.linkedin || business.redes_sociales?.linkedin || "",
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
        className={`publication-modal publication-modal--business ${isEditMode ? "publication-modal--editing" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Detalle del negocio">
        {/* Header con logo y branding */}
        <div className="publication-modal__category-header">
          <div className="publication-modal__brand-group">
            <img
              src="/img/SG_Extro_v2.png"
              alt="Superguia extrovertidos"
              className="publication-modal__brand-logo"
            />
            <span className="publication-modal__brand-text">
              Superguia extrovertidos
            </span>
          </div>
          {!isEditMode && subcategoria && (
            <span className="publication-modal__subcategory-tag publication-modal__subcategory-tag--desktop">
              {subcategoria}
            </span>
          )}
          {isEditMode && (
            <div className="publication-modal__category-edit">
              <label className="publication-modal__category-field">
                <span className="publication-modal__category-field-label">
                  Categoría
                </span>
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
              </label>
              <label className="publication-modal__category-field">
                <span className="publication-modal__category-field-label">
                  Subcategoría
                </span>
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
              </label>
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
          className={`publication-modal__body ${isInfoExpanded ? "publication-modal__body--expanded" : ""}`}
          onFocus={scrollOnFocus}>
          {/* SECCIÓN IZQUIERDA: IMAGEN */}
          <div
            className={`publication-modal__left ${isInfoExpanded ? "publication-modal__left--hidden" : ""}`}>
            {!isEditMode && subcategoria && (
              <span className="publication-modal__subcategory-tag publication-modal__subcategory-tag--mobile">
                {subcategoria}
              </span>
            )}
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
              style={{
                backgroundImage: currentImageUrl
                  ? `url(${currentImageUrl})`
                  : "none",
              }}
            />
            {currentImageUrl ? (
              <img
                src={currentImageUrl}
                alt={nombre}
                className="publication-modal__main-image"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="publication-modal__image-empty">
                <FontAwesomeIcon icon={faImage} />
                <span>Agrega una imagen para completar tu publicación</span>
              </div>
            )}

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
                  bodyClassName="accordion-section__body--description"
                  onToggle={() =>
                    toggleSection(ACCORDION_SECTIONS.DESCRIPTION)
                  }>
                  {!isEditMode && (
                    <div className="publication-modal__description-content rich-text">
                      {renderRichText(descripcion, { keyPrefix: "biz-desc" })}
                    </div>
                  )}
                  {isEditMode && (
                    <div className="publication-modal__edit-field">
                      <WrappingTextarea
                        name="descripcion"
                        value={editData.descripcion}
                        onChange={(value) =>
                          setEditData((prev) => ({
                            ...prev,
                            descripcion: value,
                          }))
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
                    <div className="publication-modal__marketing-content rich-text">
                      {renderRichText(mensaje_marketing, {
                        keyPrefix: "biz-mkt1",
                      })}
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
                        <WrappingTextarea
                          name="mensaje_marketing"
                          value={editData.mensaje_marketing}
                          onChange={(value) =>
                            setEditData((prev) => ({
                              ...prev,
                              mensaje_marketing: value,
                            }))
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
                    <div className="publication-modal__marketing-content rich-text">
                      {renderRichText(mensaje_marketing_2, {
                        keyPrefix: "biz-mkt2",
                      })}
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
                        <WrappingTextarea
                          name="mensaje_marketing_2"
                          value={editData.mensaje_marketing_2}
                          onChange={(value) =>
                            setEditData((prev) => ({
                              ...prev,
                              mensaje_marketing_2: value,
                            }))
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

                    {/* Contacto */}
                    {hasContactInfo && (
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
                          {hasSocialLinks && (
                            <div className="publication-modal__social">
                              {normalizedWebsiteUrl && (
                                <a
                                  href={normalizedWebsiteUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="publication-modal__social-btn publication-modal__social-btn--website">
                                  <FontAwesomeIcon icon={faGlobe} />
                                  Sitio web
                                </a>
                              )}
                              {socialLinks.whatsapp && (
                                <button
                                  className="publication-modal__social-btn publication-modal__social-btn--whatsapp"
                                  onClick={handleWhatsApp}>
                                  <FontAwesomeIcon icon={faWhatsapp} />
                                  WhatsApp
                                </button>
                              )}
                              {socialLinks.instagram && (
                                <a
                                  href={buildSocialUrl(
                                    socialLinks.instagram,
                                    "https://instagram.com/",
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="publication-modal__social-btn publication-modal__social-btn--instagram">
                                  <FontAwesomeIcon icon={faInstagram} />
                                  Instagram
                                </a>
                              )}
                              {socialLinks.facebook && (
                                <a
                                  href={buildSocialUrl(
                                    socialLinks.facebook,
                                    "https://facebook.com/",
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="publication-modal__social-btn publication-modal__social-btn--facebook">
                                  <FontAwesomeIcon icon={faFacebook} />
                                  Facebook
                                </a>
                              )}
                              {socialLinks.tiktok && (
                                <a
                                  href={buildSocialUrl(
                                    socialLinks.tiktok,
                                    "https://tiktok.com/@",
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="publication-modal__social-btn publication-modal__social-btn--tiktok">
                                  <FontAwesomeIcon icon={faTiktok} />
                                  TikTok
                                </a>
                              )}
                              {socialLinks.twitter && (
                                <a
                                  href={buildSocialUrl(
                                    socialLinks.twitter,
                                    "https://x.com/",
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="publication-modal__social-btn publication-modal__social-btn--twitter">
                                  <FontAwesomeIcon icon={faXTwitter} />X
                                </a>
                              )}
                              {socialLinks.youtube && (
                                <a
                                  href={buildSocialUrl(
                                    socialLinks.youtube,
                                    "https://youtube.com/@",
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="publication-modal__social-btn publication-modal__social-btn--youtube">
                                  <FontAwesomeIcon icon={faYoutube} />
                                  YouTube
                                </a>
                              )}
                              {socialLinks.linkedin && (
                                <a
                                  href={buildSocialUrl(
                                    socialLinks.linkedin,
                                    "https://linkedin.com/company/",
                                  )}
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
                      <label>Provincia</label>
                      <select
                        className="publication-modal__edit-select"
                        value={editData.provincia || ""}
                        onChange={(e) => {
                          const provincia = e.target.value;
                          setEditData({
                            ...editData,
                            provincia,
                            comuna:
                              editData.provincia === provincia
                                ? editData.comuna
                                : "",
                          });
                        }}>
                        <option value="">Seleccionar provincia</option>
                        {PROVINCIAS.map((provinciaOption) => (
                          <option key={provinciaOption} value={provinciaOption}>
                            {provinciaOption}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="publication-modal__edit-field">
                      <label>Comuna</label>
                      <select
                        className="publication-modal__edit-select"
                        value={editData.comuna || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            comuna: e.target.value,
                          })
                        }
                        disabled={!editData.provincia}>
                        <option value="">
                          {editData.provincia
                            ? "Seleccionar comuna"
                            : "Primero selecciona provincia"}
                        </option>
                        {comunas.map((comuna) => (
                          <option key={comuna} value={comuna}>
                            {comuna}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="publication-modal__edit-field">
                      <label>Dirección</label>
                      <input
                        type="text"
                        value={editData.direccion || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            direccion: e.target.value,
                          })
                        }
                        placeholder="Dirección del negocio"
                      />
                    </div>
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
                        value={formatChileanPhone(editData.telefono || "")}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            telefono: formatChileanPhone(e.target.value),
                          })
                        }
                        placeholder="+56 9 1234 5678"
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
                        value={formatChileanPhone(editData.whatsapp || "")}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            whatsapp: formatChileanPhone(e.target.value),
                          })
                        }
                        placeholder="+56 9 1234 5678"
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

              {canManageBusinessMedia && (
                <AccordionSection
                  title="Imágenes"
                  icon={faImage}
                  isOpen={activeSection === ACCORDION_SECTIONS.IMAGES}
                  onToggle={() => toggleSection(ACCORDION_SECTIONS.IMAGES)}>
                  <div className="publication-modal__edit-section">
                    <p
                      style={{
                        color: "rgba(255,255,255,0.5)",
                        fontSize: "0.85rem",
                        margin: "0 0 12px",
                      }}>
                      <FontAwesomeIcon icon={faInfoCircle} /> Puedes eliminar
                      imágenes existentes y agregar hasta 5 en total.
                    </p>

                    {editData.imagenes?.length > 0 ? (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fill, minmax(100px, 1fr))",
                          gap: "10px",
                        }}>
                        {editData.imagenes.map((imageUrl, index) => (
                          <div
                            key={imageUrl}
                            style={{
                              position: "relative",
                              aspectRatio: "1",
                              borderRadius: "8px",
                              overflow: "hidden",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}>
                            <img
                              src={imageUrl}
                              alt={`Imagen ${index + 1}`}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              style={{
                                position: "absolute",
                                top: "4px",
                                right: "4px",
                                width: "24px",
                                height: "24px",
                                borderRadius: "50%",
                                background: "rgba(255,68,68,0.9)",
                                border: "none",
                                color: "#fff",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.65rem",
                              }}>
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                            {index === 0 && (
                              <span
                                style={{
                                  position: "absolute",
                                  bottom: "4px",
                                  left: "4px",
                                  padding: "2px 6px",
                                  background: "#ff6600",
                                  color: "#000",
                                  fontSize: "0.6rem",
                                  fontWeight: "700",
                                  borderRadius: "4px",
                                }}>
                                Principal
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "20px",
                          color: "rgba(255,255,255,0.4)",
                        }}>
                        <FontAwesomeIcon
                          icon={faImage}
                          style={{ fontSize: "2rem", marginBottom: "8px" }}
                        />
                        <p>No hay imágenes</p>
                      </div>
                    )}

                    {newImagePreviews.length > 0 && (
                      <>
                        <p
                          style={{
                            color: "#ff6600",
                            fontSize: "0.85rem",
                            margin: "12px 0 8px",
                            fontWeight: "600",
                          }}>
                          Nuevas imágenes a subir:
                        </p>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fill, minmax(100px, 1fr))",
                            gap: "10px",
                          }}>
                          {newImagePreviews.map(({ file, url }, index) => (
                            <div
                              key={`${file.name}-${index}`}
                              style={{
                                position: "relative",
                                aspectRatio: "1",
                                borderRadius: "8px",
                                overflow: "hidden",
                                border: "2px solid #ff6600",
                              }}>
                              <img
                                src={url}
                                alt={`Nueva imagen ${index + 1}`}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveNewImage(index)}
                                style={{
                                  position: "absolute",
                                  top: "4px",
                                  right: "4px",
                                  width: "24px",
                                  height: "24px",
                                  borderRadius: "50%",
                                  background: "rgba(255,68,68,0.9)",
                                  border: "none",
                                  color: "#fff",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "0.65rem",
                                }}>
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {(editData.imagenes?.length || 0) + newImageFiles.length <
                      5 && (
                      <>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          multiple
                          onChange={handleAddImages}
                          style={{ display: "none" }}
                        />
                        <button
                          type="button"
                          className="publication-modal__save-btn"
                          onClick={() => fileInputRef.current?.click()}
                          style={{ marginTop: "12px", width: "100%" }}>
                          <FontAwesomeIcon icon={faImage} /> Agregar imágenes
                        </button>
                      </>
                    )}
                  </div>
                </AccordionSection>
              )}
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
              <button
                className="publication-modal__cta-btn publication-modal__cta-btn--secondary"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: nombre,
                      text: `¡Mira este negocio! ${nombre}`,
                      url: shareUrl,
                    });
                  } else {
                    navigator.clipboard.writeText(shareUrl);
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
