import { useEffect } from "react";
import "./styles/PublicationModal.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faCalendarDays,
  faClock,
  faTicket,
  faLocationDot,
  faPhone,
  faMapMarkerAlt,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import {
  faInstagram,
  faFacebook,
  faWhatsapp,
  faYoutube,
  faTiktok,
} from "@fortawesome/free-brands-svg-icons";

export default function PublicationModal({ publication, isOpen, onClose }) {
  // Cerrar con ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !publication) return null;

  const {
    titulo,
    subtitulo,
    imagen_url,
    comuna,
    provincia,
    categories,
    descripcion,
    fecha_evento,
    hora_evento,
    precio,
    direccion,
    telefono,
    ubicacion_url,
    instagram,
    facebook,
    whatsapp,
    youtube,
    tiktok,
    profiles,
  } = publication;

  // Formatear fecha
  const formattedDate = fecha_evento
    ? new Date(fecha_evento).toLocaleDateString("es-CL", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="publication-modal-overlay" onClick={handleOverlayClick}>
      <div className="publication-modal">
        {/* Botón cerrar */}
        <button className="publication-modal__close" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>

        {/* Header con categoría */}
        <div className="publication-modal__header">
          <span className="publication-modal__category">
            {categories?.nombre || "Sin categoría"}
          </span>
        </div>

        {/* Contenido principal */}
        <div className="publication-modal__content">
          {/* Imagen */}
          <div className="publication-modal__image-section">
            <img
              src={imagen_url || "/img/placeholder.jpg"}
              alt={titulo}
              className="publication-modal__image"
            />
          </div>

          {/* Información */}
          <div className="publication-modal__info-section">
            {/* Título y subtítulo */}
            <div className="publication-modal__titles">
              <h2 className="publication-modal__title">{titulo}</h2>
              {subtitulo && (
                <h3 className="publication-modal__subtitle">{subtitulo}</h3>
              )}
            </div>

            {/* Autor */}
            {profiles && (
              <div className="publication-modal__author">
                {profiles.avatar_url ? (
                  <img
                    src={profiles.avatar_url}
                    alt={profiles.nombre || "Autor"}
                    className="publication-modal__author-avatar"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="publication-modal__author-icon">
                    <FontAwesomeIcon icon={faUser} />
                  </div>
                )}
                <span className="publication-modal__author-name">
                  Publicado por {profiles.nombre || "Usuario"}
                </span>
              </div>
            )}

            {/* Descripción */}
            {descripcion && (
              <p className="publication-modal__description">{descripcion}</p>
            )}

            {/* Información detallada */}
            <div className="publication-modal__details">
              <h4 className="publication-modal__details-title">INFORMACIÓN</h4>

              <div className="publication-modal__detail-item">
                <FontAwesomeIcon icon={faCalendarDays} />
                <span>Fecha: {formattedDate || "Por confirmar"}</span>
              </div>

              <div className="publication-modal__detail-item">
                <FontAwesomeIcon icon={faClock} />
                <span>Hora: {hora_evento || "Por confirmar"}</span>
              </div>

              <div className="publication-modal__detail-item">
                <FontAwesomeIcon icon={faTicket} />
                <span>Entrada: {precio || "Por confirmar"}</span>
              </div>

              <div className="publication-modal__detail-item">
                <FontAwesomeIcon icon={faLocationDot} />
                <span>Dirección: {direccion || `${comuna}, ${provincia}`}</span>
              </div>

              <div className="publication-modal__detail-item">
                <FontAwesomeIcon icon={faPhone} />
                <span>Contacto: {telefono || "No disponible"}</span>
              </div>

              {ubicacion_url && (
                <div className="publication-modal__detail-item publication-modal__detail-item--link">
                  <FontAwesomeIcon icon={faMapMarkerAlt} />
                  <a
                    href={ubicacion_url}
                    target="_blank"
                    rel="noopener noreferrer">
                    Ubicación: 📍
                  </a>
                </div>
              )}
            </div>

            {/* Redes sociales */}
            <div className="publication-modal__social">
              {instagram && (
                <a
                  href={instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="publication-modal__social-link">
                  <FontAwesomeIcon icon={faInstagram} />
                </a>
              )}
              {facebook && (
                <a
                  href={facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="publication-modal__social-link">
                  <FontAwesomeIcon icon={faFacebook} />
                </a>
              )}
              {whatsapp && (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="publication-modal__social-link">
                  <FontAwesomeIcon icon={faWhatsapp} />
                </a>
              )}
              {youtube && (
                <a
                  href={youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="publication-modal__social-link">
                  <FontAwesomeIcon icon={faYoutube} />
                </a>
              )}
              {tiktok && (
                <a
                  href={tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="publication-modal__social-link">
                  <FontAwesomeIcon icon={faTiktok} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
