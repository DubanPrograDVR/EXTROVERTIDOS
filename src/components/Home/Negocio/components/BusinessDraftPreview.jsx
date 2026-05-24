import { useState, useCallback, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faMapMarkerAlt,
  faPhone,
  faEnvelope,
  faGlobe,
  faChevronLeft,
  faChevronRight,
  faChevronDown,
  faChevronUp,
  faAlignLeft,
  faAddressCard,
  faImage,
  faBullhorn,
  faInfoCircle,
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
import "../../../Superguia/styles/BusinessModal.css";
import "../../Panorama/styles/draft-preview.css";
import { renderRichText } from "../../../../lib/textRender";
import {
  buildSocialUrl,
  normalizeSocialProfileValue,
} from "../../../../lib/textWrap";

// Secciones del modal (igual que BusinessModal)
const ACCORDION_SECTIONS = {
  DESCRIPTION: "description",
  MARKETING_1: "marketing_1",
  MARKETING_2: "marketing_2",
  INFORMATION: "information",
  CONTACT: "contact",
};

const AccordionSection = ({
  title,
  icon,
  isOpen,
  onToggle,
  bodyClassName,
  children,
}) => (
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
      <div
        className={`accordion-section__body${bodyClassName ? ` ${bodyClassName}` : ""}`}>
        {children}
      </div>
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

  const hasText = (value) => Boolean(String(value ?? "").trim());
  const hasName = hasText(formData?.nombre);
  const hasDescription = hasText(formData?.descripcion);
  const hasMarketingOne = hasText(formData?.mensaje_marketing);
  const hasMarketingTwo = hasText(formData?.mensaje_marketing_2);
  const hasSubcategory = hasText(formData?.subcategoria);
  const hasLocationInfo =
    hasText(formData?.direccion) || hasText(formData?.ubicacion_url);
  const hasHorarioInfo =
    Boolean(formData?.abierto_24h) || formData?.dias_atencion?.length > 0;
  const socialLinks = formData?.redes_sociales || {};
  const normalizedWhatsapp = normalizeSocialProfileValue(
    socialLinks.whatsapp,
    "whatsapp",
  );
  const hasSocialLinks =
    hasText(formData?.sitio_web) ||
    Boolean(normalizedWhatsapp) ||
    Object.entries(socialLinks).some(
      ([network, value]) => network !== "whatsapp" && hasText(value),
    );
  const normalizedWebsiteUrl = hasText(formData?.sitio_web)
    ? formData.sitio_web.trim().startsWith("http")
      ? formData.sitio_web.trim()
      : `https://${formData.sitio_web.trim()}`
    : "";
  const hasContacto =
    hasText(formData?.telefono) || hasText(formData?.email) || hasSocialLinks;
  const hasInformation = hasLocationInfo || hasHorarioInfo || hasContacto;

  const handleWhatsApp = () => {
    if (!normalizedWhatsapp) return;
    const cleanNumber = normalizedWhatsapp.replace(/\D/g, "");
    if (!cleanNumber) return;
    window.open(
      `https://wa.me/${cleanNumber}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  useEffect(() => {
    if (!isOpen) return;

    const visibleSections = [
      hasDescription && ACCORDION_SECTIONS.DESCRIPTION,
      hasMarketingOne && ACCORDION_SECTIONS.MARKETING_1,
      hasMarketingTwo && ACCORDION_SECTIONS.MARKETING_2,
      hasInformation && ACCORDION_SECTIONS.INFORMATION,
    ].filter(Boolean);

    // Sync defensivo: si la sección activa ya no es visible, ajustar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveSection((prev) =>
      visibleSections.includes(prev) ? prev : visibleSections[0] || null,
    );
  }, [
    isOpen,
    hasDescription,
    hasMarketingOne,
    hasMarketingTwo,
    hasInformation,
  ]);

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

  const getHorarioDetalle = () => {
    if (formData.abierto_24h) {
      return [{ label: "TODOS", horario: "Abierto 24h" }];
    }

    const diasOrden = [
      { key: "Lunes", label: "LUN" },
      { key: "Martes", label: "MAR" },
      { key: "Miércoles", label: "MIE" },
      { key: "Jueves", label: "JUE" },
      { key: "Viernes", label: "VIE" },
      { key: "Sábado", label: "SÁB" },
      { key: "Domingo", label: "DOM" },
    ];

    const formatHora = (hora) => {
      if (!hora) return "";
      const [hours, minutes] = String(hora).split(":");
      return hours && minutes ? `${hours}:${minutes}` : String(hora);
    };

    const diasSeleccionados = Array.isArray(formData.dias_atencion)
      ? formData.dias_atencion
      : [];

    return diasOrden
      .filter(({ key }) => diasSeleccionados.includes(key))
      .map(({ key, label }) => {
        const turnos = Array.isArray(formData.horarios_detalle?.[key])
          ? formData.horarios_detalle[key]
          : [];
        const horario = turnos
          .filter((turno) => turno?.apertura && turno?.cierre)
          .map(
            (turno) =>
              `${formatHora(turno.apertura)} - ${formatHora(turno.cierre)}`,
          )
          .join(" | ");

        return {
          label,
          horario: horario || "Consultar",
        };
      });
  };

  const horarioDetalle = getHorarioDetalle();

  return (
    <div
      className="publication-modal-overlay draft-preview-overlay"
      onClick={onClose}>
      <div
        className="publication-modal publication-modal--business publication-modal--business-style publication-modal--business-draft publication-modal--draft"
        onClick={(e) => e.stopPropagation()}>
        {/* Header con branding */}
        <div className="publication-modal__category-header">
          <div className="publication-modal__brand-group">
            <img
              src="/img/SG_Extro_v2.png"
              alt="Superguia"
              className="publication-modal__brand-logo"
            />
            <span className="publication-modal__brand-text">
              Superguia Extrovertidos
            </span>
          </div>
          {hasSubcategory && (
            <span className="publication-modal__subcategory-tag publication-modal__subcategory-tag--desktop">
              {formData.subcategoria.trim()}
            </span>
          )}
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
            {hasSubcategory && (
              <span className="publication-modal__subcategory-tag publication-modal__subcategory-tag--mobile">
                {formData.subcategoria.trim()}
              </span>
            )}
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
            {hasName && (
              <div className="publication-modal__title-section">
                <h2>{formData.nombre.trim()}</h2>
              </div>
            )}

            {/* Acordeón */}
            <div className="publication-modal__accordion-container">
              {/* Descripción */}
              {hasDescription && (
                <AccordionSection
                  title="Descripción"
                  icon={faAlignLeft}
                  isOpen={activeSection === ACCORDION_SECTIONS.DESCRIPTION}
                  bodyClassName="accordion-section__body--description"
                  onToggle={() =>
                    toggleSection(ACCORDION_SECTIONS.DESCRIPTION)
                  }>
                  <div className="publication-modal__description-content rich-text">
                    {renderRichText(formData.descripcion.trim(), {
                      keyPrefix: "bdraft-desc",
                    })}
                  </div>
                </AccordionSection>
              )}

              {/* Mensaje de Marketing 1 */}
              {hasMarketingOne && (
                <AccordionSection
                  title={
                    hasText(formData.titulo_marketing)
                      ? formData.titulo_marketing.trim()
                      : "¡Información Destacada!"
                  }
                  icon={faBullhorn}
                  isOpen={activeSection === ACCORDION_SECTIONS.MARKETING_1}
                  onToggle={() =>
                    toggleSection(ACCORDION_SECTIONS.MARKETING_1)
                  }>
                  <div className="publication-modal__marketing-content rich-text">
                    {renderRichText(formData.mensaje_marketing.trim(), {
                      keyPrefix: "bdraft-mkt1",
                    })}
                  </div>
                </AccordionSection>
              )}

              {/* Mensaje de Marketing 2 */}
              {hasMarketingTwo && (
                <AccordionSection
                  title={
                    hasText(formData.titulo_marketing_2)
                      ? formData.titulo_marketing_2.trim()
                      : "¡No te lo pierdas!"
                  }
                  icon={faBullhorn}
                  isOpen={activeSection === ACCORDION_SECTIONS.MARKETING_2}
                  onToggle={() =>
                    toggleSection(ACCORDION_SECTIONS.MARKETING_2)
                  }>
                  <div className="publication-modal__marketing-content rich-text">
                    {renderRichText(formData.mensaje_marketing_2.trim(), {
                      keyPrefix: "bdraft-mkt2",
                    })}
                  </div>
                </AccordionSection>
              )}

              {/* Sección: Información (Ubicación + Horarios + Contacto anidados, igual que BusinessModal) */}
              {hasInformation && (
                <AccordionSection
                  title="Información"
                  icon={faInfoCircle}
                  isOpen={activeSection === ACCORDION_SECTIONS.INFORMATION}
                  onToggle={() =>
                    toggleSection(ACCORDION_SECTIONS.INFORMATION)
                  }>
                  <div className="publication-modal__info-combined">
                    {/* Ubicación */}
                    {hasLocationInfo && (
                      <div className="publication-modal__info-section">
                        <h4 className="publication-modal__info-subtitle">
                          <FontAwesomeIcon icon={faMapMarkerAlt} /> Dirección
                        </h4>
                        {hasText(formData.direccion) && (
                          <p className="publication-modal__location-address">
                            {formData.direccion.trim()}
                          </p>
                        )}
                        {hasText(formData.ubicacion_url) && (
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
                    )}

                    {/* Horarios */}
                    {hasHorarioInfo && horarioDetalle.length > 0 && (
                      <div className="publication-modal__info-section">
                        <div className="publication-modal__schedule-simple">
                          {horarioDetalle.map((dia) => (
                            <div
                              key={dia.label}
                              className="publication-modal__schedule-row">
                              <span className="publication-modal__schedule-day">
                                {dia.label}
                              </span>
                              <span className="publication-modal__schedule-time">
                                {dia.horario}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Contacto */}
                    {hasContacto && (
                      <div className="publication-modal__info-section">
                        <h4 className="publication-modal__info-subtitle">
                          <FontAwesomeIcon icon={faAddressCard} /> Contacto
                        </h4>
                        <div className="publication-modal__contact-content">
                          {hasText(formData.telefono) && (
                            <span className="publication-modal__contact-item">
                              <FontAwesomeIcon icon={faPhone} />
                              <span>{formData.telefono.trim()}</span>
                            </span>
                          )}
                          {hasText(formData.email) && (
                            <span className="publication-modal__contact-item">
                              <FontAwesomeIcon icon={faEnvelope} />
                              <span>{formData.email.trim()}</span>
                            </span>
                          )}

                          {/* Redes sociales */}
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
                              {normalizedWhatsapp && (
                                <button
                                  type="button"
                                  className="publication-modal__social-btn publication-modal__social-btn--whatsapp"
                                  onClick={handleWhatsApp}>
                                  <FontAwesomeIcon icon={faWhatsapp} />
                                  WhatsApp
                                </button>
                              )}
                              {hasText(socialLinks.instagram) && (
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
                              {hasText(socialLinks.facebook) && (
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
                              {hasText(socialLinks.tiktok) && (
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
                              {hasText(socialLinks.twitter) && (
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
                              {hasText(socialLinks.youtube) && (
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
                              {hasText(socialLinks.linkedin) && (
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
                </AccordionSection>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDraftPreview;
