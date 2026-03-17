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
} from "@fortawesome/free-solid-svg-icons";
import {
  faInstagram,
  faFacebook,
  faWhatsapp,
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
  LOCATION: "location",
  SCHEDULE: "schedule",
  CONTACT: "contact",
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
