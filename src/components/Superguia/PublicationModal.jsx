import { useEffect } from "react";
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
    imagenes,
    comuna,
    provincia,
    categories,
    descripcion,
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
  } = publication;

  // Extraer redes sociales del objeto JSON
  const instagram = redes_sociales?.instagram || publication.instagram;
  const facebook = redes_sociales?.facebook || publication.facebook;
  const whatsapp = redes_sociales?.whatsapp || publication.whatsapp;
  const youtube = redes_sociales?.youtube || publication.youtube;
  const tiktok = redes_sociales?.tiktok || publication.tiktok;

  // Obtener la primera imagen del array o usar placeholder
  const imageUrl =
    Array.isArray(imagenes) && imagenes.length > 0
      ? imagenes[0]
      : "/img/Home1.png";

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
    if (tipo_entrada === "gratis" || (!precio && tipo_entrada !== "pagada")) {
      return "Entrada gratuita";
    }
    if (precio) {
      return `$${precio.toLocaleString("es-CL")}`;
    }
    return "Por confirmar";
  };

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
              src={imageUrl}
              alt={titulo}
              className="publication-modal__image"
              onError={(e) => {
                e.target.src = "/img/Home1.png";
              }}
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
                <FontAwesomeIcon
                  icon={isMultiDay ? faCalendarWeek : faCalendarDays}
                />
                <span>
                  {isMultiDay ? "Fechas: " : "Fecha: "}
                  {getFechaDisplay() || "Por confirmar"}
                </span>
              </div>

              {/* Badge de duración para eventos multi-día */}
              {isMultiDay && duracionDias && (
                <div className="publication-modal__duration-badge">
                  <span>🎉 Evento de {duracionDias} días</span>
                </div>
              )}

              <div className="publication-modal__detail-item">
                <FontAwesomeIcon icon={faClock} />
                <span>Hora: {getHorarioDisplay()}</span>
              </div>

              <div className="publication-modal__detail-item">
                <FontAwesomeIcon icon={faTicket} />
                <span>Entrada: {getEntradaDisplay()}</span>
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
