import { useState, useEffect } from "react";
import "./styles/PublicationCard.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMapMarkerAlt,
  faUser,
  faClock,
  faTicketAlt,
  faCalendarWeek,
  faHeart as faHeartSolid,
  faChevronLeft,
  faChevronRight,
  faBookmark as faBookmarkSolid,
  faThumbsUp as faThumbsUpSolid,
  faBullhorn,
} from "@fortawesome/free-solid-svg-icons";
import {
  faHeart as faHeartRegular,
  faBookmark as faBookmarkRegular,
  faThumbsUp as faThumbsUpRegular,
} from "@fortawesome/free-regular-svg-icons";
import { useAuth } from "../../context/AuthContext";
import {
  toggleFavorite,
  toggleLike,
  hasUserLiked,
  getLikesCount,
} from "../../lib/database";

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
    fecha_fin,
    es_multidia,
    hora_inicio,
    hora_fin,
    tipo_entrada,
    precio,
    profiles,
    mensaje_marketing,
  } = publication;

  const { user, showToast } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(initialIsFavorite);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isTogglingLike, setIsTogglingLike] = useState(false);

  // Cargar estado de likes al montar
  useEffect(() => {
    const loadLikeState = async () => {
      try {
        const count = await getLikesCount(id);
        setLikeCount(count);

        if (user) {
          const liked = await hasUserLiked(user.id, id);
          setIsLiked(liked);
        }
      } catch (error) {
        console.error("Error cargando likes:", error);
      }
    };

    loadLikeState();
  }, [id, user]);

  // Obtener array de imágenes válidas
  const getValidImages = () => {
    if (Array.isArray(imagenes) && imagenes.length > 0) {
      return imagenes;
    }
    return [PLACEHOLDER_IMAGE];
  };

  const validImages = getValidImages();
  const hasMultipleImages = validImages.length > 1;

  // Obtener la imagen actual
  const getCurrentImageUrl = () => {
    if (imageError) return PLACEHOLDER_IMAGE;
    return validImages[currentImageIndex] || PLACEHOLDER_IMAGE;
  };

  const imageUrl = getCurrentImageUrl();

  // Handler para errores de carga de imagen
  const handleImageError = () => {
    console.warn(`Error cargando imagen para: ${titulo}`);
    setImageError(true);
  };

  // Navegación de imágenes
  const handlePrevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) =>
      prev === 0 ? validImages.length - 1 : prev - 1,
    );
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
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

  // Formatear fecha (con soporte para rango)
  const getFormattedDate = () => {
    if (!fecha_evento) return null;

    const formatShort = (fecha) => {
      return new Date(fecha + "T00:00:00").toLocaleDateString("es-CL", {
        day: "numeric",
        month: "short",
      });
    };

    if (isMultiDay && fecha_fin) {
      return `${formatShort(fecha_evento)} - ${formatShort(fecha_fin)}`;
    }

    return new Date(fecha_evento + "T00:00:00").toLocaleDateString("es-CL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formattedDate = getFormattedDate();

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

  // Manejar like
  const handleLikeClick = async (e) => {
    e.stopPropagation();
    if (!user) {
      showToast?.("Inicia sesión para dar me gusta", "warning");
      return;
    }
    if (isTogglingLike) return;

    setIsTogglingLike(true);
    try {
      const result = await toggleLike(user.id, id);
      setIsLiked(result.isLiked);
      setLikeCount(result.count);
    } catch (error) {
      console.error("Error al cambiar like:", error);
      showToast?.("Error al procesar tu like", "error");
    } finally {
      setIsTogglingLike(false);
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

        {/* Flechas de navegación */}
        {hasMultipleImages && (
          <>
            <button
              className="publication-card__nav publication-card__nav--prev"
              onClick={handlePrevImage}
              aria-label="Imagen anterior">
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <button
              className="publication-card__nav publication-card__nav--next"
              onClick={handleNextImage}
              aria-label="Imagen siguiente">
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </>
        )}

        {/* Indicadores de imagen (dots) */}
        {hasMultipleImages && (
          <div className="publication-card__dots">
            {validImages.map((_, index) => (
              <span
                key={index}
                className={`publication-card__dot ${
                  index === currentImageIndex
                    ? "publication-card__dot--active"
                    : ""
                }`}
              />
            ))}
          </div>
        )}

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

        {/* Mensaje de Marketing */}
        {mensaje_marketing && (
          <div className="publication-card__marketing">
            <FontAwesomeIcon
              icon={faBullhorn}
              className="publication-card__marketing-icon"
            />
            <span className="publication-card__marketing-text">
              {mensaje_marketing}
            </span>
          </div>
        )}

        {/* Fecha y hora */}
        <div className="publication-card__datetime">
          {formattedDate && (
            <span
              className={`publication-card__date ${
                isMultiDay ? "publication-card__date--multiday" : ""
              }`}>
              {isMultiDay && <FontAwesomeIcon icon={faCalendarWeek} />}
              {formattedDate}
            </span>
          )}
          {/* Badge de duración para eventos multi-día */}
          {isMultiDay && duracionDias && (
            <span className="publication-card__duration">
              {duracionDias} días
            </span>
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

        {/* Botones de acción */}
        <div className="publication-card__actions">
          <button
            className={`publication-card__action-btn ${isLiked ? "publication-card__action-btn--active" : ""}`}
            onClick={handleLikeClick}
            disabled={isTogglingLike}
            aria-label={isLiked ? "Quitar me gusta" : "Me gusta"}>
            <FontAwesomeIcon
              icon={isLiked ? faThumbsUpSolid : faThumbsUpRegular}
            />
            <span>{likeCount > 0 ? likeCount : "Me gusta"}</span>
          </button>
          <button
            className={`publication-card__action-btn ${isFavorited ? "publication-card__action-btn--active" : ""}`}
            onClick={handleFavoriteClick}
            disabled={isTogglingFavorite}
            aria-label={isFavorited ? "Quitar de guardados" : "Guardar"}>
            <FontAwesomeIcon
              icon={isFavorited ? faBookmarkSolid : faBookmarkRegular}
            />
            <span>{isFavorited ? "Guardado" : "Guardar"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
