import { useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faCalendarDays,
  faCalendarWeek,
  faClock,
  faTicket,
  faUser,
  faImage,
  faChevronDown,
  faChevronUp,
  faChevronLeft,
  faChevronRight,
  faAlignLeft,
  faAddressCard,
  faTag,
  faBullhorn,
  faGlobe,
  faPhone,
  faInfoCircle,
  faMapMarkerAlt,
  faRepeat,
  faShareAlt,
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
import "../styles/draft-preview.css";

// Tipos de secciones del acordeón (igual que PublicationModal)
const ACCORDION_SECTIONS = {
  DESCRIPTION: "description",
  MARKETING_1: "marketing_1",
  MARKETING_2: "marketing_2",
  INFORMATION: "information",
  CONTACT: "contact",
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

/**
 * Componente de vista previa del borrador
 * Muestra cómo se verá la publicación en tiempo real - Estilo PublicationModal
 */
const DraftPreview = ({
  isOpen,
  onClose,
  formData,
  previewImages,
  categories,
}) => {
  const [activeSection, setActiveSection] = useState(
    ACCORDION_SECTIONS.DESCRIPTION,
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Función para alternar secciones del acordeón
  const toggleSection = useCallback((section) => {
    setActiveSection((prev) => (prev === section ? null : section));
  }, []);

  if (!isOpen) return null;

  // Obtener categoría seleccionada
  const selectedCategory = categories?.find(
    (cat) => cat.id === parseInt(formData.category_id),
  );

  // Formatear fecha
  const formatearFecha = (fecha, formato = "largo") => {
    if (!fecha) return "Sin fecha";
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

  // Formatear hora
  const formatearHora = (hora) => {
    if (!hora) return null;
    return hora.substring(0, 5);
  };

  // Obtener display de fecha
  const getFechaDisplay = () => {
    if (!formData.fecha_evento) return "Fecha no especificada";

    if (formData.es_multidia && formData.fecha_fin) {
      const inicioCorto = formatearFecha(formData.fecha_evento, "corto");
      const finCorto = formatearFecha(formData.fecha_fin, "corto");
      const anio = new Date(formData.fecha_evento + "T00:00:00").getFullYear();
      return `${inicioCorto} al ${finCorto}, ${anio}`;
    }
    return formatearFecha(formData.fecha_evento);
  };

  // Obtener texto de entrada
  const getEntradaText = () => {
    const tipos = {
      sin_entrada: "Pronto más información",
      gratuito: "Entrada gratuita",
      pagado: formData.precio
        ? `$${formData.precio} CLP`
        : "Precio por definir",
      venta_externa: "Ver enlace de venta",
    };
    return tipos[formData.tipo_entrada] || "No especificado";
  };

  // Obtener imagen de preview
  const getPreviewImage = () => {
    if (previewImages && previewImages.length > 0) {
      return previewImages[currentImageIndex] || previewImages[0];
    }
    return null;
  };

  // Navegación de imágenes
  const handlePrevImage = () => {
    if (previewImages && previewImages.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? previewImages.length - 1 : prev - 1,
      );
    }
  };

  const handleNextImage = () => {
    if (previewImages && previewImages.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === previewImages.length - 1 ? 0 : prev + 1,
      );
    }
  };

  // Verificar si hay redes sociales o contacto
  const hasRedesSociales = () => {
    return (
      formData.redes_sociales?.instagram ||
      formData.redes_sociales?.facebook ||
      formData.redes_sociales?.whatsapp ||
      formData.redes_sociales?.tiktok ||
      formData.redes_sociales?.youtube ||
      formData.redes_sociales?.twitter ||
      formData.redes_sociales?.linkedin ||
      formData.telefono_contacto ||
      formData.sitio_web
    );
  };

  // Extraer coordenadas de URL de Google Maps
  const extractCoordinates = (url) => {
    if (!url) return null;
    const atPattern = /@(-?\d+\.?\d*),(-?\d+\.?\d*)/;
    const qPattern = /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
    const placePattern = /\/place\/(-?\d+\.?\d*),(-?\d+\.?\d*)/;
    let match =
      url.match(atPattern) || url.match(qPattern) || url.match(placePattern);
    if (match) {
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }
    return null;
  };

  const coordinates = extractCoordinates(formData.ubicacion_url);

  // Generar URL de direcciones
  const getDirectionsUrl = () => {
    if (coordinates) {
      return `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`;
    }
    const destination = encodeURIComponent(
      formData.direccion || `${formData.comuna}, ${formData.provincia}, Chile`,
    );
    return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
  };

  const hasMultipleImages = previewImages && previewImages.length > 1;

  // Calcular duración en días para multi-día
  const duracionDias = (() => {
    if (!formData.es_multidia || !formData.fecha_fin || !formData.fecha_evento)
      return null;
    const inicio = new Date(formData.fecha_evento + "T00:00:00");
    const fin = new Date(formData.fecha_fin + "T00:00:00");
    const diff = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 1 ? diff : null;
  })();

  // Texto de recurrencia
  const recurrenciaText = (() => {
    if (!formData.es_recurrente) return null;
    const tipos = {
      semanal: "Semanal",
      quincenal: "Quincenal",
      mensual: "Mensual",
    };
    return tipos[formData.tipo_recurrencia] || "Recurrente";
  })();

  return (
    <div
      className="publication-modal-overlay draft-preview-overlay"
      onClick={onClose}>
      <div
        className="publication-modal publication-modal--business-style publication-modal--draft"
        onClick={(e) => e.stopPropagation()}>
        {/* Header con logo y etiqueta (igual que PublicationModal) */}
        <div className="publication-modal__category-header">
          <div className="publication-modal__brand-group">
            <img
              src="/img/P_Extro.png"
              alt="Extrovertidos"
              className="publication-modal__brand-logo"
            />
            <span className="publication-modal__brand-text">panoramas</span>
          </div>
          {formData.etiqueta && (
            <span className="publication-modal__featured-tag">
              <FontAwesomeIcon icon={faTag} />
              {formData.etiqueta}
            </span>
          )}
          <span className="publication-modal__draft-badge">Vista Previa</span>
          <button className="publication-modal__close" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Cuerpo del modal */}
        <div className="publication-modal__body">
          {/* SECCIÓN IZQUIERDA: IMAGEN */}
          <div className="publication-modal__left">
            {previewImages && previewImages.length > 0 ? (
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

                {/* Badge de duración para eventos multi-día */}
                {formData.es_multidia && duracionDias && (
                  <span className="publication-modal__duration-badge">
                    🎉 {duracionDias} días
                  </span>
                )}

                {/* Badge de recurrencia */}
                {formData.es_recurrente && recurrenciaText && (
                  <span className="publication-modal__recurrence-badge">
                    <FontAwesomeIcon icon={faRepeat} />
                    {recurrenciaText}
                  </span>
                )}
              </>
            ) : (
              <div className="publication-modal__no-image">
                <FontAwesomeIcon icon={faImage} />
                <span>Sin imágenes</span>
                <p>Agrega imágenes a tu publicación</p>
              </div>
            )}
          </div>

          {/* SECCIÓN DERECHA: CONTENIDO */}
          <div className="publication-modal__right">
            {/* Título */}
            <div className="publication-modal__title-section">
              <h2>{formData.titulo || "Título del evento"}</h2>
            </div>

            {/* Organizador */}
            {formData.organizador && (
              <p className="publication-modal__organizer-line">
                <FontAwesomeIcon icon={faUser} />
                Organiza: {formData.organizador}
              </p>
            )}

            {/* ACORDEÓN DE INFORMACIÓN */}
            <div className="publication-modal__accordion-container">
              {/* Sección: Descripción */}
              <AccordionSection
                title="Descripción"
                icon={faAlignLeft}
                isOpen={activeSection === ACCORDION_SECTIONS.DESCRIPTION}
                onToggle={() => toggleSection(ACCORDION_SECTIONS.DESCRIPTION)}>
                <div className="publication-modal__description-content">
                  {formData.descripcion ? (
                    formData.descripcion
                      .split(/\n\s*\n/)
                      .map((paragraph, i) => (
                        <p key={i}>{paragraph.replace(/\n/g, " ")}</p>
                      ))
                  ) : (
                    <p>Sin descripción agregada aún...</p>
                  )}
                </div>
              </AccordionSection>

              {/* Sección: Mensaje de Marketing 1 */}
              {formData.mensaje_marketing && (
                <AccordionSection
                  title={formData.titulo_marketing || "¡Información Destacada!"}
                  icon={faBullhorn}
                  isOpen={activeSection === ACCORDION_SECTIONS.MARKETING_1}
                  onToggle={() =>
                    toggleSection(ACCORDION_SECTIONS.MARKETING_1)
                  }>
                  <div className="publication-modal__marketing-content">
                    {formData.mensaje_marketing
                      .split(/\n\s*\n/)
                      .map((paragraph, i) => (
                        <p key={i}>{paragraph.replace(/\n/g, " ")}</p>
                      ))}
                  </div>
                </AccordionSection>
              )}

              {/* Sección: Mensaje de Marketing 2 */}
              {formData.mensaje_marketing_2 && (
                <AccordionSection
                  title={formData.titulo_marketing_2 || "¡No te lo pierdas!"}
                  icon={faBullhorn}
                  isOpen={activeSection === ACCORDION_SECTIONS.MARKETING_2}
                  onToggle={() =>
                    toggleSection(ACCORDION_SECTIONS.MARKETING_2)
                  }>
                  <div className="publication-modal__marketing-content">
                    {formData.mensaje_marketing_2
                      .split(/\n\s*\n/)
                      .map((paragraph, i) => (
                        <p key={i}>{paragraph.replace(/\n/g, " ")}</p>
                      ))}
                  </div>
                </AccordionSection>
              )}

              {/* Sección: Información (Ubicación + Horarios anidados) */}
              <AccordionSection
                title="Información"
                icon={faInfoCircle}
                isOpen={activeSection === ACCORDION_SECTIONS.INFORMATION}
                onToggle={() => toggleSection(ACCORDION_SECTIONS.INFORMATION)}>
                <div className="publication-modal__info-nested">
                  {/* Sub-sección: Ubicación */}
                  <div className="publication-modal__info-section">
                    <h4 className="publication-modal__info-section-title">
                      <FontAwesomeIcon icon={faMapMarkerAlt} />
                      Ubicación
                    </h4>
                    <div className="publication-modal__location-content">
                      <p className="publication-modal__location-address">
                        {formData.direccion || "Sin ubicación"}
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
                  </div>

                  {/* Sub-sección: Horarios */}
                  <div className="publication-modal__info-section">
                    <h4 className="publication-modal__info-section-title">
                      <FontAwesomeIcon icon={faClock} />
                      Horarios
                    </h4>
                    <div className="publication-modal__schedule">
                      <div className="publication-modal__schedule-row">
                        <span className="publication-modal__schedule-label">
                          <FontAwesomeIcon
                            icon={
                              formData.es_multidia
                                ? faCalendarWeek
                                : faCalendarDays
                            }
                          />
                          Fecha
                        </span>
                        <span className="publication-modal__schedule-value">
                          {getFechaDisplay()}
                        </span>
                      </div>

                      {/* Fechas de recurrencia */}
                      {formData.es_recurrente &&
                        formData.fechas_recurrencia?.length > 0 && (
                          <div className="publication-modal__recurrence-dates">
                            <span className="publication-modal__recurrence-label">
                              <FontAwesomeIcon icon={faRepeat} />
                              {recurrenciaText}
                            </span>
                            <div className="publication-modal__recurrence-chips">
                              {formData.fechas_recurrencia.map(
                                (fecha, index) => (
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
                                ),
                              )}
                            </div>
                          </div>
                        )}

                      <div className="publication-modal__schedule-row">
                        <span className="publication-modal__schedule-label">
                          <FontAwesomeIcon icon={faClock} />
                          Horario
                        </span>
                        <span className="publication-modal__schedule-value">
                          {formData.hora_inicio &&
                            formatearHora(formData.hora_inicio)}
                          {formData.hora_inicio && formData.hora_fin && " - "}
                          {formData.hora_fin &&
                            formatearHora(formData.hora_fin)}
                          {!formData.hora_inicio &&
                            !formData.hora_fin &&
                            "Por confirmar"}
                        </span>
                      </div>

                      <div className="publication-modal__schedule-row">
                        <span className="publication-modal__schedule-label">
                          <FontAwesomeIcon icon={faTicket} />
                          Entrada
                        </span>
                        <span className="publication-modal__schedule-value publication-modal__schedule-value--price">
                          {getEntradaText()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sub-sección: Contacto */}
                  <div className="publication-modal__info-section">
                    <h4 className="publication-modal__info-section-title">
                      <FontAwesomeIcon icon={faAddressCard} />
                      Contacto
                    </h4>
                    <div className="publication-modal__contact-content">
                      {formData.telefono_contacto && (
                        <a
                          href={`tel:${formData.telefono_contacto}`}
                          className="publication-modal__contact-item">
                          <FontAwesomeIcon icon={faPhone} />
                          <span>{formData.telefono_contacto}</span>
                        </a>
                      )}
                      {!formData.telefono_contacto && (
                        <p className="publication-modal__no-data">
                          Sin información de contacto aún
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </AccordionSection>
            </div>

            {/* Redes sociales (sección separada, igual que PublicationModal) */}
            {(hasRedesSociales() || formData.sitio_web) && (
              <div className="publication-modal__social-section">
                <h4 className="publication-modal__social-title">
                  <FontAwesomeIcon icon={faShareAlt} />
                  Síguenos en redes
                </h4>
                <div className="publication-modal__social-bar">
                  {formData.sitio_web && (
                    <span className="publication-modal__social-icon publication-modal__social-icon--website">
                      <FontAwesomeIcon icon={faGlobe} />
                    </span>
                  )}
                  {formData.redes_sociales?.whatsapp && (
                    <span className="publication-modal__social-icon publication-modal__social-icon--whatsapp">
                      <FontAwesomeIcon icon={faWhatsapp} />
                    </span>
                  )}
                  {formData.redes_sociales?.instagram && (
                    <span className="publication-modal__social-icon publication-modal__social-icon--instagram">
                      <FontAwesomeIcon icon={faInstagram} />
                    </span>
                  )}
                  {formData.redes_sociales?.facebook && (
                    <span className="publication-modal__social-icon publication-modal__social-icon--facebook">
                      <FontAwesomeIcon icon={faFacebook} />
                    </span>
                  )}
                  {formData.redes_sociales?.youtube && (
                    <span className="publication-modal__social-icon publication-modal__social-icon--youtube">
                      <FontAwesomeIcon icon={faYoutube} />
                    </span>
                  )}
                  {formData.redes_sociales?.tiktok && (
                    <span className="publication-modal__social-icon publication-modal__social-icon--tiktok">
                      <FontAwesomeIcon icon={faTiktok} />
                    </span>
                  )}
                  {formData.redes_sociales?.twitter && (
                    <span className="publication-modal__social-icon publication-modal__social-icon--twitter">
                      <FontAwesomeIcon icon={faXTwitter} />
                    </span>
                  )}
                  {formData.redes_sociales?.linkedin && (
                    <span className="publication-modal__social-icon publication-modal__social-icon--linkedin">
                      <FontAwesomeIcon icon={faLinkedin} />
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Footer con nota */}
            <div className="publication-modal__draft-footer">
              <p>
                <strong>Nota:</strong> Esta es una vista previa. Los cambios que
                realices en el formulario se reflejarán aquí automáticamente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DraftPreview;
