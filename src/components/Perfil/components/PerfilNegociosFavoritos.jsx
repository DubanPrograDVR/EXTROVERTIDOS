import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStore,
  faTrash,
  faMapMarkerAlt,
  faSpinner,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../../context/AuthContext";
import {
  getUserBusinessFavorites,
  toggleBusinessFavorite,
} from "../../../lib/database";
import BusinessModal from "../../Superguia/BusinessModal";
import "./styles/section.css";
import "./styles/favoritos.css";

export default function PerfilNegociosFavoritos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [viewModal, setViewModal] = useState({ open: false, business: null });

  useEffect(() => {
    const loadFavorites = async () => {
      if (!user) return;
      try {
        const data = await getUserBusinessFavorites(user.id);
        setFavorites(data);
      } catch (error) {
        console.error("Error cargando negocios favoritos:", error);
      } finally {
        setLoading(false);
      }
    };
    loadFavorites();
  }, [user]);

  const handleRemoveFavorite = async (businessId) => {
    if (!user || removingId) return;
    setRemovingId(businessId);
    try {
      await toggleBusinessFavorite(user.id, businessId);
      setFavorites((prev) => prev.filter((b) => b.id !== businessId));
    } catch (error) {
      console.error("Error eliminando favorito:", error);
    } finally {
      setRemovingId(null);
    }
  };

  const getBusinessImage = (business) => {
    if (business.imagen_portada_url) return business.imagen_portada_url;
    if (business.imagen_url) return business.imagen_url;
    if (business.logo_url) return business.logo_url;
    if (Array.isArray(business.galeria) && business.galeria.length > 0)
      return business.galeria[0];
    if (Array.isArray(business.imagenes) && business.imagenes.length > 0)
      return business.imagenes[0];
    return "/img/Home1.png";
  };

  if (loading) {
    return (
      <div className="perfil-section">
        <div className="perfil-section__header">
          <h2>Negocios Guardados</h2>
        </div>
        <div className="perfil-section__loading">
          <FontAwesomeIcon icon={faSpinner} spin />
          <p>Cargando negocios guardados...</p>
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="perfil-section">
        <div className="perfil-section__header">
          <h2>Negocios Guardados</h2>
        </div>
        <div className="perfil-section__empty">
          <FontAwesomeIcon icon={faStore} />
          <h3>No tienes negocios guardados</h3>
          <p>Explora la Superguía y guarda los negocios que te interesen</p>
          <button onClick={() => navigate("/superguia")}>
            Explorar Superguía
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="perfil-section">
      <div className="perfil-section__header">
        <h2>Negocios Guardados</h2>
        <span className="perfil-section__count">
          {favorites.length} guardados
        </span>
      </div>

      <div className="favoritos-grid">
        {favorites.map((business) => (
          <article key={business.id} className="favorito-card">
            <div className="favorito-card__image">
              <img
                src={getBusinessImage(business)}
                alt={business.nombre}
                onError={(e) => {
                  e.target.src = "/img/Home1.png";
                }}
              />
              <span className="favorito-card__category">
                {business.categoria || "Negocio"}
              </span>
            </div>

            <div className="favorito-card__content">
              <h3 className="favorito-card__title">{business.nombre}</h3>
              {business.slogan && (
                <p
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "0.8rem",
                    margin: "0 0 8px",
                    fontStyle: "italic",
                  }}>
                  {business.slogan}
                </p>
              )}
              <p className="favorito-card__info">
                <FontAwesomeIcon icon={faMapMarkerAlt} />
                {business.comuna || "Sin ubicación"}
                {business.provincia ? `, ${business.provincia}` : ""}
              </p>
              <div className="favorito-card__actions">
                <button
                  className="favorito-card__btn"
                  onClick={() => setViewModal({ open: true, business })}>
                  <FontAwesomeIcon icon={faEye} /> Ver
                </button>
                <button
                  className="favorito-card__btn favorito-card__btn--delete"
                  onClick={() => handleRemoveFavorite(business.id)}
                  disabled={removingId === business.id}>
                  <FontAwesomeIcon
                    icon={removingId === business.id ? faSpinner : faTrash}
                    spin={removingId === business.id}
                  />
                  {removingId === business.id ? "..." : "Eliminar"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <BusinessModal
        business={viewModal.business}
        isOpen={viewModal.open}
        onClose={() => setViewModal({ open: false, business: null })}
      />
    </div>
  );
}
