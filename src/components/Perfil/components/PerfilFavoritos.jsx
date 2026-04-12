import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart,
  faTrash,
  faMapMarkerAlt,
  faSpinner,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../../context/AuthContext";
import { getUserFavorites, removeFavorite } from "../../../lib/database";
import PublicationModal from "../../Superguia/PublicationModal";
import "./styles/section.css";
import "./styles/favoritos.css";

export default function PerfilFavoritos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [viewModal, setViewModal] = useState({ open: false, event: null });

  // Cargar favoritos al montar
  useEffect(() => {
    const loadFavorites = async () => {
      if (!user) return;

      try {
        const data = await getUserFavorites(user.id);
        // Filtrar eventos cuya fecha ya pasó
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const active = data.filter((event) => {
          const endDate = new Date(
            (event.fecha_fin || event.fecha_evento) + "T23:59:59",
          );
          return endDate >= today;
        });
        setFavorites(active);
      } catch (error) {
        console.error("Error cargando favoritos:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [user]);

  // Eliminar favorito
  const handleRemoveFavorite = async (eventId) => {
    if (!user || removingId) return;

    setRemovingId(eventId);
    try {
      await removeFavorite(user.id, eventId);
      setFavorites((prev) => prev.filter((fav) => fav.id !== eventId));
    } catch (error) {
      console.error("Error eliminando favorito:", error);
    } finally {
      setRemovingId(null);
    }
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("es-CL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Formatear hora
  const formatTime = (timeString) => {
    if (!timeString) return null;
    const parts = timeString.split(":");
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return timeString;
  };

  if (loading) {
    return (
      <div className="perfil-section">
        <div className="perfil-section__header">
          <h2>Mis Favoritos</h2>
        </div>
        <div className="perfil-section__loading">
          <FontAwesomeIcon icon={faSpinner} spin />
          <p>Cargando favoritos...</p>
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="perfil-section">
        <div className="perfil-section__header">
          <h2>Mis Favoritos</h2>
        </div>
        <div className="perfil-section__empty">
          <FontAwesomeIcon icon={faHeart} />
          <h3>No tienes favoritos aún</h3>
          <p>Explora la Superguía y guarda tus eventos y negocios favoritos</p>
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
        <h2>Mis Favoritos</h2>
        <span className="perfil-section__count">
          {favorites.length} guardados
        </span>
      </div>

      <div className="favoritos-grid">
        {favorites.map((event) => (
          <article key={event.id} className="favorito-card">
            {/* Imagen */}
            <div className="favorito-card__image">
              <img
                src={
                  Array.isArray(event.imagenes) && event.imagenes.length > 0
                    ? event.imagenes[0]
                    : "/img/Home1.png"
                }
                alt={event.titulo}
                onError={(e) => {
                  e.target.src = "/img/Home1.png";
                }}
              />
              <span className="favorito-card__category">
                {event.categories?.nombre || "Evento"}
              </span>
            </div>

            {/* Contenido */}
            <div className="favorito-card__content">
              <h3 className="favorito-card__title">{event.titulo}</h3>
              <p className="favorito-card__info">
                <FontAwesomeIcon icon={faMapMarkerAlt} />
                {event.comuna}
                {event.provincia ? `, ${event.provincia}` : ""}
                {event.fecha_evento
                  ? ` • ${formatDate(event.fecha_evento)}`
                  : ""}
              </p>
              <div className="favorito-card__actions">
                <button
                  className="favorito-card__btn"
                  onClick={() => setViewModal({ open: true, event })}>
                  <FontAwesomeIcon icon={faEye} /> Ver
                </button>
                <button
                  className="favorito-card__btn favorito-card__btn--delete"
                  onClick={() => handleRemoveFavorite(event.id)}
                  disabled={removingId === event.id}>
                  <FontAwesomeIcon
                    icon={removingId === event.id ? faSpinner : faTrash}
                    spin={removingId === event.id}
                  />
                  {removingId === event.id ? "..." : "Eliminar"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <PublicationModal
        publication={viewModal.event}
        isOpen={viewModal.open}
        onClose={() => setViewModal({ open: false, event: null })}
      />
    </div>
  );
}
