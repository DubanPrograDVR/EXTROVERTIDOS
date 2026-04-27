import "./styles/stats.css";

export default function PerfilStats({
  publicationsCount,
  notificationsCount = 0,
  favoritesCount = 0,
}) {
  return (
    <section className="perfil-stats">
      <div className="perfil-stats__item">
        <span className="perfil-stats__number">{publicationsCount}</span>
        <span className="perfil-stats__label">Publicaciones</span>
      </div>
      <div className="perfil-stats__item">
        <span className="perfil-stats__number">{notificationsCount}</span>
        <span className="perfil-stats__label">Notificaciones</span>
      </div>
      <div className="perfil-stats__item">
        <span className="perfil-stats__number">{favoritesCount}</span>
        <span className="perfil-stats__label">Favoritos</span>
      </div>
    </section>
  );
}
