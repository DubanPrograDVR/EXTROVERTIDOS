import "./styles/stats.css";

export default function PerfilStats({ publicationsCount, unreadCount }) {
  return (
    <section className="perfil-stats">
      <div className="perfil-stats__item">
        <span className="perfil-stats__number">{publicationsCount}</span>
        <span className="perfil-stats__label">Publicaciones</span>
      </div>
      <div className="perfil-stats__item">
        <span className="perfil-stats__number">{unreadCount}</span>
        <span className="perfil-stats__label">Notificaciones</span>
      </div>
      <div className="perfil-stats__item">
        <span className="perfil-stats__number">0</span>
        <span className="perfil-stats__label">Favoritos</span>
      </div>
    </section>
  );
}
