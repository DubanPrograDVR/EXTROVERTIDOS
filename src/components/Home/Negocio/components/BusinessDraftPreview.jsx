import { useState, useCallback } from "react";
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
  faAlignLeft,
  faAddressCard,
  faImage,
  faLayerGroup,
  faBullhorn,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import {
  faWhatsapp,
  faInstagram,
  faFacebook,
} from "@fortawesome/free-brands-svg-icons";
import "../../Panorama/styles/draft-preview.css";

// Secciones del modal (igual que BusinessModal)
const ACCORDION_SECTIONS = {
  DESCRIPTION: "description",
  MARKETING_1: "marketing_1",
  MARKETING_2: "marketing_2",
  INFORMATION: "information",
  CONTACT: "contact",
};

const AccordionSection = ({ title, icon, isOpen, onToggle, children }) => (
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

/**
 * Vista previa del borrador de negocio
 * Mismo estilo que BusinessModal pero con datos del formulario en tiempo real
 */
const BusinessDraftPreview = ({ isOpen, onClose, formData, previewImages }) => {
  const [activeSection, setActiveSection] = useState(
    ACCORDION_SECTIONS.DESCRIPTION,
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);

  const toggleSection = useCallback((section) => {
    setActiveSection((prev) => (prev === section ? null : section));
  }, []);

  if (!isOpen) return null;

  // Imagen actual
  const getPreviewImage = () => {
    if (previewImages?.length > 0) {
      return previewImages[currentImageIndex] || previewImages[0];
    }
    return null;
  };

  const hasMultipleImages = previewImages?.length > 1;

  const handlePrevImage = () => {
    if (hasMultipleImages) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? previewImages.length - 1 : prev - 1,
      );
    }
  };

  const handleNextImage = () => {
    if (hasMultipleImages) {
      setCurrentImageIndex((prev) =>
        prev === previewImages.length - 1 ? 0 : prev + 1,
      );
    }
  };

  // Horarios
  const getHorarioResumen = () => {
    if (formData.abierto_24h) {
      return { diasAbiertos: "Todos los días", horarioAtencion: "24 horas" };
    }

    const dias = formData.dias_atencion;
    if (!dias || dias.length === 0) return null;

    const diasAbrev = {
      Lunes: "Lun",
      Martes: "Mar",
      Miércoles: "Mié",
      Jueves: "Jue",
      Viernes: "Vie",
      Sábado: "Sáb",
      Domingo: "Dom",
    };

    let diasText;
    if (dias.length === 7) {
      diasText = "Todos los días";
    } else {
      diasText = dias.map((d) => diasAbrev[d] || d).join(", ");
    }

    // Obtener horario del primer día configurado
    let horarioText = "Consultar";
    const primerDia = dias[0];
    const detalle = formData.horarios_detalle?.[primerDia];
    if (detalle && detalle.length > 0) {
      const turno = detalle[0];
      if (turno.apertura && turno.cierre) {
        horarioText = `${turno.apertura} - ${turno.cierre}`;
      }
    }

    return { diasAbiertos: diasText, horarioAtencion: horarioText };
  };

  const horarioResumen = getHorarioResumen();

  // Contacto
  const hasContacto =
    formData.telefono ||
    formData.email ||
    formData.sitio_web ||
    formData.redes_sociales?.whatsapp ||
    formData.redes_sociales?.instagram ||
    formData.redes_sociales?.facebook;

  return (
    <div
      className="publication-modal-overlay draft-preview-overlay"
      onClick={onClose}>
      <div
        className="publication-modal publication-modal--business-style publication-modal--business-draft publication-modal--draft"
        onClick={(e) => e.stopPropagation()}>
        {/* Header con branding */}
        <div className="publication-modal__category-header">
          <div className="publication-modal__brand-group">
            <img
              src="/img/SG_Extro.png"
              alt="Superguia"
              className="publication-modal__brand-logo"
            />
            <span className="publication-modal__brand-text">Superguia</span>
          </div>
          <button className="publication-modal__close" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Cuerpo */}
        <div
          className={`publication-modal__body ${isInfoExpanded ? "publication-modal__body--expanded" : ""}`}>
          {/* IZQUIERDA: IMAGEN */}
          <div
            className={`publication-modal__left ${isInfoExpanded ? "publication-modal__left--hidden" : ""}`}>
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
            {previewImages?.length > 0 ? (
              <>
                <div
                  className="publication-modal__image-bg"
                  style={{ backgroundImage: `url(${getPreviewImage()})` }}
                />
                <img
                  src={getPreviewImage()}
                  alt="Preview"
                  className="publication-modal__main-image"
                />

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
                      {previewImages.map((_, index) => (
                        <span
                          key={index}
                          className={`publication-modal__indicator ${index === currentImageIndex ? "active" : ""}`}
                          onClick={() => setCurrentImageIndex(index)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="publication-modal__no-image">
                <FontAwesomeIcon icon={faImage} />
                <span>Sin imágenes</span>
                <p>Agrega imágenes a tu negocio</p>
              </div>
            )}
          </div>

          {/* DERECHA: CONTENIDO */}
          <div
            className={`publication-modal__right ${isInfoExpanded ? "publication-modal__right--expanded" : ""}`}>
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
            {/* Título */}
            <div className="publication-modal__title-section">
              <h2>{formData.nombre || "Nombre del negocio"}</h2>
            </div>

            {/* Acordeón */}
            <div className="publication-modal__accordion-container">
              {/* Descripción */}
              <AccordionSection
                title="Descripción"
                icon={faAlignLeft}
                isOpen={activeSection === ACCORDION_SECTIONS.DESCRIPTION}
                onToggle={() => toggleSection(ACCORDION_SECTIONS.DESCRIPTION)}>
                <div className="publication-modal__description-content">
                  {formData.descripcion ? (
                    <p>{formData.descripcion}</p>
                  ) : (
                    <p>Sin descripción agregada aún...</p>
                  )}
                  {formData.subcategoria && (
                    <p
                      style={{
                        marginTop: 10,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        color: "#ff6600",
                        fontSize: "0.9rem",
                      }}>
                      <FontAwesomeIcon icon={faLayerGroup} />
                      Subcategoría: <strong>{formData.subcategoria}</strong>
                    </p>
                  )}
                </div>
              </AccordionSection>

              {/* Mensaje de Marketing 1 */}
              {formData.mensaje_marketing && (
                <AccordionSection
                  title={formData.titulo_marketing || "¡Información Destacada!"}
                  icon={faBullhorn}
                  isOpen={activeSection === ACCORDION_SECTIONS.MARKETING_1}
                  onToggle={() =>
                    toggleSection(ACCORDION_SECTIONS.MARKETING_1)
                  }>
                  <div className="publication-modal__marketing-content">
                    <p>{formData.mensaje_marketing}</p>
                  </div>
                </AccordionSection>
              )}

              {/* Mensaje de Marketing 2 */}
              {formData.mensaje_marketing_2 && (
                <AccordionSection
                  title={formData.titulo_marketing_2 || "¡No te lo pierdas!"}
                  icon={faBullhorn}
                  isOpen={activeSection === ACCORDION_SECTIONS.MARKETING_2}
                  onToggle={() =>
                    toggleSection(ACCORDION_SECTIONS.MARKETING_2)
                  }>
                  <div className="publication-modal__marketing-content">
                    <p>{formData.mensaje_marketing_2}</p>
                  </div>
                </AccordionSection>
              )}

              {/* Sección: Información (Ubicación + Horarios + Contacto anidados, igual que BusinessModal) */}
              <AccordionSection
                title="Información"
                icon={faInfoCircle}
                isOpen={activeSection === ACCORDION_SECTIONS.INFORMATION}
                onToggle={() => toggleSection(ACCORDION_SECTIONS.INFORMATION)}>
                <div className="publication-modal__info-combined">
                  {/* Ubicación */}
                  <div className="publication-modal__info-section">
                    <h4 className="publication-modal__info-subtitle">
                      <FontAwesomeIcon icon={faMapMarkerAlt} /> Dirección
                    </h4>
                    <p className="publication-modal__location-address">
                      {formData.direccion || "Sin dirección"}
                    </p>
                    {formData.ubicacion_url && (
                      <button
                        className="publication-modal__directions-btn publication-modal__directions-btn--full"
                        onClick={() =>
                          window.open(
                            formData.ubicacion_url,
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
                    <h4 className="publication-modal__info-subtitle">
                      <FontAwesomeIcon icon={faClock} /> Horario de atención
                    </h4>
                    <div className="publication-modal__schedule-simple">
                      {horarioResumen ? (
                        <>
                          <div className="publication-modal__schedule-row">
                            <span className="publication-modal__schedule-day">
                              Días de atención
                            </span>
                            <span className="publication-modal__schedule-time">
                              {horarioResumen.diasAbiertos}
                            </span>
                          </div>
                          <div className="publication-modal__schedule-row">
                            <span className="publication-modal__schedule-day">
                              Horario
                            </span>
                            <span className="publication-modal__schedule-time">
                              {horarioResumen.horarioAtencion}
                            </span>
                          </div>
                        </>
                      ) : (
                        <p className="publication-modal__no-data">
                          Horarios no configurados
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Contacto */}
                  <div className="publication-modal__info-section">
                    <h4 className="publication-modal__info-subtitle">
                      <FontAwesomeIcon icon={faAddressCard} /> Contacto
                    </h4>
                    <div className="publication-modal__contact-content">
                      {formData.telefono && (
                        <span className="publication-modal__contact-item">
                          <FontAwesomeIcon icon={faPhone} />
                          <span>{formData.telefono}</span>
                        </span>
                      )}
                      {formData.email && (
                        <span className="publication-modal__contact-item">
                          <FontAwesomeIcon icon={faEnvelope} />
                          <span>{formData.email}</span>
                        </span>
                      )}
                      {formData.sitio_web && (
                        <span className="publication-modal__contact-item">
                          <FontAwesomeIcon icon={faGlobe} />
                          <span>Sitio Web</span>
                        </span>
                      )}

                      {/* Redes sociales */}
                      <div className="publication-modal__social">
                        {formData.redes_sociales?.whatsapp && (
                          <span className="publication-modal__social-btn publication-modal__social-btn--whatsapp">
                            <FontAwesomeIcon icon={faWhatsapp} />
                            WhatsApp
                          </span>
                        )}
                        {formData.redes_sociales?.instagram && (
                          <span className="publication-modal__social-btn publication-modal__social-btn--instagram">
                            <FontAwesomeIcon icon={faInstagram} />
                            Instagram
                          </span>
                        )}
                        {formData.redes_sociales?.facebook && (
                          <span className="publication-modal__social-btn publication-modal__social-btn--facebook">
                            <FontAwesomeIcon icon={faFacebook} />
                            Facebook
                          </span>
                        )}
                      </div>

                      {!hasContacto && (
                        <p className="publication-modal__no-data">
                          Sin información de contacto aún
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </AccordionSection>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDraftPreview;
