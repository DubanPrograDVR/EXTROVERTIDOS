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
    categoria,
    subcategoria,
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
      <div
        className="publication-modal publication-modal--business"
        role="dialog"
        aria-modal="true"
        aria-label="Detalle del negocio">
        {/* Categoría en la parte superior con logo */}
        {categoria && (
          <div className="publication-modal__category-header">
            <img
              src="/img/SG_Extro.png"
              alt="Superguía"
              className="publication-modal__brand-logo"
            />
            <span
              className="publication-modal__category-badge"
              style={{ backgroundColor: "#ff6600" }}>
              {categoria}
            </span>
            {subcategoria && (
              <span className="publication-modal__subcategory-badge">
                {subcategoria}
              </span>
            )}
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
                title="Horario de atención (Resumen)"
                icon={faClock}
                isOpen={activeSection === ACCORDION_SECTIONS.SCHEDULE}
                onToggle={() => toggleSection(ACCORDION_SECTIONS.SCHEDULE)}>
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
