import { useState, useEffect, useCallback } from "react";
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
  faCheckCircle,
  faRoute,
  faMap,
  faAlignLeft,
  faAddressCard,
  faUser,
  faExternalLinkAlt,
  faShareAlt,
  faBookmark,
} from "@fortawesome/free-solid-svg-icons";
import {
  faWhatsapp,
  faInstagram,
  faFacebook,
  faTiktok,
} from "@fortawesome/free-brands-svg-icons";
import "./styles/BusinessModal.css";

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

const PLACEHOLDER_IMAGE = "/img/Home1.png";

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

export default function BusinessModal({ business, isOpen, onClose }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [activeSection, setActiveSection] = useState(
    ACCORDION_SECTIONS.DESCRIPTION,
  );

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
  }, [business?.id]);

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
    categories,
    telefono,
    email,
    whatsapp,
    instagram,
    facebook,
    tiktok,
    sitio_web,
    horarios,
    dias_atencion,
    horario_apertura,
    horario_cierre,
    verificado,
    profiles,
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

  // Obtener resumen de horarios usando los campos de la BD
  const getHorarioResumen = () => {
    // Usar los nuevos campos: dias_atencion, horario_apertura, horario_cierre
    const tieneDiasAtencion =
      Array.isArray(dias_atencion) && dias_atencion.length > 0;
    const tieneHorario = horario_apertura || horario_cierre;

    if (!tieneDiasAtencion && !tieneHorario) {
      // Fallback al campo horarios JSONB si existe
      if (
        horarios &&
        typeof horarios === "object" &&
        Object.keys(horarios).length > 0
      ) {
        return getHorarioFromJsonb();
      }
      return null;
    }

    // Formatear días de atención
    const formatearDias = (dias) => {
      if (!dias || dias.length === 0) return null;
      if (dias.length === 7) return "Todos los días";

      // Mapeo de días completos a abreviados
      const diasAbrev = {
        Lunes: "Lun",
        Martes: "Mar",
        Miércoles: "Mié",
        Miercoles: "Mié",
        Jueves: "Jue",
        Viernes: "Vie",
        Sábado: "Sáb",
        Sabado: "Sáb",
        Domingo: "Dom",
      };

      const diasNorm = dias.map((d) => diasAbrev[d] || d);

      // Detectar si es Lunes a Viernes
      const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie"];
      const tieneLunAVie = diasSemana.every((d) => diasNorm.includes(d));

      if (tieneLunAVie) {
        const tieneSab = diasNorm.includes("Sáb");
        const tieneDom = diasNorm.includes("Dom");
        if (!tieneSab && !tieneDom) return "Lunes a Viernes";
        if (tieneSab && !tieneDom) return "Lunes a Sábado";
        if (tieneSab && tieneDom) return "Todos los días";
        if (!tieneSab && tieneDom) return "Lunes a Viernes y Domingo";
      }

      return dias.join(", ");
    };

    // Formatear horario
    const formatearHorario = (apertura, cierre) => {
      if (!apertura && !cierre) return "Consultar";

      const formatHora = (hora) => {
        if (!hora) return "";
        // Remover segundos si existen (10:00:00 -> 10:00)
        const partes = hora.split(":");
        return `${partes[0]}:${partes[1]}`;
      };

      if (apertura && cierre) {
        return `${formatHora(apertura)} - ${formatHora(cierre)}`;
      }
      return apertura
        ? `Desde ${formatHora(apertura)}`
        : `Hasta ${formatHora(cierre)}`;
    };

    return {
      diasAbiertos: formatearDias(dias_atencion),
      horarioAtencion: formatearHorario(horario_apertura, horario_cierre),
      diasCerrados: null, // No tenemos esta info en el nuevo esquema
      totalAbiertos: dias_atencion?.length || 0,
    };
  };

  // Fallback para el campo horarios JSONB antiguo
  const getHorarioFromJsonb = () => {
    const diasOrden = [
      { key: "lunes", label: "Lun" },
      { key: "martes", label: "Mar" },
      { key: "miercoles", label: "Mié" },
      { key: "jueves", label: "Jue" },
      { key: "viernes", label: "Vie" },
      { key: "sabado", label: "Sáb" },
      { key: "domingo", label: "Dom" },
    ];

    const diasAbiertos = [];
    let horarioComun = null;

    diasOrden.forEach(({ key, label }) => {
      const horario = horarios[key];
      if (horario && !horario.cerrado) {
        diasAbiertos.push(label);
        if (!horarioComun && horario.apertura && horario.cierre) {
          horarioComun = `${horario.apertura} - ${horario.cierre}`;
        }
      }
    });

    return {
      diasAbiertos: diasAbiertos.length > 0 ? diasAbiertos.join(", ") : null,
      horarioAtencion: horarioComun || "Consultar",
      diasCerrados: null,
      totalAbiertos: diasAbiertos.length,
    };
  };

  const horarioResumen = getHorarioResumen();

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

  const coordinates = extractCoordinates(ubicacion_url);

  // Generar URL de direcciones
  const getDirectionsUrl = () => {
    if (coordinates) {
      return `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`;
    }
    const destination = encodeURIComponent(
      direccion || `${comuna}, ${provincia}, Chile`,
    );
    return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
  };

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

  return (
    <div className="publication-modal-overlay" onClick={handleOverlayClick}>
      <div className="publication-modal publication-modal--business">
        {/* Categoría en la parte superior con logo */}
        {categories?.nombre && (
          <div className="publication-modal__category-header">
            <img
              src="/img/SG_Extro.png"
              alt="Superguía"
              className="publication-modal__brand-logo"
            />
            <span
              className="publication-modal__category-badge"
              style={{ backgroundColor: categories.color || "#ff6600" }}>
              {categories.icono && <span>{categories.icono}</span>}
              {categories.nombre}
            </span>
            {verificado && (
              <span className="publication-modal__verified-badge">
                <FontAwesomeIcon icon={faCheckCircle} />
                Verificado
              </span>
            )}
          </div>
        )}

        {/* Botón cerrar */}
        <button className="publication-modal__close" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>

        {/* Cuerpo del modal */}
        <div className="publication-modal__body">
          {/* SECCIÓN IZQUIERDA: IMAGEN */}
          <div className="publication-modal__left">
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
          <div className="publication-modal__right">
            {/* Título */}
            <div className="publication-modal__title-section">
              <h2>{nombre}</h2>
              {slogan && <p className="publication-modal__slogan">{slogan}</p>}
            </div>

            {/* ACORDEÓN DE INFORMACIÓN */}
            <div className="publication-modal__accordion-container">
              {/* Sección: Descripción */}
              {descripcion && (
                <AccordionSection
                  title="Descripción"
                  icon={faAlignLeft}
                  isOpen={activeSection === ACCORDION_SECTIONS.DESCRIPTION}
                  onToggle={() =>
                    toggleSection(ACCORDION_SECTIONS.DESCRIPTION)
                  }>
                  <div className="publication-modal__description-content">
                    <p>{descripcion}</p>
                  </div>
                </AccordionSection>
              )}

              {/* Sección: Ubicación */}
              <AccordionSection
                title="Ubicación"
                icon={faMapMarkerAlt}
                isOpen={activeSection === ACCORDION_SECTIONS.LOCATION}
                onToggle={() => toggleSection(ACCORDION_SECTIONS.LOCATION)}>
                <div className="publication-modal__location-content">
                  <p className="publication-modal__location-address">
                    {direccion && `${direccion}, `}
                    {comuna}
                    {provincia && `, ${provincia}`}
                    {region && ` - ${region}`}
                  </p>
                  {(ubicacion_url || direccion) && (
                    <button
                      className="publication-modal__directions-btn"
                      onClick={() => window.open(getDirectionsUrl(), "_blank")}>
                      <FontAwesomeIcon icon={faRoute} />
                      Cómo llegar
                    </button>
                  )}
                </div>
              </AccordionSection>

              {/* Sección: Horarios */}
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
                            {horarioResumen.diasAbiertos || "No especificado"}
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
                      {horarioResumen.diasCerrados && (
                        <div className="publication-modal__schedule-item publication-modal__schedule-item--closed">
                          <span className="publication-modal__schedule-icon">
                            🚫
                          </span>
                          <div className="publication-modal__schedule-info">
                            <span className="publication-modal__schedule-label">
                              Cerrado
                            </span>
                            <span className="publication-modal__schedule-value">
                              {horarioResumen.diasCerrados}
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="publication-modal__no-data">
                      Horarios no disponibles
                    </p>
                  )}
                </div>
              </AccordionSection>

              {/* Sección: Contacto */}
              {(telefono ||
                email ||
                sitio_web ||
                whatsapp ||
                instagram ||
                facebook ||
                tiktok) && (
                <AccordionSection
                  title="Contacto"
                  icon={faAddressCard}
                  isOpen={activeSection === ACCORDION_SECTIONS.CONTACT}
                  onToggle={() => toggleSection(ACCORDION_SECTIONS.CONTACT)}>
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

                    {/* Redes sociales */}
                    {(whatsapp || instagram || facebook || tiktok) && (
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
                      </div>
                    )}
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
                            <strong>{nombre}</strong>
                            <br />
                            {direccion || `${comuna}, ${provincia}`}
                          </Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                  </div>
                ) : (
                  <div className="publication-modal__map-empty">
                    <FontAwesomeIcon icon={faMap} />
                    <p>Ubicación no disponible en el mapa</p>
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
                className="publication-modal__cta-btn publication-modal__cta-btn--outline"
                onClick={() => alert("Funcionalidad de guardar próximamente")}>
                <FontAwesomeIcon icon={faBookmark} />
                Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
