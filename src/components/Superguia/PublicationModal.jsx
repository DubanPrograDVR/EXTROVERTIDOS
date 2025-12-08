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
    imagen,
    ciudad,
    categoria,
    descripcion,
    fecha,
    hora,
    entrada,
    direccion,
    contacto,
    ubicacionUrl,
    tags = [],
    redes = {},
  } = publication;

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
          <span className="publication-modal__category">{categoria}</span>
        </div>

        {/* Contenido principal */}
        <div className="publication-modal__content">
          {/* Imagen */}
          <div className="publication-modal__image-section">
            <img
              src={imagen || "/img/placeholder.jpg"}
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

            {/* Descripción */}
            {descripcion && (
              <p className="publication-modal__description">{descripcion}</p>
            )}

            {/* Información detallada */}
            <div className="publication-modal__details">
              <h4 className="publication-modal__details-title">INFORMACIÓN</h4>

              <div className="publication-modal__detail-item">
                <FontAwesomeIcon icon={faCalendarDays} />
                <span>Fecha: {fecha || "Por confirmar"}</span>
              </div>

              <div className="publication-modal__detail-item">
                <FontAwesomeIcon icon={faClock} />
                <span>Hora: {hora || "Por confirmar"}</span>
              </div>

              <div className="publication-modal__detail-item">
                <FontAwesomeIcon icon={faTicket} />
                <span>Entrada: {entrada || "Por confirmar"}</span>
              </div>

              <div className="publication-modal__detail-item">
                <FontAwesomeIcon icon={faLocationDot} />
                <span>Dirección: {direccion || ciudad}</span>
              </div>

              <div className="publication-modal__detail-item">
                <FontAwesomeIcon icon={faPhone} />
                <span>Contacto: {contacto || "No disponible"}</span>
              </div>

              {ubicacionUrl && (
                <div className="publication-modal__detail-item publication-modal__detail-item--link">
                  <FontAwesomeIcon icon={faMapMarkerAlt} />
                  <a
                    href={ubicacionUrl}
                    target="_blank"
                    rel="noopener noreferrer">
                    Ubicación: 📍
                  </a>
                </div>
              )}
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="publication-modal__tags">
                {tags.map((tag, index) => (
                  <span key={index} className="publication-modal__tag">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Redes sociales */}
            <div className="publication-modal__social">
              {redes.instagram && (
                <a
                  href={redes.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="publication-modal__social-link">
                  <FontAwesomeIcon icon={faInstagram} />
                </a>
              )}
              {redes.facebook && (
                <a
                  href={redes.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="publication-modal__social-link">
                  <FontAwesomeIcon icon={faFacebook} />
                </a>
              )}
              {redes.whatsapp && (
                <a
                  href={redes.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="publication-modal__social-link">
                  <FontAwesomeIcon icon={faWhatsapp} />
                </a>
              )}
              {redes.youtube && (
                <a
                  href={redes.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="publication-modal__social-link">
                  <FontAwesomeIcon icon={faYoutube} />
                </a>
              )}
              {redes.tiktok && (
                <a
                  href={redes.tiktok}
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
