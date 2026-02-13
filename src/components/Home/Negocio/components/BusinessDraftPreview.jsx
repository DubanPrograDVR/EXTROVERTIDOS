import { useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
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
  faRoute,
  faMap,
  faAlignLeft,
  faAddressCard,
  faImage,
  faLayerGroup,
  faBullhorn,
} from "@fortawesome/free-solid-svg-icons";
import {
  faWhatsapp,
  faInstagram,
  faFacebook,
} from "@fortawesome/free-brands-svg-icons";
import "../../Panorama/styles/draft-preview.css";

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

// Icono personalizado naranja
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

// Secciones del modal
const ACCORDION_SECTIONS = {
  DESCRIPTION: "description",
  MARKETING_1: "marketing_1",
  MARKETING_2: "marketing_2",
  LOCATION: "location",
  SCHEDULE: "schedule",
  CONTACT: "contact",
  MAP: "map",
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
const BusinessDraftPreview = ({
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

  const toggleSection = useCallback((section) => {
    setActiveSection((prev) => (prev === section ? null : section));
  }, []);

  if (!isOpen) return null;

  // Categoría seleccionada
  const selectedCategory = categories?.find(
    (cat) => cat.id === parseInt(formData.category_id),
  );

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

  // Coordenadas del mapa
  const extractCoordinates = (url) => {
    if (!url) return null;
    const atPattern = /@(-?\d+\.?\d*),(-?\d+\.?\d*)/;
    const qPattern = /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
    const placePattern = /\/place\/(-?\d+\.?\d*),(-?\d+\.?\d*)/;
    const match =
      url.match(atPattern) || url.match(qPattern) || url.match(placePattern);
    if (match) {
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }
    return null;
  };

  const coordinates = extractCoordinates(formData.ubicacion_url);

  const getDirectionsUrl = () => {
    if (coordinates) {
      return `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`;
    }
    const destination = encodeURIComponent(
      formData.direccion || `${formData.comuna}, ${formData.provincia}, Chile`,
    );
    return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
  };

  return (
    <div
      className="publication-modal-overlay draft-preview-overlay"
      onClick={onClose}>
      <div
        className="publication-modal publication-modal--business-style publication-modal--draft"
        onClick={(e) => e.stopPropagation()}>
        {/* Header con categoría */}
        <div className="publication-modal__category-header">
          <img
            src="/img/SG_Extro.png"
            alt="Superguía"
            className="publication-modal__brand-logo"
          />
          {selectedCategory ? (
            <span
              className="publication-modal__category-badge"
              style={{ backgroundColor: selectedCategory.color || "#ff6600" }}>
              {selectedCategory.icono && (
                <FontAwesomeIcon
                  icon={selectedCategory.icono}
                  style={{ marginRight: 6 }}
                />
              )}
              {selectedCategory.nombre}
              {formData.subcategoria && (
                <span style={{ opacity: 0.85, marginLeft: 6 }}>
                  · {formData.subcategoria}
                </span>
              )}
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

        {/* Cuerpo */}
        <div className="publication-modal__body">
          {/* IZQUIERDA: IMAGEN */}
          <div className="publication-modal__left">
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
          <div className="publication-modal__right">
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
                  <p>
                    {formData.descripcion || "Sin descripción agregada aún..."}
                  </p>
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

              {/* Ubicación */}
              <AccordionSection
                title="Ubicación"
                icon={faMapMarkerAlt}
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

              {/* Horarios */}
              <AccordionSection
                title="Horarios"
                icon={faClock}
                isOpen={activeSection === ACCORDION_SECTIONS.SCHEDULE}
                onToggle={() => toggleSection(ACCORDION_SECTIONS.SCHEDULE)}>
                <div className="publication-modal__schedule-simple">
                  {horarioResumen ? (
                    <>
                      <div className="publication-modal__schedule-item">
                        <span className="publication-modal__schedule-icon">
                          📅
                        </span>
                        <div className="publication-modal__schedule-info">
                          <span className="publication-modal__schedule-label">
                            Días de atención
                          </span>
                          <span className="publication-modal__schedule-value">
                            {horarioResumen.diasAbiertos}
                          </span>
                        </div>
                      </div>
                      <div className="publication-modal__schedule-item">
                        <span className="publication-modal__schedule-icon">
                          🕐
                        </span>
                        <div className="publication-modal__schedule-info">
                          <span className="publication-modal__schedule-label">
                            Horario
                          </span>
                          <span className="publication-modal__schedule-value">
                            {horarioResumen.horarioAtencion}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="publication-modal__no-data">
                      Horarios no configurados
                    </p>
                  )}
                </div>
              </AccordionSection>

              {/* Contacto */}
              {hasContacto && (
                <AccordionSection
                  title="Contacto"
                  icon={faAddressCard}
                  isOpen={activeSection === ACCORDION_SECTIONS.CONTACT}
                  onToggle={() => toggleSection(ACCORDION_SECTIONS.CONTACT)}>
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
                  </div>
                </AccordionSection>
              )}

              {/* Mapa */}
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
                            <strong>{formData.nombre || "Negocio"}</strong>
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

            {/* Footer */}
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

export default BusinessDraftPreview;
