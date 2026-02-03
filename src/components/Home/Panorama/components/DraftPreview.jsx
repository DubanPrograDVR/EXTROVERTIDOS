import { useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faCalendarDays,
  faCalendarWeek,
  faClock,
  faTicket,
  faLocationDot,
  faUser,
  faBuilding,
  faImage,
  faChevronDown,
  faChevronUp,
  faChevronLeft,
  faChevronRight,
  faRoute,
  faMap,
  faAlignLeft,
  faAddressCard,
  faExternalLinkAlt,
  faShareAlt,
  faBookmark,
  faTag,
  faBullhorn,
} from "@fortawesome/free-solid-svg-icons";
import {
  faInstagram,
  faFacebook,
  faWhatsapp,
} from "@fortawesome/free-brands-svg-icons";
import "../styles/draft-preview.css";

// Fix para el icono de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Icono personalizado naranja para el marcador
const orangeIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Tipos de secciones del acordeón
const ACCORDION_SECTIONS = {
  DESCRIPTION: "description",
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
      sin_entrada: "Sin entrada requerida",
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

  // Verificar si hay redes sociales
  const hasRedesSociales = () => {
    return (
      formData.redes_sociales?.instagram ||
      formData.redes_sociales?.facebook ||
      formData.redes_sociales?.whatsapp ||
      formData.telefono
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

  return (
    <div
      className="publication-modal-overlay draft-preview-overlay"
      onClick={onClose}>
      <div
        className="publication-modal publication-modal--business-style publication-modal--draft"
        onClick={(e) => e.stopPropagation()}>
        {/* Categoría en la parte superior */}
        <div className="publication-modal__category-header">
          <img
            src="/img/Icono.png"
            alt="Panoramas"
            className="publication-modal__brand-logo"
          />
          {selectedCategory ? (
            <span
              className="publication-modal__category-badge"
              style={{ backgroundColor: selectedCategory.color || "#ff6600" }}>
              {selectedCategory.icono && <span>{selectedCategory.icono}</span>}
              {selectedCategory.nombre}
            </span>
          ) : (
            <span className="publication-modal__category-badge">
              Selecciona categoría
            </span>
          )}
          <span className="publication-modal__draft-badge">Vista Previa</span>
        </div>

        {/* Botón cerrar */}
        <button className="publication-modal__close" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>

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
            {/* Organizador */}
            {formData.organizador && (
              <div className="publication-modal__organizer">
                <FontAwesomeIcon icon={faBuilding} />
                <span>Organiza: {formData.organizador}</span>
              </div>
            )}

            {/* Subcategoría/Etiqueta */}
            {formData.etiqueta && (
              <div className="publication-modal__tag-badge">
                <FontAwesomeIcon icon={faTag} />
                {formData.etiqueta}
              </div>
            )}

            {/* Título */}
            <div className="publication-modal__title-section">
              <h2>{formData.titulo || "Título del evento"}</h2>
            </div>

            {/* Mensaje de Marketing - arriba de la descripción */}
            {(formData.mensaje_marketing || formData.mensaje_marketing_2) && (
              <div className="publication-modal__marketing-section">
                <div className="publication-modal__marketing-badge">
                  <FontAwesomeIcon icon={faBullhorn} />
                  Mensaje del organizador
                </div>
                {formData.mensaje_marketing && (
                  <p className="publication-modal__marketing-text">
                    {formData.mensaje_marketing}
                  </p>
                )}
                {formData.mensaje_marketing_2 && (
                  <p className="publication-modal__marketing-text publication-modal__marketing-text--secondary">
                    {formData.mensaje_marketing_2}
                  </p>
                )}
              </div>
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
                  <p>
                    {formData.descripcion || "Sin descripción agregada aún..."}
                  </p>
                </div>
              </AccordionSection>

              {/* Sección: Ubicación */}
              <AccordionSection
                title="Ubicación"
                icon={faLocationDot}
                isOpen={activeSection === ACCORDION_SECTIONS.LOCATION}
                onToggle={() => toggleSection(ACCORDION_SECTIONS.LOCATION)}>
                <div className="publication-modal__location-content">
                  <p className="publication-modal__location-address">
                    {formData.direccion || "Dirección"}
                    {formData.comuna && `, ${formData.comuna}`}
                    {formData.provincia && `, ${formData.provincia}`}
                  </p>
                  <button
                    className="publication-modal__directions-btn"
                    onClick={() => window.open(getDirectionsUrl(), "_blank")}>
                    <FontAwesomeIcon icon={faRoute} />
                    Cómo llegar
                  </button>
                </div>
              </AccordionSection>

              {/* Sección: Horarios */}
              <AccordionSection
                title="Horarios"
                icon={faClock}
                isOpen={activeSection === ACCORDION_SECTIONS.SCHEDULE}
                onToggle={() => toggleSection(ACCORDION_SECTIONS.SCHEDULE)}>
                <div className="publication-modal__schedule-simple">
                  <div className="publication-modal__schedule-item">
                    <span className="publication-modal__schedule-icon">
                      <FontAwesomeIcon
                        icon={
                          formData.es_multidia ? faCalendarWeek : faCalendarDays
                        }
                      />
                    </span>
                    <div className="publication-modal__schedule-info">
                      <span className="publication-modal__schedule-label">
                        Fecha
                      </span>
                      <span className="publication-modal__schedule-value">
                        {getFechaDisplay()}
                      </span>
                    </div>
                  </div>
                  {(formData.hora_inicio || formData.hora_fin) && (
                    <div className="publication-modal__schedule-item">
                      <span className="publication-modal__schedule-icon">
                        <FontAwesomeIcon icon={faClock} />
                      </span>
                      <div className="publication-modal__schedule-info">
                        <span className="publication-modal__schedule-label">
                          Horario
                        </span>
                        <span className="publication-modal__schedule-value">
                          {formData.hora_inicio &&
                            formatearHora(formData.hora_inicio)}
                          {formData.hora_inicio && formData.hora_fin && " - "}
                          {formData.hora_fin &&
                            formatearHora(formData.hora_fin)}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="publication-modal__schedule-item">
                    <span className="publication-modal__schedule-icon">
                      <FontAwesomeIcon icon={faTicket} />
                    </span>
                    <div className="publication-modal__schedule-info">
                      <span className="publication-modal__schedule-label">
                        Entrada
                      </span>
                      <span className="publication-modal__schedule-value">
                        {getEntradaText()}
                      </span>
                    </div>
                  </div>
                </div>
              </AccordionSection>

              {/* Sección: Contacto */}
              {hasRedesSociales() && (
                <AccordionSection
                  title="Contacto"
                  icon={faAddressCard}
                  isOpen={activeSection === ACCORDION_SECTIONS.CONTACT}
                  onToggle={() => toggleSection(ACCORDION_SECTIONS.CONTACT)}>
                  <div className="publication-modal__contact-content">
                    {formData.telefono && (
                      <a href="#" className="publication-modal__contact-item">
                        <FontAwesomeIcon icon={faWhatsapp} />
                        <span>{formData.telefono}</span>
                      </a>
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
                  </div>
                </AccordionSection>
              )}

              {/* Sección: Mapa */}
              <AccordionSection
                title="Mapa"
                icon={faMap}
                isOpen={activeSection === ACCORDION_SECTIONS.MAP}
                onToggle={() => toggleSection(ACCORDION_SECTIONS.MAP)}>
                {coordinates ? (
                  <div className="publication-modal__map-section">
                    <div className="publication-modal__map-container">
                      <MapContainer
                        center={[coordinates.lat, coordinates.lng]}
                        zoom={15}
                        scrollWheelZoom={false}
                        className="publication-modal__map"
                        key={`${coordinates.lat}-${coordinates.lng}`}>
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker
                          position={[coordinates.lat, coordinates.lng]}
                          icon={orangeIcon}>
                          <Popup>
                            <strong>{formData.titulo || "Evento"}</strong>
                            <br />
                            {formData.direccion ||
                              `${formData.comuna}, ${formData.provincia}`}
                          </Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                  </div>
                ) : (
                  <div className="publication-modal__map-empty">
                    <FontAwesomeIcon icon={faMap} />
                    <p>Agrega una URL de Google Maps para ver el mapa</p>
                  </div>
                )}
              </AccordionSection>
            </div>

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
