import { useState } from "react";
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
  faCheckCircle,
  faStore,
  faDirections,
} from "@fortawesome/free-solid-svg-icons";
import {
  faWhatsapp,
  faInstagram,
  faFacebook,
  faTiktok,
} from "@fortawesome/free-brands-svg-icons";
import "./styles/BusinessModal.css";

const PLACEHOLDER_IMAGE = "/img/Home1.png";

export default function BusinessModal({ business, isOpen, onClose }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

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

  // Formatear horarios
  const formatHorarios = () => {
    if (!horarios || typeof horarios !== "object") return null;

    const diasOrden = [
      { key: "lunes", label: "Lunes" },
      { key: "martes", label: "Martes" },
      { key: "miercoles", label: "Miércoles" },
      { key: "jueves", label: "Jueves" },
      { key: "viernes", label: "Viernes" },
      { key: "sabado", label: "Sábado" },
      { key: "domingo", label: "Domingo" },
    ];

    return diasOrden.map(({ key, label }) => {
      const horario = horarios[key];
      if (!horario) return { dia: label, horario: "-" };
      if (horario.cerrado) return { dia: label, horario: "Cerrado" };
      if (horario.apertura && horario.cierre) {
        return {
          dia: label,
          horario: `${horario.apertura} - ${horario.cierre}`,
        };
      }
      return { dia: label, horario: "-" };
    });
  };

  const horariosFormateados = formatHorarios();

  // Handlers para acciones
  const handleWhatsApp = () => {
    if (whatsapp) {
      const cleanNumber = whatsapp.replace(/\D/g, "");
      window.open(`https://wa.me/${cleanNumber}`, "_blank");
    }
  };

  const handleDirections = () => {
    if (ubicacion_url) {
      window.open(ubicacion_url, "_blank");
    } else if (direccion) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${direccion}, ${comuna}, ${provincia}`,
        )}`,
        "_blank",
      );
    }
  };

  return (
    <div className="business-modal-overlay" onClick={onClose}>
      <div className="business-modal" onClick={(e) => e.stopPropagation()}>
        {/* Botón cerrar (fuera del header para que esté siempre visible) */}
        <button className="business-modal__close" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>

        {/* Imagen a la izquierda */}
        <div className="business-modal__header">
          <img
            src={getCurrentImageUrl()}
            alt={nombre}
            className="business-modal__image"
            onError={() => setImageError(true)}
          />

          {/* Navegación de imágenes */}
          {hasMultipleImages && (
            <>
              <button
                className="business-modal__nav business-modal__nav--prev"
                onClick={handlePrevImage}>
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              <button
                className="business-modal__nav business-modal__nav--next"
                onClick={handleNextImage}>
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
              <div className="business-modal__indicators">
                {validImages.map((_, index) => (
                  <span
                    key={index}
                    className={`business-modal__indicator ${
                      index === currentImageIndex ? "active" : ""
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Badge verificado */}
          {verificado && (
            <span className="business-modal__verified">
              <FontAwesomeIcon icon={faCheckCircle} />
              Verificado
            </span>
          )}

          {/* Categoría */}
          {categories?.nombre && (
            <span
              className="business-modal__category"
              style={{ backgroundColor: categories.color || "#ff6600" }}>
              {categories.icono && <span>{categories.icono}</span>}
              {categories.nombre}
            </span>
          )}
        </div>

        {/* Contenido */}
        <div className="business-modal__content">
          {/* Título y slogan */}
          <div className="business-modal__title-section">
            <h2>{nombre}</h2>
            {slogan && <p className="business-modal__slogan">{slogan}</p>}
          </div>

          {/* Descripción */}
          {descripcion && (
            <div className="business-modal__description">
              <p>{descripcion}</p>
            </div>
          )}

          {/* Información de ubicación */}
          <div className="business-modal__section">
            <h3>
              <FontAwesomeIcon icon={faMapMarkerAlt} />
              Ubicación
            </h3>
            <p>
              {direccion && `${direccion}, `}
              {comuna}
              {provincia && `, ${provincia}`}
              {region && ` - ${region}`}
            </p>
            {(ubicacion_url || direccion) && (
              <button
                className="business-modal__directions-btn"
                onClick={handleDirections}>
                <FontAwesomeIcon icon={faDirections} />
                Cómo llegar
              </button>
            )}
          </div>

          {/* Horarios */}
          {horariosFormateados && (
            <div className="business-modal__section">
              <h3>
                <FontAwesomeIcon icon={faClock} />
                Horarios
              </h3>
              <div className="business-modal__schedule">
                {horariosFormateados.map(({ dia, horario }) => (
                  <div key={dia} className="business-modal__schedule-row">
                    <span className="business-modal__schedule-day">{dia}</span>
                    <span className="business-modal__schedule-time">
                      {horario}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contacto */}
          <div className="business-modal__section">
            <h3>Contacto</h3>
            <div className="business-modal__contact">
              {telefono && (
                <a
                  href={`tel:${telefono}`}
                  className="business-modal__contact-item">
                  <FontAwesomeIcon icon={faPhone} />
                  {telefono}
                </a>
              )}
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="business-modal__contact-item">
                  <FontAwesomeIcon icon={faEnvelope} />
                  {email}
                </a>
              )}
              {sitio_web && (
                <a
                  href={sitio_web}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="business-modal__contact-item">
                  <FontAwesomeIcon icon={faGlobe} />
                  Sitio web
                </a>
              )}
            </div>
          </div>

          {/* Redes sociales */}
          <div className="business-modal__social">
            {whatsapp && (
              <button
                className="business-modal__social-btn business-modal__social-btn--whatsapp"
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
                className="business-modal__social-btn business-modal__social-btn--instagram">
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
                className="business-modal__social-btn business-modal__social-btn--facebook">
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
                className="business-modal__social-btn business-modal__social-btn--tiktok">
                <FontAwesomeIcon icon={faTiktok} />
                TikTok
              </a>
            )}
          </div>

          {/* Propietario */}
          {profiles?.nombre && (
            <div className="business-modal__owner">
              {profiles.avatar_url ? (
                <img src={profiles.avatar_url} alt={profiles.nombre} />
              ) : (
                <div className="business-modal__owner-placeholder">
                  <FontAwesomeIcon icon={faStore} />
                </div>
              )}
              <div>
                <span>Publicado por</span>
                <strong>{profiles.nombre}</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
