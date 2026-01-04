import { useState } from "react";
import "./styles/PublicationCard.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapMarkerAlt, faUser, faClock } from "@fortawesome/free-solid-svg-icons";

// Imagen placeholder por defecto
const PLACEHOLDER_IMAGE = "/img/Home1.png";

export default function PublicationCard({ publication, onClick }) {
  const {
    titulo,
    imagenes,
    comuna,
    provincia,
    categories,
    fecha_evento,
    hora_inicio,
    hora_fin,
    profiles,
  } = publication;

  const [imageError, setImageError] = useState(false);

  // Obtener la primera imagen del array o usar placeholder
  const getImageUrl = () => {
    if (imageError) return PLACEHOLDER_IMAGE;
    if (Array.isArray(imagenes) && imagenes.length > 0) {
      return imagenes[0];
    }
    return PLACEHOLDER_IMAGE;
  };

  const imageUrl = getImageUrl();

  // Handler para errores de carga de imagen
  const handleImageError = () => {
    console.warn(`Error cargando imagen para: ${titulo}`);
    setImageError(true);
  };

  // Formatear fecha
  const formattedDate = fecha_evento
    ? new Date(fecha_evento).toLocaleDateString("es-CL", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  // Formatear hora (de "HH:MM:SS" a "HH:MM")
  const formatTime = (timeString) => {
    if (!timeString) return null;
    const parts = timeString.split(":");
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return timeString;
  };

  // Construir string de horario corto
  const getHorarioShort = () => {
    const inicio = formatTime(hora_inicio);
    if (inicio) {
      return inicio + " hrs";
    }
    return null;
  };

  const handleClick = () => {
    if (onClick) onClick(publication);
  };

  const horarioShort = getHorarioShort();

  return (
    <article className="publication-card" onClick={handleClick}>
      <div className="publication-card__image-container">
        <img
          src={imageUrl}
          alt={titulo}
          className="publication-card__image"
          loading="lazy"
          onError={handleImageError}
        />
        <div className="publication-card__overlay">
          <span className="publication-card__category">
            {categories?.nombre || "Sin categoría"}
          </span>
        </div>
      </div>

      <div className="publication-card__content">
        <div className="publication-card__location">
          <FontAwesomeIcon icon={faMapMarkerAlt} />
          <span>
            {comuna}
            {provincia ? `, ${provincia}` : ""}
          </span>
        </div>
        <h3 className="publication-card__title">{titulo}</h3>
        
        {/* Fecha y hora */}
        <div className="publication-card__datetime">
          {formattedDate && (
            <span className="publication-card__date">{formattedDate}</span>
          )}
          {horarioShort && (
            <span className="publication-card__time">
              <FontAwesomeIcon icon={faClock} />
              {horarioShort}
            </span>
          )}
        </div>

        {/* Información del autor */}
        {profiles && (
          <div className="publication-card__author">
            {profiles.avatar_url ? (
              <img
                src={profiles.avatar_url}
                alt={profiles.nombre || "Autor"}
                className="publication-card__author-avatar"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="publication-card__author-icon">
                <FontAwesomeIcon icon={faUser} />
              </div>
            )}
            <span className="publication-card__author-name">
              {profiles.nombre || "Usuario"}
            </span>
          </div>
        )}
      </div>
    </article>
  );
}
