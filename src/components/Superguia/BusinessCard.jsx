import { useState, useEffect } from "react";
import "./styles/BusinessCard.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMapMarkerAlt,
  faPhone,
  faGlobe,
  faChevronLeft,
  faChevronRight,
  faClock,
  faCheckCircle,
  faLayerGroup,
  faHeart as faHeartSolid,
  faBookmark as faBookmarkSolid,
  faThumbsUp as faThumbsUpSolid,
} from "@fortawesome/free-solid-svg-icons";
import {
  faHeart as faHeartRegular,
  faBookmark as faBookmarkRegular,
  faThumbsUp as faThumbsUpRegular,
} from "@fortawesome/free-regular-svg-icons";
import {
  faWhatsapp,
  faInstagram,
  faFacebook,
} from "@fortawesome/free-brands-svg-icons";
import { BUSINESS_CATEGORIES } from "./businessCategories";
import { useAuth } from "../../context/AuthContext";
import {
  toggleBusinessLike,
  hasUserLikedBusiness,
  getBusinessLikesCount,
  toggleBusinessFavorite,
} from "../../lib/database";

// Imagen placeholder por defecto
const PLACEHOLDER_IMAGE = "/img/Home1.png";

export default function BusinessCard({
  business,
  onClick,
  isFavorite: initialIsFavorite = false,
  onFavoriteChange,
}) {
  const {
    id,
    nombre,
    descripcion,
    slogan,
    imagen_url,
    logo_url,
    imagen_portada_url,
    galeria,
    imagenes,
    comuna,
    provincia,
    direccion,
    categoria,
    subcategoria,
    telefono,
    whatsapp,
    redes_sociales,
    instagram,
    facebook,
    sitio_web,
    horarios,
    verificado,
    profiles,
  } = business;

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
    const loadInteractions = async () => {
      try {
        const count = await getBusinessLikesCount(id);
        setLikeCount(count);

        if (user) {
          const liked = await hasUserLikedBusiness(user.id, id);
          setIsLiked(liked);
        }
      } catch (error) {
        console.error("Error cargando interacciones de negocio:", error);
      }
    };

    if (id) loadInteractions();
  }, [id, user]);

  // Obtener array de imágenes válidas
  const getValidImages = () => {
    // Prioridad: galeria > imagenes > imagen_portada_url > imagen_url > logo_url
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

  // Obtener la imagen actual
  const getCurrentImageUrl = () => {
    if (imageError) return PLACEHOLDER_IMAGE;
    return validImages[currentImageIndex] || PLACEHOLDER_IMAGE;
  };

  const imageUrl = getCurrentImageUrl();

  // Handler para errores de carga de imagen
  const handleImageError = () => {
    console.warn(`Error cargando imagen para: ${nombre}`);
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

  // Obtener horario de hoy
  const getHorarioHoy = () => {
    if (!horarios || typeof horarios !== "object") return null;

    if (horarios.abierto_24h) return "Abierto 24h";

    const dayIndex = new Date().getDay();
    // Todas las variantes posibles del nombre del día (con/sin acento, capitalizado/min)
    const diasVariantes = [
      ["Domingo", "domingo"],
      ["Lunes", "lunes"],
      ["Martes", "martes"],
      ["Miércoles", "miércoles", "Miercoles", "miercoles"],
      ["Jueves", "jueves"],
      ["Viernes", "viernes"],
      ["Sábado", "sábado", "Sabado", "sabado"],
    ];
    const variantes = diasVariantes[dayIndex];
    // Buscar la primera clave que coincida con cualquier variante
    const horarioHoy = variantes.reduce(
      (found, v) => found || horarios[v],
      null,
    );

    if (!horarioHoy) return "Cerrado hoy";

    // Formato array de turnos [{apertura, cierre}]
    if (Array.isArray(horarioHoy) && horarioHoy.length > 0) {
      const turno = horarioHoy[0];
      if (turno.apertura && turno.cierre) {
        return `${turno.apertura} - ${turno.cierre}`;
      }
    }

    if (horarioHoy.cerrado) return "Cerrado hoy";
    if (horarioHoy.apertura && horarioHoy.cierre) {
      return `${horarioHoy.apertura} - ${horarioHoy.cierre}`;
    }
    return null;
  };

  const horarioHoy = getHorarioHoy();
  const isOpen = horarioHoy && horarioHoy !== "Cerrado hoy";

  // Resolver WhatsApp (puede venir de campo directo o de redes_sociales)
  const resolvedWhatsapp = whatsapp || redes_sociales?.whatsapp || null;
  const resolvedInstagram = instagram || redes_sociales?.instagram || null;
  const resolvedFacebook = facebook || redes_sociales?.facebook || null;

  // Obtener info de categoría desde archivo local (por nombre)
  const localCategory = categoria
    ? BUSINESS_CATEGORIES.find(
        (c) => c.nombre.toLowerCase() === categoria.toLowerCase(),
      )
    : null;

  // Manejar click en la card
  const handleCardClick = () => {
    if (onClick) {
      onClick(business);
    }
  };

  // Manejar click en redes sociales (evitar propagación)
  const handleSocialClick = (e, url) => {
    e.stopPropagation();
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleWhatsAppClick = (e) => {
    e.stopPropagation();
    if (resolvedWhatsapp) {
      const cleanNumber = resolvedWhatsapp.replace(/\D/g, "");
      window.open(
        `https://wa.me/${cleanNumber}`,
        "_blank",
        "noopener,noreferrer",
      );
    }
  };

  // Toggle favorito (corazón)
  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    if (!user) {
      showToast?.("Inicia sesión para guardar favoritos", "warning");
      return;
    }
    if (isTogglingFavorite) return;

    setIsTogglingFavorite(true);
    try {
      const result = await toggleBusinessFavorite(user.id, id);
      setIsFavorited(result.isFavorite);
      if (onFavoriteChange) onFavoriteChange(id, result.isFavorite);
    } catch (error) {
      console.error("Error al cambiar favorito:", error);
      showToast?.("Error al procesar favorito", "error");
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  // Toggle like
  const handleLikeClick = async (e) => {
    e.stopPropagation();
    if (!user) {
      showToast?.("Inicia sesión para dar me gusta", "warning");
      return;
    }
    if (isTogglingLike) return;

    setIsTogglingLike(true);
    try {
      const result = await toggleBusinessLike(user.id, id);
      setIsLiked(result.isLiked);
      setLikeCount(result.count);
    } catch (error) {
      console.error("Error al cambiar like:", error);
      showToast?.("Error al procesar tu like", "error");
    } finally {
      setIsTogglingLike(false);
    }
  };

  return (
    <article className="business-card" onClick={handleCardClick}>
      {/* Imagen con carrusel */}
      <div className="business-card__image-container">
        <img
          src={imageUrl}
          alt={nombre}
          className="business-card__image"
          onError={handleImageError}
          loading="lazy"
        />

        {/* Navegación del carrusel */}
        {hasMultipleImages && (
          <>
            <button
              className="business-card__nav business-card__nav--prev"
              onClick={handlePrevImage}
              aria-label="Imagen anterior">
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <button
              className="business-card__nav business-card__nav--next"
              onClick={handleNextImage}
              aria-label="Siguiente imagen">
              <FontAwesomeIcon icon={faChevronRight} />
            </button>

            {/* Indicadores */}
            <div className="business-card__indicators">
              {validImages.map((_, index) => (
                <span
                  key={index}
                  className={`business-card__indicator ${
                    index === currentImageIndex ? "active" : ""
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Overlay con badges (gradiente superior) */}
        <div className="business-card__overlay">
          {/* Badge de categoría con icono local */}
          {localCategory ? (
            <span
              className="business-card__category"
              style={{
                backgroundColor: localCategory.color || "#ff6600",
              }}>
              {localCategory.icono && (
                <FontAwesomeIcon icon={localCategory.icono} />
              )}
              {localCategory.nombre}
            </span>
          ) : categoria ? (
            <span className="business-card__category">{categoria}</span>
          ) : (
            <span />
          )}

          {/* Badge verificado */}
          {verificado && (
            <span className="business-card__verified">
              <FontAwesomeIcon icon={faCheckCircle} />
              Verificado
            </span>
          )}

          {/* Botón de favorito (corazón) */}
          <button
            className={`business-card__favorite ${
              isFavorited ? "business-card__favorite--active" : ""
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

      {/* Contenido */}
      <div className="business-card__content">
        {/* Nombre y slogan */}
        <div className="business-card__header">
          <h3 className="business-card__title">{nombre}</h3>
          {slogan && <p className="business-card__slogan">{slogan}</p>}
        </div>

        {/* Subcategoría */}
        {subcategoria && (
          <div className="business-card__subcategory">
            <FontAwesomeIcon icon={faLayerGroup} />
            <span>{subcategoria}</span>
          </div>
        )}

        {/* Descripción breve */}
        {descripcion && (
          <p className="business-card__description">{descripcion}</p>
        )}

        {/* Info row: Ubicación + Horario */}
        <div className="business-card__info">
          {/* Ubicación */}
          <div className="business-card__location">
            <FontAwesomeIcon icon={faMapMarkerAlt} />
            <span>
              {comuna}
              {provincia && `, ${provincia}`}
            </span>
          </div>

          {/* Horario de hoy */}
          {horarioHoy && (
            <div
              className={`business-card__schedule ${isOpen ? "business-card__schedule--open" : "business-card__schedule--closed"}`}>
              <FontAwesomeIcon icon={faClock} />
              <span>{horarioHoy}</span>
            </div>
          )}
        </div>

        {/* Acciones rápidas */}
        <div className="business-card__actions">
          {telefono && (
            <a
              href={`tel:${telefono}`}
              className="business-card__action business-card__action--phone"
              onClick={(e) => e.stopPropagation()}
              title="Llamar">
              <FontAwesomeIcon icon={faPhone} />
            </a>
          )}

          {resolvedWhatsapp && (
            <button
              className="business-card__action business-card__action--whatsapp"
              onClick={handleWhatsAppClick}
              title="WhatsApp">
              <FontAwesomeIcon icon={faWhatsapp} />
            </button>
          )}

          {resolvedInstagram && (
            <button
              className="business-card__action business-card__action--instagram"
              onClick={(e) =>
                handleSocialClick(
                  e,
                  resolvedInstagram.startsWith("http")
                    ? resolvedInstagram
                    : `https://instagram.com/${resolvedInstagram.replace("@", "")}`,
                )
              }
              title="Instagram">
              <FontAwesomeIcon icon={faInstagram} />
            </button>
          )}

          {resolvedFacebook && (
            <button
              className="business-card__action business-card__action--facebook"
              onClick={(e) =>
                handleSocialClick(
                  e,
                  resolvedFacebook.startsWith("http")
                    ? resolvedFacebook
                    : `https://facebook.com/${resolvedFacebook}`,
                )
              }
              title="Facebook">
              <FontAwesomeIcon icon={faFacebook} />
            </button>
          )}

          {sitio_web && (
            <button
              className="business-card__action business-card__action--web"
              onClick={(e) => handleSocialClick(e, sitio_web)}
              title="Sitio web">
              <FontAwesomeIcon icon={faGlobe} />
            </button>
          )}
        </div>

        {/* Propietario */}
        {profiles?.nombre && (
          <div className="business-card__owner">
            {profiles.avatar_url ? (
              <img
                src={profiles.avatar_url}
                alt={profiles.nombre}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="business-card__owner-placeholder">
                {profiles.nombre.charAt(0).toUpperCase()}
              </div>
            )}
            <span>{profiles.nombre}</span>
          </div>
        )}

        {/* Botones Me gusta / Guardar */}
        <div className="business-card__interaction-buttons">
          <button
            className={`business-card__interaction-btn ${isLiked ? "business-card__interaction-btn--active" : ""}`}
            onClick={handleLikeClick}
            disabled={isTogglingLike}
            aria-label={isLiked ? "Quitar me gusta" : "Me gusta"}>
            <FontAwesomeIcon
              icon={isLiked ? faThumbsUpSolid : faThumbsUpRegular}
            />
            <span>{likeCount > 0 ? likeCount : "Me gusta"}</span>
          </button>
          <button
            className={`business-card__interaction-btn ${isFavorited ? "business-card__interaction-btn--active" : ""}`}
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
