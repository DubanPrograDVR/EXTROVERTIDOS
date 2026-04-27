import { useEffect, useState, useCallback, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faSave,
  faSpinner,
  faImage,
  faMapMarkerAlt,
  faInfoCircle,
  faChevronDown,
  faChevronUp,
  faChevronLeft,
  faChevronRight,
  faAlignLeft,
  faBullhorn,
  faClock,
  faAddressCard,
  faTrash,
  faPlus,
  faLink,
  faCalendarAlt,
  faTicketAlt,
  faUser,
  faGlobe,
  faTag,
  faPhone,
  faHashtag,
} from "@fortawesome/free-solid-svg-icons";
import {
  faInstagram,
  faFacebook,
  faWhatsapp,
  faTiktok,
  faYoutube,
  faXTwitter,
  faLinkedin,
} from "@fortawesome/free-brands-svg-icons";

// Hook
import { useEditForm } from "./useEditForm";
import { PROVINCIAS, TIPOS_ENTRADA } from "./constants";
import { uploadEventImage } from "../../../../lib/database/images";

// Estilos - Reutilizar los estilos de PublicationModal para diseño idéntico
import "../../../Superguia/styles/PublicationModal.css";
import "../../../Superguia/styles/BusinessModal.css";
import "../styles/user-edit-modal.css";

// Secciones del acordeón
const ACCORDION_SECTIONS = {
  DESCRIPTION: "description",
  MARKETING: "marketing",
  MARKETING_2: "marketing_2",
  LOCATION: "location",
  SCHEDULE: "schedule",
  TICKET: "ticket",
  CONTACT: "contact",
  HASHTAGS: "hashtags",
  IMAGES: "images",
};

/**
 * Componente AccordionSection reutilizable
 */
const AccordionSection = ({ title, icon, isOpen, onToggle, children }) => {
  return (
    <div
      className={`accordion-section ${isOpen ? "accordion-section--open" : ""}`}>
      <button
        type="button"
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
      <div
        className={`accordion-section__content ${isOpen ? "open" : ""}`}
        role="region"
        aria-hidden={!isOpen}>
        <div className="accordion-section__body">{children}</div>
      </div>
    </div>
  );
};

/**
 * Modal para que el usuario edite sus publicaciones
 * Diseño idéntico al PublicationModal del admin
 */
export default function UserEditModal({
  isOpen,
  onClose,
  event,
  categories = [],
  onSave,
  loading = false,
  userId,
}) {
  const {
    formData,
    errors,
    handleChange,
    handleRemoveImage,
    validateForm,
    prepareDataToSave,
  } = useEditForm(event, isOpen);

  const [activeSection, setActiveSection] = useState(
    ACCORDION_SECTIONS.DESCRIPTION,
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [hashtagInput, setHashtagInput] = useState("");
  const fileInputRef = useRef(null);

  const toggleSection = useCallback((section) => {
    setActiveSection((prev) => (prev === section ? null : section));
  }, []);

  // Resetear al abrir
  useEffect(() => {
    if (isOpen) {
      setActiveSection(ACCORDION_SECTIONS.DESCRIPTION);
      setCurrentImageIndex(0);
      setNewImageFiles([]);
    }
  }, [isOpen, event?.id]);

  // Cerrar con ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose, loading]);

  const handleAddImages = useCallback(
    (e) => {
      const files = Array.from(e.target.files);
      if (!files.length) return;
      const maxTotal = 5;
      const currentTotal =
        (formData.imagenes?.length || 0) + newImageFiles.length;
      const available = maxTotal - currentTotal;
      if (available <= 0) return;
      setNewImageFiles((prev) => [...prev, ...files.slice(0, available)]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [formData.imagenes, newImageFiles],
  );

  const handleRemoveNewImage = useCallback((index) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const dataToSave = prepareDataToSave();

    // Subir nuevas imágenes si hay
    if (newImageFiles.length > 0 && userId) {
      setUploading(true);
      try {
        const uploadedUrls = [];
        for (const file of newImageFiles) {
          const url = await uploadEventImage(file, userId);
          uploadedUrls.push(url);
        }
        dataToSave.imagenes = [...(dataToSave.imagenes || []), ...uploadedUrls];
      } catch (error) {
        console.error("Error al subir imágenes:", error);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    await onSave(event.id, dataToSave);
  };

  if (!isOpen || !event) return null;

  // Imágenes
  const validImages =
    Array.isArray(formData.imagenes) && formData.imagenes.length > 0
      ? formData.imagenes
      : ["/img/Home1.png"];
  const hasMultipleImages = validImages.length > 1;

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

  // Categoría actual
  const currentCategory = categories.find(
    (c) => String(c.id) === String(formData.category_id),
  );

  return (
    <div
      className="publication-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}>
      <form
        className="publication-modal publication-modal--business-style"
        role="dialog"
        aria-modal="true"
        aria-label="Editar publicación"
        onSubmit={handleSubmit}>
        {/* Header de categoría */}
        <div className="publication-modal__category-header">
          <img
            src="/img/P_Extro.png"
            alt="Extrovertidos"
            className="publication-modal__brand-logo"
          />
          <div className="publication-modal__category-edit">
            <select
              className="publication-modal__category-select"
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}>
              <option value="">Seleccionar categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icono} {cat.nombre}
                </option>
              ))}
            </select>
          </div>
          {errors.category_id && (
            <span style={{ color: "#ff4444", fontSize: "0.8rem" }}>
              {errors.category_id}
            </span>
          )}
        </div>

        {/* Barra de acciones: GUARDAR y CANCELAR */}
        <div className="publication-modal__actions">
          <button
            type="submit"
            className="publication-modal__save-btn"
            disabled={loading || uploading}>
            <FontAwesomeIcon
              icon={loading || uploading ? faSpinner : faSave}
              spin={loading || uploading}
            />
            {uploading
              ? "Subiendo imágenes..."
              : loading
                ? "Guardando..."
                : "Guardar"}
          </button>
          <button
            type="button"
            className="publication-modal__cancel-btn"
            onClick={onClose}
            disabled={loading}>
            Cancelar
          </button>
        </div>

        {/* Botón cerrar */}
        <button
          type="button"
          className="publication-modal__close"
          onClick={onClose}
          disabled={loading}>
          <FontAwesomeIcon icon={faTimes} />
        </button>

        {/* Cuerpo del modal (imagen + contenido) */}
        <div className="publication-modal__body">
          {/* ===== SECCIÓN IZQUIERDA: IMAGEN ===== */}
          <div className="publication-modal__left">
            <div
              className="publication-modal__image-bg"
              style={{
                backgroundImage: `url(${validImages[currentImageIndex]})`,
              }}
            />
            <img
              src={validImages[currentImageIndex]}
              alt={formData.titulo || "Imagen"}
              className="publication-modal__main-image"
              onError={(e) => {
                e.target.src = "/img/Home1.png";
              }}
            />
            {hasMultipleImages && (
              <>
                <button
                  type="button"
                  className="publication-modal__nav publication-modal__nav--prev"
                  onClick={handlePrevImage}>
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>
                <button
                  type="button"
                  className="publication-modal__nav publication-modal__nav--next"
                  onClick={handleNextImage}>
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
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
          </div>

          {/* ===== SECCIÓN DERECHA: CONTENIDO ===== */}
          <div className="publication-modal__right">
            {/* Título editable */}
            <div className="publication-modal__title-section">
              <input
                type="text"
                className={`publication-modal__edit-input publication-modal__edit-input--title ${errors.titulo ? "error" : ""}`}
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                placeholder="Título del evento"
              />
              {errors.titulo && (
                <span style={{ color: "#ff4444", fontSize: "0.8rem" }}>
                  {errors.titulo}
                </span>
              )}
            </div>

            {/* Organizador */}
            <div className="publication-modal__edit-section">
              <label className="publication-modal__edit-label">
                Organizador
              </label>
              <input
                type="text"
                className="publication-modal__edit-input"
                name="organizador"
                value={formData.organizador}
                onChange={handleChange}
                placeholder="Nombre del organizador"
              />
            </div>

            {/* Etiqueta destacada */}
            <div className="publication-modal__edit-section">
              <label className="publication-modal__edit-label">
                <FontAwesomeIcon icon={faTag} /> Etiqueta destacada
              </label>
              <input
                type="text"
                className="publication-modal__edit-input"
                name="etiqueta_directa"
                value={formData.etiqueta_directa}
                onChange={handleChange}
                placeholder="Ej: Imperdible, Gratis, Familiar..."
                maxLength={50}
              />
            </div>

            {/* ===== ACORDEÓN DE SECCIONES ===== */}
            <div className="publication-modal__accordion-container">
              {/* Sección: Descripción */}
              <AccordionSection
                title="Descripción"
                icon={faAlignLeft}
                isOpen={activeSection === ACCORDION_SECTIONS.DESCRIPTION}
                onToggle={() => toggleSection(ACCORDION_SECTIONS.DESCRIPTION)}>
                <div className="publication-modal__edit-section">
                  <textarea
                    className="publication-modal__edit-textarea"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    placeholder="Descripción del evento"
                    rows={5}
                  />
                </div>
              </AccordionSection>

              {/* Sección: Mensaje Marketing */}
              <AccordionSection
                title={formData.titulo_marketing || "Mensaje Promocional"}
                icon={faBullhorn}
                isOpen={activeSection === ACCORDION_SECTIONS.MARKETING}
                onToggle={() => toggleSection(ACCORDION_SECTIONS.MARKETING)}>
                <div className="publication-modal__edit-section">
                  <label className="publication-modal__edit-label">
                    Título Marketing
                  </label>
                  <input
                    type="text"
                    className="publication-modal__edit-input"
                    name="titulo_marketing"
                    value={formData.titulo_marketing || ""}
                    onChange={handleChange}
                    placeholder="Título del mensaje promocional"
                  />
                  <label className="publication-modal__edit-label">
                    Mensaje Marketing
                  </label>
                  <textarea
                    className="publication-modal__edit-textarea"
                    name="mensaje_marketing"
                    value={formData.mensaje_marketing}
                    onChange={handleChange}
                    placeholder="Mensaje destacado para promocionar tu evento..."
                    rows={3}
                  />
                </div>
              </AccordionSection>

              {/* Sección: Mensaje Marketing 2 */}
              <AccordionSection
                title={formData.titulo_marketing_2 || "Segundo Mensaje"}
                icon={faBullhorn}
                isOpen={activeSection === ACCORDION_SECTIONS.MARKETING_2}
                onToggle={() => toggleSection(ACCORDION_SECTIONS.MARKETING_2)}>
                <div className="publication-modal__edit-section">
                  <label className="publication-modal__edit-label">
                    Título Marketing 2
                  </label>
                  <input
                    type="text"
                    className="publication-modal__edit-input"
                    name="titulo_marketing_2"
                    value={formData.titulo_marketing_2 || ""}
                    onChange={handleChange}
                    placeholder="Título del segundo mensaje"
                  />
                  <label className="publication-modal__edit-label">
                    Mensaje Marketing 2
                  </label>
                  <textarea
                    className="publication-modal__edit-textarea"
                    name="mensaje_marketing_2"
                    value={formData.mensaje_marketing_2 || ""}
                    onChange={handleChange}
                    placeholder="Segundo mensaje promocional..."
                    rows={3}
                  />
                </div>
              </AccordionSection>

              {/* Sección: Tipo de Entrada */}
              <AccordionSection
                title="Tipo de Entrada"
                icon={faTicketAlt}
                isOpen={activeSection === ACCORDION_SECTIONS.TICKET}
                onToggle={() => toggleSection(ACCORDION_SECTIONS.TICKET)}>
                <div className="publication-modal__edit-section">
                  <label className="publication-modal__edit-label">
                    Tipo de entrada
                  </label>
                  <select
                    className="publication-modal__edit-select"
                    name="tipo_entrada"
                    value={formData.tipo_entrada}
                    onChange={handleChange}>
                    {TIPOS_ENTRADA.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  {formData.tipo_entrada === "pagado" && (
                    <>
                      <label className="publication-modal__edit-label">
                        Precio (CLP)
                      </label>
                      <input
                        type="number"
                        className="publication-modal__edit-input"
                        name="precio"
                        value={formData.precio}
                        onChange={handleChange}
                        placeholder="Ej: 5000"
                        min="0"
                      />
                    </>
                  )}
                  {formData.tipo_entrada === "venta_externa" && (
                    <>
                      <label className="publication-modal__edit-label">
                        URL de venta
                      </label>
                      <input
                        type="url"
                        className="publication-modal__edit-input"
                        name="url_venta"
                        value={formData.url_venta}
                        onChange={handleChange}
                        placeholder="https://..."
                      />
                    </>
                  )}
                </div>
              </AccordionSection>

              {/* Sección: Horario */}
              <AccordionSection
                title="Horario"
                icon={faClock}
                isOpen={activeSection === ACCORDION_SECTIONS.SCHEDULE}
                onToggle={() => toggleSection(ACCORDION_SECTIONS.SCHEDULE)}>
                <div className="publication-modal__edit-section">
                  <label className="publication-modal__edit-label">
                    Hora de inicio
                  </label>
                  <div className="publication-modal__edit-time-wrap">
                    <input
                      type="time"
                      className="publication-modal__edit-input"
                      name="hora_inicio"
                      value={formData.hora_inicio}
                      onChange={handleChange}
                    />
                    {formData.hora_inicio && (
                      <button
                        type="button"
                        className="publication-modal__edit-time-clear"
                        onClick={() =>
                          handleChange({
                            target: { name: "hora_inicio", value: "" },
                          })
                        }
                        aria-label="Limpiar hora inicio">
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    )}
                  </div>
                  <label className="publication-modal__edit-label">
                    Hora de término
                  </label>
                  <div className="publication-modal__edit-time-wrap">
                    <input
                      type="time"
                      className="publication-modal__edit-input"
                      name="hora_fin"
                      value={formData.hora_fin}
                      onChange={handleChange}
                    />
                    {formData.hora_fin && (
                      <button
                        type="button"
                        className="publication-modal__edit-time-clear"
                        onClick={() =>
                          handleChange({
                            target: { name: "hora_fin", value: "" },
                          })
                        }
                        aria-label="Limpiar hora fin">
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    )}
                  </div>
                </div>
              </AccordionSection>

              {/* Sección: Ubicación */}
              <AccordionSection
                title="Ubicación"
                icon={faMapMarkerAlt}
                isOpen={activeSection === ACCORDION_SECTIONS.LOCATION}
                onToggle={() => toggleSection(ACCORDION_SECTIONS.LOCATION)}>
                <div className="publication-modal__edit-section">
                  <label className="publication-modal__edit-label">
                    Provincia *
                  </label>
                  <select
                    className="publication-modal__edit-select"
                    name="provincia"
                    value={formData.provincia}
                    onChange={handleChange}>
                    <option value="">Seleccionar provincia</option>
                    {PROVINCIAS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  {errors.provincia && (
                    <span style={{ color: "#ff4444", fontSize: "0.8rem" }}>
                      {errors.provincia}
                    </span>
                  )}
                  <label className="publication-modal__edit-label">
                    Comuna *
                  </label>
                  <input
                    type="text"
                    className="publication-modal__edit-input"
                    name="comuna"
                    value={formData.comuna}
                    onChange={handleChange}
                    placeholder="Comuna"
                  />
                  {errors.comuna && (
                    <span style={{ color: "#ff4444", fontSize: "0.8rem" }}>
                      {errors.comuna}
                    </span>
                  )}
                  <label className="publication-modal__edit-label">
                    Dirección
                  </label>
                  <input
                    type="text"
                    className="publication-modal__edit-input"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    placeholder="Dirección del evento"
                  />
                  <label className="publication-modal__edit-label">
                    URL de ubicación
                  </label>
                  <input
                    type="url"
                    className="publication-modal__edit-input"
                    name="ubicacion_url"
                    value={formData.ubicacion_url}
                    onChange={handleChange}
                    placeholder="https://maps.google.com/..."
                  />
                </div>
              </AccordionSection>

              {/* Sección: Contacto / Redes Sociales */}
              <AccordionSection
                title="Contacto"
                icon={faAddressCard}
                isOpen={activeSection === ACCORDION_SECTIONS.CONTACT}
                onToggle={() => toggleSection(ACCORDION_SECTIONS.CONTACT)}>
                <div className="publication-modal__edit-section">
                  <label className="publication-modal__edit-label">
                    <FontAwesomeIcon icon={faPhone} /> Teléfono de contacto
                  </label>
                  <input
                    type="tel"
                    className="publication-modal__edit-input"
                    name="telefono_contacto"
                    value={formData.telefono_contacto}
                    onChange={handleChange}
                    placeholder="+56 9 1234 5678"
                  />
                  <label className="publication-modal__edit-label">
                    <FontAwesomeIcon icon={faInstagram} /> Instagram
                  </label>
                  <input
                    type="text"
                    className="publication-modal__edit-input"
                    name="redes_sociales.instagram"
                    value={formData.redes_sociales.instagram}
                    onChange={handleChange}
                    placeholder="@usuario o URL"
                  />
                  <label className="publication-modal__edit-label">
                    <FontAwesomeIcon icon={faFacebook} /> Facebook
                  </label>
                  <input
                    type="text"
                    className="publication-modal__edit-input"
                    name="redes_sociales.facebook"
                    value={formData.redes_sociales.facebook}
                    onChange={handleChange}
                    placeholder="Nombre de página o URL"
                  />
                  <label className="publication-modal__edit-label">
                    <FontAwesomeIcon icon={faWhatsapp} /> WhatsApp
                  </label>
                  <input
                    type="text"
                    className="publication-modal__edit-input"
                    name="redes_sociales.whatsapp"
                    value={formData.redes_sociales.whatsapp}
                    onChange={handleChange}
                    placeholder="+56 9 1234 5678"
                  />
                  <label className="publication-modal__edit-label">
                    <FontAwesomeIcon icon={faTiktok} /> TikTok
                  </label>
                  <input
                    type="text"
                    className="publication-modal__edit-input"
                    name="redes_sociales.tiktok"
                    value={formData.redes_sociales.tiktok}
                    onChange={handleChange}
                    placeholder="@usuario o URL"
                  />
                  <label className="publication-modal__edit-label">
                    <FontAwesomeIcon icon={faYoutube} /> YouTube
                  </label>
                  <input
                    type="text"
                    className="publication-modal__edit-input"
                    name="redes_sociales.youtube"
                    value={formData.redes_sociales.youtube}
                    onChange={handleChange}
                    placeholder="URL del canal o video"
                  />
                  <label className="publication-modal__edit-label">
                    <FontAwesomeIcon icon={faXTwitter} /> X (Twitter)
                  </label>
                  <input
                    type="text"
                    className="publication-modal__edit-input"
                    name="redes_sociales.twitter"
                    value={formData.redes_sociales.twitter}
                    onChange={handleChange}
                    placeholder="@usuario o URL"
                  />
                  <label className="publication-modal__edit-label">
                    <FontAwesomeIcon icon={faLinkedin} /> LinkedIn
                  </label>
                  <input
                    type="text"
                    className="publication-modal__edit-input"
                    name="redes_sociales.linkedin"
                    value={formData.redes_sociales.linkedin}
                    onChange={handleChange}
                    placeholder="URL del perfil"
                  />
                  <label className="publication-modal__edit-label">
                    <FontAwesomeIcon icon={faGlobe} /> Sitio Web
                  </label>
                  <input
                    type="url"
                    className="publication-modal__edit-input"
                    name="sitio_web"
                    value={formData.sitio_web}
                    onChange={handleChange}
                    placeholder="https://www.ejemplo.com"
                  />
                </div>
              </AccordionSection>

              {/* Sección: Hashtags */}
              <AccordionSection
                title="Hashtags"
                icon={faHashtag}
                isOpen={activeSection === ACCORDION_SECTIONS.HASHTAGS}
                onToggle={() => toggleSection(ACCORDION_SECTIONS.HASHTAGS)}>
                <div className="publication-modal__edit-section">
                  {/* Chips de hashtags actuales */}
                  {(() => {
                    const currentTags = (formData.hashtags || "")
                      .split("#")
                      .map((t) => t.trim())
                      .filter((t) => t.length > 0)
                      .map((t) => `#${t}`);

                    const removeTag = (tagToRemove) => {
                      const updated = currentTags
                        .filter((t) => t !== tagToRemove)
                        .join(" ");
                      handleChange({
                        target: { name: "hashtags", value: updated },
                      });
                    };

                    const addTag = () => {
                      const raw = hashtagInput.trim().toUpperCase();
                      if (!raw) return;
                      const formatted = raw.startsWith("#") ? raw : `#${raw}`;
                      if (
                        currentTags.includes(formatted) ||
                        currentTags.length >= 10
                      )
                        return;
                      const updated = [...currentTags, formatted].join(" ");
                      handleChange({
                        target: { name: "hashtags", value: updated },
                      });
                      setHashtagInput("");
                    };

                    return (
                      <>
                        {currentTags.length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "8px",
                              marginBottom: "14px",
                            }}>
                            {currentTags.map((tag) => (
                              <span
                                key={tag}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  background: "rgba(255,102,0,0.15)",
                                  border: "1px solid rgba(255,102,0,0.4)",
                                  color: "#ff6600",
                                  borderRadius: "20px",
                                  padding: "4px 12px",
                                  fontSize: "0.82rem",
                                  fontWeight: 600,
                                }}>
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => removeTag(tag)}
                                  aria-label={`Eliminar ${tag}`}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#ff6600",
                                    padding: "0",
                                    lineHeight: 1,
                                    fontSize: "0.85rem",
                                    display: "flex",
                                    alignItems: "center",
                                  }}>
                                  <FontAwesomeIcon icon={faTimes} />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}

                        {currentTags.length < 10 && (
                          <div style={{ display: "flex", gap: "8px" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                flex: 1,
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.15)",
                                borderRadius: "8px",
                                padding: "0 10px",
                                gap: "4px",
                              }}>
                              <FontAwesomeIcon
                                icon={faHashtag}
                                style={{
                                  color: "#ff6600",
                                  fontSize: "0.85rem",
                                }}
                              />
                              <input
                                type="text"
                                className="publication-modal__edit-input"
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  padding: "8px 4px",
                                  flex: 1,
                                }}
                                value={hashtagInput}
                                onChange={(e) =>
                                  setHashtagInput(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    addTag();
                                  }
                                }}
                                placeholder="Nuevo hashtag..."
                                maxLength={30}
                              />
                            </div>
                            <button
                              type="button"
                              className="publication-modal__save-btn"
                              style={{ padding: "8px 16px", minWidth: "auto" }}
                              onClick={addTag}
                              disabled={!hashtagInput.trim()}>
                              <FontAwesomeIcon icon={faPlus} />
                              Agregar
                            </button>
                          </div>
                        )}

                        <p
                          style={{
                            color: "rgba(255,255,255,0.35)",
                            fontSize: "0.78rem",
                            margin: "8px 0 0",
                          }}>
                          {currentTags.length}/10 hashtags
                        </p>
                      </>
                    );
                  })()}
                </div>
              </AccordionSection>

              {/* Sección: Imágenes */}
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
                    <FontAwesomeIcon icon={faInfoCircle} /> Puedes eliminar o
                    agregar imágenes (máximo 5).
                  </p>
                  {formData.imagenes && formData.imagenes.length > 0 ? (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(100px, 1fr))",
                        gap: "10px",
                      }}>
                      {formData.imagenes.map((img, index) => (
                        <div
                          key={index}
                          style={{
                            position: "relative",
                            aspectRatio: "1",
                            borderRadius: "8px",
                            overflow: "hidden",
                            border: "1px solid rgba(255,255,255,0.1)",
                          }}>
                          <img
                            src={img}
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
                                textTransform: "uppercase",
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

                  {/* Nuevas imágenes seleccionadas */}
                  {newImageFiles.length > 0 && (
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
                        {newImageFiles.map((file, index) => (
                          <div
                            key={index}
                            style={{
                              position: "relative",
                              aspectRatio: "1",
                              borderRadius: "8px",
                              overflow: "hidden",
                              border: "2px solid #ff6600",
                            }}>
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Nueva ${index + 1}`}
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

                  {/* Botón para agregar imágenes */}
                  {(formData.imagenes?.length || 0) + newImageFiles.length <
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
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          marginTop: "12px",
                          width: "100%",
                          padding: "12px",
                          borderRadius: "8px",
                          border: "2px dashed rgba(255,102,0,0.5)",
                          background: "rgba(255,102,0,0.1)",
                          color: "#ff6600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          fontSize: "0.9rem",
                          fontWeight: "600",
                        }}>
                        <FontAwesomeIcon icon={faPlus} /> Agregar imágenes
                      </button>
                    </>
                  )}
                </div>
              </AccordionSection>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
