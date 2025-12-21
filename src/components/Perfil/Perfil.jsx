import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faEnvelope,
  faCalendarAlt,
  faEdit,
  faSignOutAlt,
  faPlus,
  faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons";
import Footer from "../Home/Footer";
import "./styles/perfil.css";

// Datos de ejemplo para publicaciones del usuario
const MOCK_USER_PUBLICATIONS = [
  {
    id: 1,
    titulo: "Festival de Música Indie",
    imagen: "/img/Home1.png",
    categoria: "Música",
    fecha: "15 Diciembre 2025",
    ciudad: "Talca",
    estado: "activo",
  },
  {
    id: 2,
    titulo: "Taller de Fotografía",
    imagen: "/img/Home2.png",
    categoria: "Arte y Cultura",
    fecha: "20 Diciembre 2025",
    ciudad: "Curicó",
    estado: "activo",
  },
];

export default function Perfil() {
  const { user, signOut, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("publicaciones");
  const [userPublications, setUserPublications] = useState([]);

  useEffect(() => {
    // Redirigir si no está autenticado
    if (!loading && !isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    // Cargar publicaciones del usuario (mock por ahora)
    if (isAuthenticated) {
      setUserPublications(MOCK_USER_PUBLICATIONS);
    }
  }, [isAuthenticated]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="perfil-loading">
        <div className="perfil-loading__spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Obtener datos del usuario de Google
  const userAvatar =
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    "/img/default-avatar.png";
  const userName =
    user.user_metadata?.full_name || user.user_metadata?.name || "Usuario";
  const userEmail = user.email;
  const createdAt = new Date(user.created_at).toLocaleDateString("es-CL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="perfil-page">
      {/* Header del perfil */}
      <header className="perfil-header">
        <div className="perfil-header__background"></div>
        <div className="perfil-header__content">
          <div className="perfil-header__avatar-wrapper">
            <img
              src={userAvatar}
              alt={userName}
              className="perfil-header__avatar"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="perfil-header__info">
            <h1 className="perfil-header__name">{userName}</h1>
            <p className="perfil-header__email">
              <FontAwesomeIcon icon={faEnvelope} />
              {userEmail}
            </p>
            <p className="perfil-header__date">
              <FontAwesomeIcon icon={faCalendarAlt} />
              Miembro desde {createdAt}
            </p>
          </div>
          <div className="perfil-header__actions">
            <button className="perfil-header__btn perfil-header__btn--edit">
              <FontAwesomeIcon icon={faEdit} />
              Editar Perfil
            </button>
            <button
              className="perfil-header__btn perfil-header__btn--logout"
              onClick={handleSignOut}>
              <FontAwesomeIcon icon={faSignOutAlt} />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Estadísticas */}
      <section className="perfil-stats">
        <div className="perfil-stats__item">
          <span className="perfil-stats__number">
            {userPublications.length}
          </span>
          <span className="perfil-stats__label">Publicaciones</span>
        </div>
        <div className="perfil-stats__item">
          <span className="perfil-stats__number">0</span>
          <span className="perfil-stats__label">Favoritos</span>
        </div>
        <div className="perfil-stats__item">
          <span className="perfil-stats__number">0</span>
          <span className="perfil-stats__label">Seguidores</span>
        </div>
      </section>

      {/* Tabs */}
      <div className="perfil-tabs">
        <button
          className={`perfil-tabs__btn ${
            activeTab === "publicaciones" ? "active" : ""
          }`}
          onClick={() => setActiveTab("publicaciones")}>
          Mis Publicaciones
        </button>
        <button
          className={`perfil-tabs__btn ${
            activeTab === "favoritos" ? "active" : ""
          }`}
          onClick={() => setActiveTab("favoritos")}>
          Favoritos
        </button>
        <button
          className={`perfil-tabs__btn ${
            activeTab === "configuracion" ? "active" : ""
          }`}
          onClick={() => setActiveTab("configuracion")}>
          Configuración
        </button>
      </div>

      {/* Contenido de tabs */}
      <section className="perfil-content">
        {activeTab === "publicaciones" && (
          <div className="perfil-publications">
            <div className="perfil-publications__header">
              <h2>Mis Publicaciones</h2>
              <button
                className="perfil-publications__add-btn"
                onClick={() => navigate("/publicar-panorama")}>
                <FontAwesomeIcon icon={faPlus} />
                Nueva Publicación
              </button>
            </div>

            {userPublications.length === 0 ? (
              <div className="perfil-publications__empty">
                <FontAwesomeIcon icon={faUser} />
                <h3>No tienes publicaciones aún</h3>
                <p>
                  ¡Crea tu primera publicación y compártela con la comunidad!
                </p>
                <button onClick={() => navigate("/publicar-panorama")}>
                  Crear Publicación
                </button>
              </div>
            ) : (
              <div className="perfil-publications__grid">
                {userPublications.map((pub) => (
                  <article key={pub.id} className="perfil-publication-card">
                    <div className="perfil-publication-card__image">
                      <img src={pub.imagen} alt={pub.titulo} />
                      <span
                        className={`perfil-publication-card__status ${pub.estado}`}>
                        {pub.estado}
                      </span>
                    </div>
                    <div className="perfil-publication-card__content">
                      <span className="perfil-publication-card__category">
                        {pub.categoria}
                      </span>
                      <h3 className="perfil-publication-card__title">
                        {pub.titulo}
                      </h3>
                      <p className="perfil-publication-card__info">
                        <FontAwesomeIcon icon={faMapMarkerAlt} />
                        {pub.ciudad} • {pub.fecha}
                      </p>
                      <div className="perfil-publication-card__actions">
                        <button className="perfil-publication-card__btn">
                          <FontAwesomeIcon icon={faEdit} />
                          Editar
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "favoritos" && (
          <div className="perfil-favorites">
            <div className="perfil-favorites__empty">
              <h3>No tienes favoritos aún</h3>
              <p>
                Explora la Superguía y guarda tus eventos y negocios favoritos
              </p>
              <button onClick={() => navigate("/superguia")}>
                Explorar Superguía
              </button>
            </div>
          </div>
        )}

        {activeTab === "configuracion" && (
          <div className="perfil-settings">
            <h2>Configuración de la cuenta</h2>
            <div className="perfil-settings__section">
              <h3>Información Personal</h3>
              <div className="perfil-settings__field">
                <label>Nombre</label>
                <input type="text" value={userName} disabled />
              </div>
              <div className="perfil-settings__field">
                <label>Correo electrónico</label>
                <input type="email" value={userEmail} disabled />
              </div>
              <p className="perfil-settings__note">
                Los datos de tu cuenta están vinculados a tu cuenta de Google
              </p>
            </div>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
