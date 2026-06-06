import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import "./styles/PublicationCard.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMapMarkerAlt,
  faUser,
  faClock,
  faTicketAlt,
  faCalendarDay,
  faCalendarWeek,
  faHeart as faHeartSolid,
  faChevronLeft,
  faChevronRight,
  faBookmark as faBookmarkSolid,
  faThumbsUp as faThumbsUpSolid,
  faBullhorn,
  faRepeat,
  faFire,
  faShareAlt,
} from "@fortawesome/free-solid-svg-icons";
import {
  faHeart as faHeartRegular,
  faBookmark as faBookmarkRegular,
  faThumbsUp as faThumbsUpRegular,
} from "@fortawesome/free-regular-svg-icons";
import { useAuth } from "../../context/AuthContext";
import { useRealtimeRefetch } from "../../hooks/useRealtimeRefetch";
import AuthModal from "../Auth/AuthModal";
import {
  toggleFavorite,
  toggleLike,
  hasUserLiked,
  getLikesCount,
  getFavoritesCount,
  incrementShareCount,
  getEventShareCount,
} from "../../lib/database";

// Imagen placeholder por defecto
const PLACEHOLDER_IMAGE = "/img/Home1.png";

const parseLocalDate = (dateString) => {
  if (!dateString) return null;
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const isSameLocalDay = (dateA, dateB) =>
  dateA.getFullYear() === dateB.getFullYear() &&
  dateA.getMonth() === dateB.getMonth() &&
  dateA.getDate() === dateB.getDate();

const addLocalDays = (date, days) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
};

const isPublicationOnDate = (publication, targetDate) => {
  if (
    publication.es_recurrente &&
    Array.isArray(publication.fechas_recurrencia) &&
    publication.fechas_recurrencia.some((fecha) => {
      const recurringDate = parseLocalDate(fecha);
      return recurringDate && isSameLocalDay(recurringDate, targetDate);
    })
  ) {
    return true;
  }

  const startDate = parseLocalDate(publication.fecha_evento);
  if (!startDate) return false;

  const endDate = parseLocalDate(publication.fecha_fin);
  const spansMultipleDays =
    publication.es_multidia ||
    (endDate &&
      !isSameLocalDay(startDate, endDate) &&
      !publication.es_recurrente);

  if (spansMultipleDays && endDate) {
    return targetDate >= startDate && targetDate <= endDate;
  }

  return isSameLocalDay(startDate, targetDate);
};

const getPublicationDayLabel = (publication) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = addLocalDays(today, 1);

  if (isPublicationOnDate(publication, today)) return "Hoy";
  if (isPublicationOnDate(publication, tomorrow)) return "Mañana";
  return null;
};

export default function PublicationCard({
  publication,
  onClick,
  isFavorite: initialIsFavorite = false,
  onFavoriteChange,
  likeState,
  onLikeChange,
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
    es_recurrente,
    dia_recurrencia,
    cantidad_repeticiones,
    fechas_recurrencia,
    hora_inicio,
    hora_fin,
    tipo_entrada,
    precio,
    profiles,
    mensaje_marketing,
    organizador,
  } = publication;

  const { user, showToast } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(initialIsFavorite);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [isLiked, setIsLiked] = useState(likeState?.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(likeState?.count ?? 0);
  const [isTogglingLike, setIsTogglingLike] = useState(false);
  const [shareCount, setShareCount] = useState(publication?.share_count ?? 0);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Si el padre provee likeState (batched), úsalo como fuente de verdad.
  const hasExternalLikeState = likeState !== undefined && likeState !== null;
  const externalIsLiked = likeState?.isLiked;
  const externalCount = likeState?.count;

  // Cargar estado de likes al montar (solo si NO viene del padre).
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

  // Cargar contador de favoritos por evento al montar.
  useEffect(() => {
    getFavoritesCount(id)
      .then(setFavoriteCount)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (hasExternalLikeState) return;
    loadLikeState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user, hasExternalLikeState]);

  // Sincronizar con el estado batched provisto por el padre.
  useEffect(() => {
    if (!hasExternalLikeState) return;
    setIsLiked(!!externalIsLiked);
    setLikeCount(Number(externalCount) || 0);
  }, [hasExternalLikeState, externalIsLiked, externalCount]);

  // Tiempo real: actualizar likes cuando cualquier usuario reacciona.
  // Solo se activa si la card es autónoma (sin batched state del padre).
  useRealtimeRefetch({
    table: "event_likes",
    event: "*",
    filter: id ? `event_id=eq.${id}` : undefined,
    enabled: Boolean(id) && !hasExternalLikeState,
    onChange: () => loadLikeState(),
  });

  // Tiempo real: actualizar share_count cuando otro usuario comparte.
  useRealtimeRefetch({
    table: "events",
    event: "UPDATE",
    filter: id ? `id=eq.${id}` : undefined,
    enabled: Boolean(id),
    onChange: () => {
      getEventShareCount(id)
        .then(setShareCount)
        .catch(() => {});
    },
  });

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
  const isMultiDay =
    es_multidia || (fecha_fin && fecha_fin !== fecha_evento && !es_recurrente);

  // Determinar si es evento recurrente
  const isRecurring = es_recurrente && cantidad_repeticiones > 1;
  const publicationDayLabel = getPublicationDayLabel(publication);
  const pluralizeWeekday = (dayName) =>
    dayName?.endsWith("s") ? dayName : `${dayName}s`;

  // Obtener texto inteligente de recurrencia
  const getRecurrenciaText = () => {
    if (!fechas_recurrencia || fechas_recurrencia.length === 0) {
      // Fallback al campo dia_recurrencia
      if (dia_recurrencia) {
        const cap =
          dia_recurrencia.charAt(0).toUpperCase() + dia_recurrencia.slice(1);
        return `${cantidad_repeticiones} ${pluralizeWeekday(cap)}`;
      }
      return null;
    }

    // Detectar los días de la semana únicos de las fechas
    const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const diasNombres = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];
    const fechasOrdenadas = [...fechas_recurrencia]
      .filter(Boolean)
      .sort((a, b) => new Date(a + "T00:00:00") - new Date(b + "T00:00:00"));

    const diasUnicos = [
      ...new Set(
        fechasOrdenadas.map((f) => new Date(f + "T00:00:00").getDay()),
      ),
    ];

    if (diasUnicos.length === 1) {
      // Todas las fechas caen en el mismo día
      return `${fechas_recurrencia.length} ${pluralizeWeekday(diasNombres[diasUnicos[0]])}`;
    }

    // Días variados: respetar el orden cronológico de las fechas seleccionadas
    const diasTexto = diasUnicos.map((d) => diasSemana[d]);

    if (diasTexto.length <= 3) {
      return diasTexto.join(", ");
    }
    return `${fechas_recurrencia.length} fechas`;
  };

  const recurrenciaText = isRecurring ? getRecurrenciaText() : null;

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

  // Formatear fecha (con soporte para rango y recurrencia)
  const getFormattedDate = () => {
    if (!fecha_evento) return null;

    const formatShort = (fecha) => {
      return new Date(fecha + "T00:00:00").toLocaleDateString("es-CL", {
        day: "numeric",
        month: "short",
      });
    };

    if (isRecurring && fechas_recurrencia?.length > 0) {
      const primera = formatShort(fechas_recurrencia[0]);
      const ultima = formatShort(
        fechas_recurrencia[fechas_recurrencia.length - 1],
      );
      return `${primera} - ${ultima}`;
    }

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
    if (tipo_entrada === "sin_entrada") {
      return "Pronto más información";
    }
    if (tipo_entrada === "info_descripcion") {
      return "Info en Descripción";
    }
    if (
      tipo_entrada === "gratis" ||
      tipo_entrada === "gratuito" ||
      (!precio && tipo_entrada !== "pagada")
    ) {
      return "Gratis";
    }
    if (precio) {
      return `$${precio.toLocaleString("es-CL")}`;
    }
    return null;
  };

  const handleClick = () => {
    if (showAuthModal) return;
    if (onClick) onClick(publication);
  };

  // Manejar toggle de favorito
  const handleFavoriteClick = async (e) => {
    e.stopPropagation(); // Evitar que se abra el modal

    if (!user) {
      // Abrir modal de login
      setShowAuthModal(true);
      return;
    }

    if (isTogglingFavorite) return;

    setIsTogglingFavorite(true);
    try {
      const result = await toggleFavorite(user.id, id);
      setIsFavorited(result.isFavorite);
      setFavoriteCount((prev) =>
        result.isFavorite ? prev + 1 : Math.max(0, prev - 1),
      );

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
      setShowAuthModal(true);
      return;
    }
    if (isTogglingLike) return;

    setIsTogglingLike(true);
    try {
      const result = await toggleLike(user.id, id);
      setIsLiked(result.isLiked);
      setLikeCount(result.count);
      // Notificar al grid (si maneja batched state) para actualizar el mapa.
      if (onLikeChange) {
        onLikeChange(id, result);
      }
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
    <article
      id={`publication-card-${id}`}
      className="publication-card"
      onClick={handleClick}>
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
          <div className="publication-card__badges">
            <span className="publication-card__category">
              {categories?.nombre || "Sin categoría"}
            </span>
            {publicationDayLabel && (
              <span className="publication-card__day-badge">
                <FontAwesomeIcon icon={faCalendarDay} />
                {publicationDayLabel}
              </span>
            )}
          </div>
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
        <div className="publication-card__location-row">
          <div className="publication-card__location">
            <FontAwesomeIcon icon={faMapMarkerAlt} />
            <span>{comuna}</span>
          </div>
          <button
            type="button"
            className="publication-card__ver-mas"
            onClick={onClick}
            aria-label="Ver más detalles">
            Ver más
          </button>
        </div>
        <h3 className="publication-card__title">{titulo}</h3>

        {organizador && (
          <div className="publication-card__organizer">
            <FontAwesomeIcon icon={faUser} />
            <span>{organizador}</span>
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
          {/* Badge de recurrencia */}
          {isRecurring && recurrenciaText && (
            <span className="publication-card__recurrence">
              <FontAwesomeIcon icon={faRepeat} />
              {recurrenciaText}
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
            className={`publication-card__action-btn publication-card__action-btn--fire ${isLiked ? "publication-card__action-btn--fire-active" : ""}`}
            onClick={handleLikeClick}
            disabled={isTogglingLike}
            aria-label={isLiked ? "Quitar imperdible" : "Imperdible"}>
            <FontAwesomeIcon icon={faFire} />
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>
          <button
            className={`publication-card__action-btn ${isFavorited ? "publication-card__action-btn--active" : ""}`}
            onClick={handleFavoriteClick}
            disabled={isTogglingFavorite}
            aria-label={isFavorited ? "Quitar de guardados" : "Guardar"}>
            <FontAwesomeIcon
              icon={isFavorited ? faBookmarkSolid : faBookmarkRegular}
            />
            {favoriteCount > 0 && <span>{favoriteCount}</span>}
          </button>
          <button
            type="button"
            className="publication-card__action-btn publication-card__action-btn--share"
            onClick={async (e) => {
              e.stopPropagation();
              // URL directa a og.php: bots reciben OG tags con imagen real,
              // usuarios son redirigidos instantáneamente a la app React.
              const shareUrl = `${window.location.origin}/og.php?type=event&highlight=${encodeURIComponent(id)}`;
              if (navigator.share) {
                try {
                  await navigator.share({ title: titulo, url: shareUrl });
                  // Solo contar si el usuario completó el share (no canceló)
                  incrementShareCount(id);
                  setShareCount((prev) => prev + 1);
                } catch (err) {
                  // AbortError = usuario canceló el share sheet → no contar
                  if (err?.name !== "AbortError") {
                    console.warn("Share fallido:", err);
                  }
                }
              } else {
                navigator.clipboard.writeText(shareUrl);
                incrementShareCount(id);
                setShareCount((prev) => prev + 1);
              }
            }}
            aria-label="Compartir publicación">
            <FontAwesomeIcon icon={faShareAlt} />
            {shareCount > 0 && <span>{shareCount}</span>}
          </button>
        </div>
      </div>
      {showAuthModal &&
        createPortal(
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
          />,
          document.body,
        )}
    </article>
  );
}
