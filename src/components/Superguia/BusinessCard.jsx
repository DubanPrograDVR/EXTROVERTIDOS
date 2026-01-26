import { useState } from "react";
import "./styles/BusinessCard.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMapMarkerAlt,
  faPhone,
  faGlobe,
  faStore,
  faChevronLeft,
  faChevronRight,
  faClock,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import {
  faWhatsapp,
  faInstagram,
  faFacebook,
} from "@fortawesome/free-brands-svg-icons";

// Imagen placeholder por defecto
const PLACEHOLDER_IMAGE = "/img/Home1.png";

export default function BusinessCard({ business, onClick }) {
  const {
    id,
    nombre,
    slogan,
    imagen_url,
    logo_url,
    imagen_portada_url,
    galeria,
    imagenes,
    comuna,
    provincia,
    direccion,
    categories,
    telefono,
    whatsapp,
    instagram,
    sitio_web,
    horarios,
    verificado,
    profiles,
  } = business;

  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

    const dias = [
      "domingo",
      "lunes",
      "martes",
      "miercoles",
      "jueves",
      "viernes",
      "sabado",
    ];
    const hoy = dias[new Date().getDay()];
    const horarioHoy = horarios[hoy];

    if (!horarioHoy || horarioHoy.cerrado) return "Cerrado hoy";
    if (horarioHoy.apertura && horarioHoy.cierre) {
      return `${horarioHoy.apertura} - ${horarioHoy.cierre}`;
    }
    return null;
  };

  const horarioHoy = getHorarioHoy();

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
    if (whatsapp) {
      const cleanNumber = whatsapp.replace(/\D/g, "");
      window.open(
        `https://wa.me/${cleanNumber}`,
        "_blank",
        "noopener,noreferrer",
      );
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

        {/* Badge de categoría */}
        {categories?.nombre && (
          <span
            className="business-card__category"
            style={{
              backgroundColor: categories.color || "#ff6600",
            }}>
            {categories.icono && <span>{categories.icono}</span>}
            {categories.nombre}
          </span>
        )}

        {/* Badge verificado */}
        {verificado && (
          <span className="business-card__verified">
            <FontAwesomeIcon icon={faCheckCircle} />
            Verificado
          </span>
        )}
      </div>

      {/* Contenido */}
      <div className="business-card__content">
        {/* Nombre y slogan */}
        <div className="business-card__header">
          <h3 className="business-card__title">{nombre}</h3>
          {slogan && <p className="business-card__slogan">{slogan}</p>}
        </div>

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
          <div className="business-card__schedule">
            <FontAwesomeIcon icon={faClock} />
            <span>{horarioHoy}</span>
          </div>
        )}

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

          {whatsapp && (
            <button
              className="business-card__action business-card__action--whatsapp"
              onClick={handleWhatsAppClick}
              title="WhatsApp">
              <FontAwesomeIcon icon={faWhatsapp} />
            </button>
          )}

          {instagram && (
            <button
              className="business-card__action business-card__action--instagram"
              onClick={(e) =>
                handleSocialClick(
                  e,
                  instagram.startsWith("http")
                    ? instagram
                    : `https://instagram.com/${instagram.replace("@", "")}`,
                )
              }
              title="Instagram">
              <FontAwesomeIcon icon={faInstagram} />
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
              <img src={profiles.avatar_url} alt={profiles.nombre} />
            ) : (
              <div className="business-card__owner-placeholder">
                <FontAwesomeIcon icon={faStore} />
              </div>
            )}
            <span>{profiles.nombre}</span>
          </div>
        )}
      </div>
    </article>
  );
}
