import { useEffect, useState, useCallback } from "react";
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
  faAddressCard,
  faTrash,
  faPhone,
  faEnvelope,
  faGlobe,
  faStore,
  faClock,
  faCog,
} from "@fortawesome/free-solid-svg-icons";
import {
  faInstagram,
  faFacebook,
  faWhatsapp,
  faTiktok,
} from "@fortawesome/free-brands-svg-icons";

import { useBusinessEditForm } from "./useBusinessEditForm";
import { PROVINCIAS } from "./constants";
import HorariosModal from "../../../Home/Negocio/components/HorariosModal";
import {
  DIAS_SEMANA,
  DIAS_SEMANA_SHORT,
} from "../../../Home/Negocio/components/constants";

import "../../../Superguia/styles/PublicationModal.css";
import "../../../Home/Negocio/styles/publicar-negocio.css";
import "../../../Superguia/styles/BusinessModal.css";
import "../styles/user-edit-modal.css";

const SECTIONS = {
  DESCRIPTION: "description",
  MARKETING: "marketing",
  LOCATION: "location",
  CONTACT: "contact",
  IMAGES: "images",
  HORARIOS: "horarios",
};

const AccordionSection = ({ title, icon, isOpen, onToggle, children }) => (
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

export default function UserBusinessEditModal({
  isOpen,
  onClose,
  business,
  categories = [],
  onSave,
  loading = false,
}) {
  const {
    formData,
    errors,
    handleChange,
    handleRemoveImage,
    handleDiaChange,
    handleSaveHorarios,
    validateForm,
    prepareDataToSave,
  } = useBusinessEditForm(business, isOpen);

  const [activeSection, setActiveSection] = useState(SECTIONS.DESCRIPTION);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [horariosModalOpen, setHorariosModalOpen] = useState(false);

  const toggleSection = useCallback((section) => {
    setActiveSection((prev) => (prev === section ? null : section));
  }, []);

  useEffect(() => {
    if (isOpen) {
      setActiveSection(SECTIONS.DESCRIPTION);
      setCurrentImageIndex(0);
    }
  }, [isOpen, business?.id]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    const dataToSave = prepareDataToSave();
    await onSave(business.id, dataToSave);
  };

  if (!isOpen || !business) return null;

  const validImages =
    Array.isArray(formData.imagenes) && formData.imagenes.length > 0
      ? formData.imagenes
      : business.imagen_url
        ? [business.imagen_url]
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

  // Subcategorías de la categoría seleccionada
  const currentCategory = categories.find(
    (c) => String(c.id) === String(formData.category_id),
  );
  const subcategorias = currentCategory?.subcategorias || [];

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
        aria-label="Editar negocio"
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
              onChange={(e) => {
                handleChange(e);
                // Reset subcategoria when category changes
                handleChange({
                  target: { name: "subcategoria", value: "" },
                });
                // Update categoria name
                const cat = categories.find(
                  (c) => String(c.id) === e.target.value,
                );
                if (cat) {
                  handleChange({
                    target: { name: "categoria", value: cat.nombre },
                  });
                }
              }}>
              <option value="">Seleccionar categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icono} {cat.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Barra de acciones */}
        <div className="publication-modal__actions">
          <button
            type="submit"
            className="publication-modal__save-btn"
            disabled={loading}>
            <FontAwesomeIcon
              icon={loading ? faSpinner : faSave}
              spin={loading}
            />
            {loading ? "Guardando..." : "Guardar"}
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

        {/* Cuerpo del modal */}
        <div className="publication-modal__body">
          {/* Imagen izquierda */}
          <div className="publication-modal__left">
            <div
              className="publication-modal__image-bg"
              style={{
                backgroundImage: `url(${validImages[currentImageIndex]})`,
              }}
            />
            <img
              src={validImages[currentImageIndex]}
              alt={formData.nombre || "Imagen"}
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

          {/* Contenido derecho */}
          <div className="publication-modal__right">
            {/* Nombre editable */}
            <div className="publication-modal__title-section">
              <input
                type="text"
                className={`publication-modal__edit-input publication-modal__edit-input--title ${errors.nombre ? "error" : ""}`}
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Nombre del negocio"
              />
              {errors.nombre && (
                <span style={{ color: "#ff4444", fontSize: "0.8rem" }}>
                  {errors.nombre}
                </span>
              )}
            </div>

            {/* Subcategoría */}
            {subcategorias.length > 0 && (
              <div className="publication-modal__edit-section">
                <label className="publication-modal__edit-label">
                  Subcategoría
                </label>
                <select
                  className="publication-modal__edit-select"
                  name="subcategoria"
                  value={formData.subcategoria}
                  onChange={handleChange}>
                  <option value="">Seleccionar subcategoría</option>
                  {subcategorias.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Acordeón */}
            <div className="publication-modal__accordion-container">
              {/* Descripción */}
              <AccordionSection
                title="Descripción"
                icon={faAlignLeft}
                isOpen={activeSection === SECTIONS.DESCRIPTION}
                onToggle={() => toggleSection(SECTIONS.DESCRIPTION)}>
                <div className="publication-modal__edit-section">
                  <textarea
                    className="publication-modal__edit-textarea"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    placeholder="Descripción del negocio"
                    rows={5}
                  />
                </div>
              </AccordionSection>

              {/* Marketing */}
              <AccordionSection
                title={formData.titulo_marketing || "Mensaje Promocional"}
                icon={faBullhorn}
                isOpen={activeSection === SECTIONS.MARKETING}
                onToggle={() => toggleSection(SECTIONS.MARKETING)}>
                <div className="publication-modal__edit-section">
                  <label className="publication-modal__edit-label">
                    Título Marketing
                  </label>
                  <input
                    type="text"
                    className="publication-modal__edit-input"
                    name="titulo_marketing"
                    value={formData.titulo_marketing}
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
                    placeholder="Mensaje destacado para promocionar tu negocio..."
                    rows={3}
                  />
                </div>
              </AccordionSection>

              {/* Ubicación */}
              <AccordionSection
                title="Ubicación"
                icon={faMapMarkerAlt}
                isOpen={activeSection === SECTIONS.LOCATION}
                onToggle={() => toggleSection(SECTIONS.LOCATION)}>
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
                    placeholder="Dirección del negocio"
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

              {/* Contacto / Redes */}
              <AccordionSection
                title="Contacto"
                icon={faAddressCard}
                isOpen={activeSection === SECTIONS.CONTACT}
                onToggle={() => toggleSection(SECTIONS.CONTACT)}>
                <div className="publication-modal__edit-section">
                  <label className="publication-modal__edit-label">
                    <FontAwesomeIcon icon={faPhone} /> Teléfono
                  </label>
                  <input
                    type="tel"
                    className="publication-modal__edit-input"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="+56 9 1234 5678"
                  />
                  <label className="publication-modal__edit-label">
                    <FontAwesomeIcon icon={faEnvelope} /> Email
                  </label>
                  <input
                    type="email"
                    className="publication-modal__edit-input"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="contacto@negocio.cl"
                  />
                  <label className="publication-modal__edit-label">
                    <FontAwesomeIcon icon={faGlobe} /> Sitio web
                  </label>
                  <input
                    type="url"
                    className="publication-modal__edit-input"
                    name="sitio_web"
                    value={formData.sitio_web}
                    onChange={handleChange}
                    placeholder="https://www.tunegocio.cl"
                  />
                  <label className="publication-modal__edit-label">
                    <FontAwesomeIcon icon={faInstagram} /> Instagram
                  </label>
                  <input
                    type="text"
                    className="publication-modal__edit-input"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleChange}
                    placeholder="@usuario o URL"
                  />
                  <label className="publication-modal__edit-label">
                    <FontAwesomeIcon icon={faFacebook} /> Facebook
                  </label>
                  <input
                    type="text"
                    className="publication-modal__edit-input"
                    name="facebook"
                    value={formData.facebook}
                    onChange={handleChange}
                    placeholder="Nombre de página o URL"
                  />
                  <label className="publication-modal__edit-label">
                    <FontAwesomeIcon icon={faWhatsapp} /> WhatsApp
                  </label>
                  <input
                    type="text"
                    className="publication-modal__edit-input"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    placeholder="+56 9 1234 5678"
                  />
                  <label className="publication-modal__edit-label">
                    <FontAwesomeIcon icon={faTiktok} /> TikTok
                  </label>
                  <input
                    type="text"
                    className="publication-modal__edit-input"
                    name="tiktok"
                    value={formData.tiktok}
                    onChange={handleChange}
                    placeholder="@usuario"
                  />
                </div>
              </AccordionSection>

              {/* Horarios */}
              <AccordionSection
                title="Horarios de Atención"
                icon={faClock}
                isOpen={activeSection === SECTIONS.HORARIOS}
                onToggle={() => toggleSection(SECTIONS.HORARIOS)}>
                <div className="publication-modal__edit-section">
                  <label className="publication-modal__edit-label">
                    Días de atención
                  </label>
                  <div className="edit-horarios__dias-pills">
                    {DIAS_SEMANA.map((dia) => (
                      <button
                        key={dia}
                        type="button"
                        className={`edit-horarios__dia-pill ${
                          formData.dias_atencion.includes(dia) ? "active" : ""
                        }`}
                        onClick={() => handleDiaChange(dia)}>
                        {DIAS_SEMANA_SHORT[dia]}
                      </button>
                    ))}
                  </div>

                  {formData.dias_atencion.length > 0 && (
                    <button
                      type="button"
                      className="edit-horarios__configurar-btn"
                      onClick={() => setHorariosModalOpen(true)}>
                      <FontAwesomeIcon icon={faCog} />
                      Configurar Horarios
                    </button>
                  )}

                  {(Object.keys(formData.horarios_detalle).length > 0 ||
                    formData.abierto_24h) && (
                    <div className="edit-horarios__summary">
                      {formData.abierto_24h ? (
                        <div className="edit-horarios__24h-badge">
                          🕐 Abierto las 24 horas
                        </div>
                      ) : (
                        <div className="edit-horarios__summary-list">
                          {formData.dias_atencion
                            .sort(
                              (a, b) =>
                                DIAS_SEMANA.indexOf(a) - DIAS_SEMANA.indexOf(b),
                            )
                            .map((dia) => (
                              <div
                                key={dia}
                                className="edit-horarios__summary-row">
                                <span className="edit-horarios__summary-dia">
                                  {DIAS_SEMANA_SHORT[dia]}
                                </span>
                                <span className="edit-horarios__summary-horario">
                                  {formData.horarios_detalle[dia]?.map(
                                    (turno, i) => (
                                      <span key={i}>
                                        {turno.apertura} - {turno.cierre}
                                        {i <
                                          formData.horarios_detalle[dia]
                                            .length -
                                            1 && " | "}
                                      </span>
                                    ),
                                  ) || "Sin configurar"}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <HorariosModal
                  isOpen={horariosModalOpen}
                  onClose={() => setHorariosModalOpen(false)}
                  diasSeleccionados={formData.dias_atencion}
                  horarios={formData.horarios_detalle}
                  abierto24h={formData.abierto_24h}
                  onSave={handleSaveHorarios}
                />
              </AccordionSection>

              {/* Imágenes */}
              <AccordionSection
                title="Imágenes"
                icon={faImage}
                isOpen={activeSection === SECTIONS.IMAGES}
                onToggle={() => toggleSection(SECTIONS.IMAGES)}>
                <div className="publication-modal__edit-section">
                  <p
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      fontSize: "0.85rem",
                      margin: "0 0 12px",
                    }}>
                    <FontAwesomeIcon icon={faInfoCircle} /> Puedes eliminar
                    imágenes existentes.
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
                </div>
              </AccordionSection>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
