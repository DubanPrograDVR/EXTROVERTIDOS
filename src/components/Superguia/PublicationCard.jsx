import "./styles/PublicationCard.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";

export default function PublicationCard({ publication }) {
  const { titulo, imagen, ciudad, categoria, fecha } = publication;

  // Imagen de placeholder si no hay imagen
  const imageUrl = imagen || "/img/placeholder.jpg";

  return (
    <article className="publication-card">
      <div className="publication-card__image-container">
        <img
          src={imageUrl}
          alt={titulo}
          className="publication-card__image"
          loading="lazy"
        />
        <div className="publication-card__overlay">
          <span className="publication-card__category">{categoria}</span>
        </div>
      </div>

      <div className="publication-card__content">
        <div className="publication-card__location">
          <FontAwesomeIcon icon={faMapMarkerAlt} />
          <span>{ciudad}</span>
        </div>
        <h3 className="publication-card__title">{titulo}</h3>
        {fecha && <p className="publication-card__date">{fecha}</p>}
      </div>
    </article>
  );
}
