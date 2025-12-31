import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faSpinner,
  faMapMarkerAlt,
  faNewspaper,
  faEye,
  faEdit,
} from "@fortawesome/free-solid-svg-icons";
import "./styles/section.css";
import "./styles/publicaciones.css";

export default function PerfilPublicaciones({ publications, loading }) {
  const navigate = useNavigate();

  return (
    <div className="perfil-section">
      <div className="perfil-section__header">
        <h2>Mis Publicaciones</h2>
        <button
          className="perfil-section__btn"
          onClick={() => navigate("/publicar-panorama")}>
          <FontAwesomeIcon icon={faPlus} />
          Nueva Publicación
        </button>
      </div>

      {loading ? (
        <div className="perfil-section__loading">
          <FontAwesomeIcon icon={faSpinner} spin />
          <p>Cargando publicaciones...</p>
        </div>
      ) : publications.length === 0 ? (
        <div className="perfil-section__empty">
          <FontAwesomeIcon icon={faNewspaper} />
          <h3>No tienes publicaciones aún</h3>
          <p>¡Crea tu primera publicación y compártela con la comunidad!</p>
          <button onClick={() => navigate("/publicar-panorama")}>
            Crear Publicación
          </button>
        </div>
      ) : (
        <div className="perfil-publications__grid">
          {publications.map((pub) => {
            // Obtener la primera imagen del array o usar placeholder
            const imageUrl =
              Array.isArray(pub.imagenes) && pub.imagenes.length > 0
                ? pub.imagenes[0]
                : "/img/Home1.png";

            return (
              <article key={pub.id} className="perfil-publication-card">
                <div className="perfil-publication-card__image">
                  <img
                    src={imageUrl}
                    alt={pub.titulo}
                    onError={(e) => {
                      e.target.src = "/img/Home1.png";
                    }}
                  />
                  <span
                    className={`perfil-publication-card__status ${
                      pub.estado || "activo"
                    }`}>
                    {pub.estado || "activo"}
                  </span>
                </div>
                <div className="perfil-publication-card__content">
                  <span className="perfil-publication-card__category">
                    {pub.categories?.nombre || "Sin categoría"}
                  </span>
                  <h3 className="perfil-publication-card__title">
                    {pub.titulo}
                  </h3>
                  <p className="perfil-publication-card__info">
                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                    {pub.comuna}, {pub.provincia} •{" "}
                    {new Date(pub.fecha_evento).toLocaleDateString("es-CL", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <div className="perfil-publication-card__actions">
                    <button className="perfil-publication-card__btn">
                      <FontAwesomeIcon icon={faEye} />
                      Ver
                    </button>
                    <button className="perfil-publication-card__btn">
                      <FontAwesomeIcon icon={faEdit} />
                      Editar
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
