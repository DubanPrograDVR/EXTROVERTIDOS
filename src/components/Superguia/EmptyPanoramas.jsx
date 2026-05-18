import { useNavigate } from "react-router-dom";
import "./styles/EmptyPanoramas.css";

/**
 * Componente para mostrar cuando no hay panoramas disponibles
 * @param {Function} onClearFilters - Función para limpiar filtros
 * @param {boolean} hasFilters - Si hay filtros activos
 * @param {Function} onPublishClick - Acción del botón publicar
 */
export default function EmptyPanoramas({
  onClearFilters,
  hasFilters = false,
  onPublishClick,
}) {
  const navigate = useNavigate();

  const handlePublishClick = () => {
    if (onPublishClick) {
      onPublishClick();
      return;
    }

    navigate("/publicar-panorama");
  };

  return (
    <div className="empty-panoramas">
      <div className="empty-panoramas__content">
        {/* Imagen/Logo */}
        <div className="empty-panoramas__image">
          <img
            src="/img/P_Extro_v2.png"
            alt="Sin panoramas"
            className="empty-panoramas__logo"
          />
        </div>

        {/* Texto principal */}
        <h2 className="empty-panoramas__title">
          Ups.... Aún no se publica
          <br />
          un panorama
        </h2>

        {/* Subtítulo */}
        <p className="empty-panoramas__subtitle">
          {hasFilters
            ? "Te invitamos a seguir tu búsqueda en otra categoría"
            : "Te invitamos a explorar otras opciones"}
        </p>

        {/* CTA */}
        <h3 className="empty-panoramas__cta-text">
          Publica ahora tu panorama, actividad o evento y sé parte de
          Extrovertidos
        </h3>

        {/* Logo decorativo sobre acciones */}
        <div className="empty-panoramas__footer-logo">
          <img src="/img/Logo_con_r_v2.png" alt="Extrovertidos" />
        </div>

        {/* Botones */}
        <div className="empty-panoramas__actions">
          {hasFilters && (
            <button
              className="empty-panoramas__btn empty-panoramas__btn--secondary"
              onClick={onClearFilters}>
              Ver todos
            </button>
          )}
          <button
            className="empty-panoramas__btn empty-panoramas__btn--primary"
            onClick={handlePublishClick}>
            Publicar Panorama
          </button>
        </div>
      </div>
    </div>
  );
}
