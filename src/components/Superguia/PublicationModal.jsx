import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./styles/PublicationModal.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faCalendarDays,
  faCalendarWeek,
  faClock,
  faTicket,
  faLocationDot,
  faPhone,
  faMapMarkerAlt,
  faUser,
  faChevronDown,
  faChevronUp,
  faChevronLeft,
  faChevronRight,
  faRoute,
  faMap,
  faExternalLinkAlt,
  faShareAlt,
  faHeart,
  faBookmark,
  faBullhorn,
  faTag,
  faHashtag,
  faAlignLeft,
  faAddressCard,
} from "@fortawesome/free-solid-svg-icons";
import {
  faInstagram,
  faFacebook,
  faWhatsapp,
  faYoutube,
  faTiktok,
} from "@fortawesome/free-brands-svg-icons";

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
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${title.toLowerCase().replace(/\s/g, "-")}`}>
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
        id={`accordion-content-${title.toLowerCase().replace(/\s/g, "-")}`}
        role="region"
        aria-hidden={!isOpen}>
        <div className="accordion-section__body">{children}</div>
      </div>
    </div>
  );
};

export default function PublicationModal({ publication, isOpen, onClose }) {
  // Estado único para controlar qué sección del acordeón está abierta (null = ninguna)
  const [activeSection, setActiveSection] = useState(
    ACCORDION_SECTIONS.DESCRIPTION,
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Función para alternar secciones del acordeón (solo una abierta a la vez)
  const toggleSection = useCallback((section) => {
    setActiveSection((prev) => (prev === section ? null : section));
  }, []);

  // Cerrar con ESC y resetear estado al cerrar
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    } else {
      // Resetear sección activa cuando se cierra el modal
      setActiveSection(ACCORDION_SECTIONS.DESCRIPTION);
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  // Resetear índice de imagen cuando cambia la publicación
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [publication?.id]);

  if (!isOpen || !publication) return null;

  const {
    titulo,
    subtitulo,
    imagenes,
    comuna,
    provincia,
    categories,
    descripcion,
    mensaje_marketing,
    mensaje_marketing_2,
    telefono_contacto,
    hashtags,
    etiqueta_directa,
    fecha_evento,
    fecha_fin,
    es_multidia,
    hora_inicio,
    hora_fin,
    tipo_entrada,
    precio,
    direccion,
    telefono,
    ubicacion_url,
    redes_sociales,
    profiles,
    organizador,
    event_tags,
  } = publication;

  // Extraer redes sociales del objeto JSON
  const instagram = redes_sociales?.instagram || publication.instagram;
  const facebook = redes_sociales?.facebook || publication.facebook;
  const whatsapp = redes_sociales?.whatsapp || publication.whatsapp;
  const youtube = redes_sociales?.youtube || publication.youtube;
  const tiktok = redes_sociales?.tiktok || publication.tiktok;

  // Usar telefono_contacto si existe, sino usar telefono
  const contactPhone = telefono_contacto || telefono;

  // Parsear hashtags
  const parseHashtags = () => {
    if (!hashtags) return [];
    return hashtags
      .split(/[,\s]+/)
      .filter((tag) => tag.trim())
      .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));
  };

  const hashtagsList = parseHashtags();

  // Obtener array de imágenes válidas
  const getValidImages = () => {
    if (Array.isArray(imagenes) && imagenes.length > 0) {
      return imagenes;
    }
    return ["/img/Home1.png"];
  };

  const validImages = getValidImages();
  const hasMultipleImages = validImages.length > 1;

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

  // Determinar si es evento multi-día
  const isMultiDay = es_multidia || (fecha_fin && fecha_fin !== fecha_evento);

  // Calcular duración en días
  const calcularDuracion = () => {
    if (!fecha_evento || !fecha_fin) return null;
    const inicio = new Date(fecha_evento);
    const fin = new Date(fecha_fin);
    const diffTime = Math.abs(fin - inicio);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const duracionDias = isMultiDay ? calcularDuracion() : null;

  // Formatear fecha
  const formatearFecha = (fecha, formato = "largo") => {
    if (!fecha) return null;
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

  // Obtener display de fecha (simple o rango)
  const getFechaDisplay = () => {
    if (isMultiDay && fecha_fin) {
      const inicioCorto = formatearFecha(fecha_evento, "corto");
      const finCorto = formatearFecha(fecha_fin, "corto");
      const anio = new Date(fecha_evento + "T00:00:00").getFullYear();
      return `${inicioCorto} al ${finCorto}, ${anio}`;
    }
    return formatearFecha(fecha_evento);
  };

  // Formatear hora (de "HH:MM:SS" a "HH:MM")
  const formatTime = (timeString) => {
    if (!timeString) return null;
    // Si viene en formato "HH:MM:SS", extraer solo "HH:MM"
    const parts = timeString.split(":");
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return timeString;
  };

  // Construir string de horario
  const getHorarioDisplay = () => {
    const inicio = formatTime(hora_inicio);
    const fin = formatTime(hora_fin);

    if (inicio && fin) {
      return `${inicio} - ${fin} hrs`;
    } else if (inicio) {
      return `${inicio} hrs`;
    } else if (fin) {
      return `Hasta ${fin} hrs`;
    }
    return "Por confirmar";
  };

  // Formatear entrada/precio
  const getEntradaDisplay = () => {
    if (
      tipo_entrada === "gratis" ||
      tipo_entrada === "gratuito" ||
      tipo_entrada === "sin_entrada" ||
      (!precio && tipo_entrada !== "pagado")
    ) {
      return "Entrada gratuita";
    }
    if (precio) {
      return `$${precio.toLocaleString("es-CL")}`;
    }
    return "Por confirmar";
  };

  // Extraer coordenadas de la URL de Google Maps
  const extractCoordinates = (url) => {
    if (!url) return null;

    // Patrón para URLs de Google Maps con @lat,lng
    const atPattern = /@(-?\d+\.?\d*),(-?\d+\.?\d*)/;
    // Patrón para URLs con query ?q=lat,lng
    const qPattern = /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
    // Patrón para URLs con /place/lat,lng
    const placePattern = /\/place\/(-?\d+\.?\d*),(-?\d+\.?\d*)/;

    let match =
      url.match(atPattern) || url.match(qPattern) || url.match(placePattern);

    if (match) {
      return {
        lat: parseFloat(match[1]),
        lng: parseFloat(match[2]),
      };
    }
    return null;
  };

  // Obtener coordenadas del evento
  const coordinates = extractCoordinates(ubicacion_url);

  // Generar URL de direcciones de Google Maps
  const getDirectionsUrl = () => {
    if (coordinates) {
      return `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`;
    }
    // Fallback: usar la dirección como destino
    const destination = encodeURIComponent(
      direccion || `${comuna}, ${provincia}, Chile`,
    );
    return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Manejar WhatsApp
  const handleWhatsApp = () => {
    if (whatsapp) {
      const cleanNumber = whatsapp.replace(/\D/g, "");
      window.open(`https://wa.me/${cleanNumber}`, "_blank");
    }
  };

  return (
    <div className="publication-modal-overlay" onClick={handleOverlayClick}>
      <div className="publication-modal publication-modal--business-style">
        {/* Categoría en la parte superior con logo */}
        {categories?.nombre && (
          <div className="publication-modal__category-header">
            <img
              src="/img/P_Extro.png"
              alt="Extrovertidos"
              className="publication-modal__brand-logo"
            />
            <span
              className="publication-modal__category-badge"
              style={{ backgroundColor: categories.color || "#ff6600" }}>
              {categories.icono && <span>{categories.icono}</span>}
              {categories.nombre}
            </span>
          </div>
        )}

        {/* Botón cerrar */}
        <button className="publication-modal__close" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>

        {/* Cuerpo del modal (imagen + contenido) */}
        <div className="publication-modal__body">
          {/* ===== SECCIÓN IZQUIERDA: IMAGEN ===== */}
          <div className="publication-modal__left">
            {/* Fondo blur */}
            <div
              className="publication-modal__image-bg"
              style={{
                backgroundImage: `url(${validImages[currentImageIndex]})`,
              }}
            />
            <img
              src={validImages[currentImageIndex]}
              alt={titulo}
              className="publication-modal__main-image"
              onError={(e) => {
                e.target.src = "/img/Home1.png";
              }}
            />
            {/* Navegación de imágenes */}
            {hasMultipleImages && (
              <>
                <button
                  className="publication-modal__nav publication-modal__nav--prev"
                  onClick={handlePrevImage}
                  aria-label="Imagen anterior">
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>
                <button
                  className="publication-modal__nav publication-modal__nav--next"
                  onClick={handleNextImage}
                  aria-label="Imagen siguiente">
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>

                {/* Indicadores */}
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

            {/* Badge de duración para eventos multi-día */}
            {isMultiDay && duracionDias && (
              <span className="publication-modal__duration-badge">
                🎉 {duracionDias} días
              </span>
            )}

            {/* Etiqueta directa destacada */}
            {etiqueta_directa && (
              <span className="publication-modal__featured-tag">
                <FontAwesomeIcon icon={faTag} />
                {etiqueta_directa}
              </span>
            )}
          </div>

          {/* ===== SECCIÓN DERECHA: CONTENIDO ===== */}
          <div className="publication-modal__right">
            {/* Título y organizador */}
            <div className="publication-modal__title-section">
              <h2>{titulo}</h2>
              {subtitulo && (
                <p className="publication-modal__slogan">{subtitulo}</p>
              )}
            </div>

            {/* Organizador */}
            {(organizador || profiles?.nombre) && (
              <p className="publication-modal__organizer-line">
                <FontAwesomeIcon icon={faUser} />
                Organiza: {organizador || profiles?.nombre}
              </p>
            )}

            {/* Mensaje de Marketing Principal */}
            {mensaje_marketing && (
              <div className="publication-modal__marketing">
                <FontAwesomeIcon
                  icon={faBullhorn}
                  className="publication-modal__marketing-icon"
                />
                <p className="publication-modal__marketing-text">
                  {mensaje_marketing}
                </p>
              </div>
            )}

            {/* Mensaje de Marketing 2 */}
            {mensaje_marketing_2 && (
              <div className="publication-modal__marketing publication-modal__marketing--secondary">
                <FontAwesomeIcon
                  icon={faBullhorn}
                  className="publication-modal__marketing-icon"
                />
                <p className="publication-modal__marketing-text">
                  {mensaje_marketing_2}
                </p>
              </div>
            )}

            {/* ===== ACORDEÓN DE INFORMACIÓN ===== */}
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
                    {/* Hashtags dentro de descripción */}
                    {hashtagsList.length > 0 && (
                      <div className="publication-modal__hashtags">
                        {hashtagsList.map((tag, index) => (
                          <span
                            key={index}
                            className="publication-modal__hashtag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
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
                <div className="publication-modal__schedule">
                  <div className="publication-modal__schedule-row">
                    <span className="publication-modal__schedule-label">
                      <FontAwesomeIcon icon={faCalendarDays} />
                      {isMultiDay ? "Fechas" : "Fecha"}
                    </span>
                    <span className="publication-modal__schedule-value">
                      {getFechaDisplay() || "Por confirmar"}
                    </span>
                  </div>
                  <div className="publication-modal__schedule-row">
                    <span className="publication-modal__schedule-label">
                      <FontAwesomeIcon icon={faClock} />
                      Horario
                    </span>
                    <span className="publication-modal__schedule-value">
                      {getHorarioDisplay()}
                    </span>
                  </div>
                  <div className="publication-modal__schedule-row">
                    <span className="publication-modal__schedule-label">
                      <FontAwesomeIcon icon={faTicket} />
                      Entrada
                    </span>
                    <span className="publication-modal__schedule-value publication-modal__schedule-value--price">
                      {getEntradaDisplay()}
                    </span>
                  </div>
                </div>
              </AccordionSection>

              {/* Sección: Contacto */}
              {(contactPhone ||
                instagram ||
                facebook ||
                whatsapp ||
                youtube ||
                tiktok) && (
                <AccordionSection
                  title="Contacto"
                  icon={faAddressCard}
                  isOpen={activeSection === ACCORDION_SECTIONS.CONTACT}
                  onToggle={() => toggleSection(ACCORDION_SECTIONS.CONTACT)}>
                  <div className="publication-modal__contact-content">
                    {contactPhone && (
                      <a
                        href={`tel:${contactPhone}`}
                        className="publication-modal__contact-item">
                        <FontAwesomeIcon icon={faPhone} />
                        <span>{contactPhone}</span>
                      </a>
                    )}
                    {/* Redes sociales */}
                    {(instagram ||
                      facebook ||
                      whatsapp ||
                      youtube ||
                      tiktok) && (
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
                        {youtube && (
                          <a
                            href={
                              youtube.startsWith("http")
                                ? youtube
                                : `https://youtube.com/${youtube}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="publication-modal__social-btn publication-modal__social-btn--youtube">
                            <FontAwesomeIcon icon={faYoutube} />
                            YouTube
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
                            <strong>{titulo}</strong>
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

            {/* Publicado por - Abajo */}
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
              <button
                className="publication-modal__cta-btn publication-modal__cta-btn--primary"
                onClick={() =>
                  ubicacion_url && window.open(ubicacion_url, "_blank")
                }>
                <FontAwesomeIcon icon={faExternalLinkAlt} />
                Ver evento
              </button>
              <button
                className="publication-modal__cta-btn publication-modal__cta-btn--secondary"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: titulo,
                      text: `¡Mira este evento! ${titulo}`,
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
