import "./styles/PublicationCard.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapMarkerAlt, faUser } from "@fortawesome/free-solid-svg-icons";

export default function PublicationCard({ publication, onClick }) {
  const {
    titulo,
    imagen_url,
    comuna,
    provincia,
    categories,
    fecha_evento,
    profiles,
  } = publication;

  // Imagen de placeholder si no hay imagen
  const imageUrl = imagen_url || "/img/placeholder.jpg";

  // Formatear fecha
  const formattedDate = fecha_evento
    ? new Date(fecha_evento).toLocaleDateString("es-CL", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const handleClick = () => {
    if (onClick) onClick(publication);
  };

  return (
    <article className="publication-card" onClick={handleClick}>
      <div className="publication-card__image-container">
        <img
          src={imageUrl}
          alt={titulo}
          className="publication-card__image"
          loading="lazy"
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
        {formattedDate && (
          <p className="publication-card__date">{formattedDate}</p>
        )}

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
