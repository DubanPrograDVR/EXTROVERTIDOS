import { useState } from "react";
import "./styles/PublicationCard.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMapMarkerAlt,
  faUser,
  faClock,
  faTicketAlt,
  faHeart as faHeartSolid,
} from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import { useAuth } from "../../context/AuthContext";
import { toggleFavorite } from "../../lib/database";

// Imagen placeholder por defecto
const PLACEHOLDER_IMAGE = "/img/Home1.png";

export default function PublicationCard({
  publication,
  onClick,
  isFavorite: initialIsFavorite = false,
  onFavoriteChange,
}) {
  const {
    id,
    titulo,
    imagenes,
    comuna,
    provincia,
    categories,
    fecha_evento,
    hora_inicio,
    hora_fin,
    tipo_entrada,
    precio,
    profiles,
  } = publication;

  const { user } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [isFavorited, setIsFavorited] = useState(initialIsFavorite);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

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

  // Construir string de horario completo (inicio - fin)
  const getHorarioShort = () => {
    const inicio = formatTime(hora_inicio);
    const fin = formatTime(hora_fin);

    if (inicio && fin) {
      return `${inicio} - ${fin} hrs`;
    } else if (inicio) {
      return `${inicio} hrs`;
    }
    return null;
  };

  // Obtener texto de entrada/precio
  const getEntradaText = () => {
    if (tipo_entrada === "gratis" || (!precio && tipo_entrada !== "pagada")) {
      return "Gratis";
    }
    if (precio) {
      return `$${precio.toLocaleString("es-CL")}`;
    }
    return null;
  };

  const handleClick = () => {
    if (onClick) onClick(publication);
  };

  // Manejar toggle de favorito
  const handleFavoriteClick = async (e) => {
    e.stopPropagation(); // Evitar que se abra el modal

    if (!user) {
      // Aquí podrías mostrar un toast o abrir el modal de login
      console.log("Debes iniciar sesión para guardar favoritos");
      return;
    }

    if (isTogglingFavorite) return;

    setIsTogglingFavorite(true);
    try {
      const result = await toggleFavorite(user.id, id);
      setIsFavorited(result.isFavorite);

      // Notificar al componente padre si existe el callback
      if (onFavoriteChange) {
        onFavoriteChange(id, result.isFavorite);
      }
    } catch (error) {
      console.error("Error al cambiar favorito:", error);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const horarioShort = getHorarioShort();
  const entradaText = getEntradaText();

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
          {/* Botón de favorito */}
          <button
            className={`publication-card__favorite ${
              isFavorited ? "publication-card__favorite--active" : ""
            }`}
            onClick={handleFavoriteClick}
            disabled={isTogglingFavorite}
            aria-label={
              isFavorited ? "Quitar de favoritos" : "Guardar en favoritos"
            }>
            <FontAwesomeIcon
              icon={isFavorited ? faHeartSolid : faHeartRegular}
            />
          </button>
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
          {entradaText && (
            <span
              className={`publication-card__entrada ${
                tipo_entrada === "gratis"
                  ? "publication-card__entrada--gratis"
                  : ""
              }`}>
              <FontAwesomeIcon icon={faTicketAlt} />
              {entradaText}
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
