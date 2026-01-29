import { useNavigate } from "react-router-dom";
import "./styles/EmptyPanoramas.css";

/**
 * Componente para mostrar cuando no hay panoramas disponibles
 * @param {Function} onClearFilters - Función para limpiar filtros
 * @param {boolean} hasFilters - Si hay filtros activos
 */
export default function EmptyPanoramas({ onClearFilters, hasFilters = false }) {
  const navigate = useNavigate();

  return (
    <div className="empty-panoramas">
      <div className="empty-panoramas__content">
        {/* Imagen/Logo */}
        <div className="empty-panoramas__image">
          <img
            src="/img/P_Extro.png"
            alt="Sin panoramas"
            className="empty-panoramas__logo"
          />
        </div>

        {/* Texto principal */}
        <h2 className="empty-panoramas__title">
          UPS.... AUN NO SE PUBLICA
          <br />
          UN PANORAMA
        </h2>

        {/* Subtítulo */}
        <p className="empty-panoramas__subtitle">
          {hasFilters
            ? "TE INVITAMOS A SEGUIR TU BÚSQUEDA EN OTRA CATEGORÍA"
            : "TE INVITAMOS A EXPLORAR OTRAS OPCIONES"}
        </p>

        {/* CTA */}
        <h3 className="empty-panoramas__cta-text">
          PUBLICA AHORA TU PANORAMA, ACTIVIDAD O EVENTO Y SE PARTE DE
          EXTROVERTIDOS
        </h3>

        {/* Botones */}
        <div className="empty-panoramas__actions">
          {hasFilters && (
            <button
              className="empty-panoramas__btn empty-panoramas__btn--secondary"
              onClick={onClearFilters}>
              Limpiar filtros
            </button>
          )}
          <button
            className="empty-panoramas__btn empty-panoramas__btn--primary"
            onClick={() => navigate("/publicar-panorama")}>
            Publicar Panorama
          </button>
        </div>

        {/* Logo decorativo inferior */}
        <div className="empty-panoramas__footer-logo">
          <img src="/img/P_Extro.png" alt="" />
        </div>
      </div>
    </div>
  );
}
