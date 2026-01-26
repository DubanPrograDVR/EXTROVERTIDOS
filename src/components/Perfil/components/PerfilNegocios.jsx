import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faStore,
  faSpinner,
  faClock,
  faCheckCircle,
  faTimesCircle,
  faMapMarkerAlt,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../../context/AuthContext";
import { getBusinessesByUser } from "../../../lib/database";
import "./styles/section.css";

export default function PerfilNegocios() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadBusinesses = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getBusinessesByUser(user.id);
        setBusinesses(data || []);
      } catch (err) {
        console.error("Error cargando negocios:", err);
        setError("No se pudieron cargar tus negocios");
      } finally {
        setLoading(false);
      }
    };

    loadBusinesses();
  }, [user]);

  // Renderizar badge de estado
  const renderStatusBadge = (estado) => {
    const statusConfig = {
      pendiente: {
        icon: faClock,
        label: "Pendiente",
        className: "status-badge--pending",
      },
      publicado: {
        icon: faCheckCircle,
        label: "Publicado",
        className: "status-badge--published",
      },
      rechazado: {
        icon: faTimesCircle,
        label: "Rechazado",
        className: "status-badge--rejected",
      },
    };

    const config = statusConfig[estado] || statusConfig.pendiente;

    return (
      <span className={`status-badge ${config.className}`}>
        <FontAwesomeIcon icon={config.icon} />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="perfil-section">
        <div className="perfil-section__header">
          <h2>Mis Negocios</h2>
        </div>
        <div className="perfil-section__loading">
          <FontAwesomeIcon icon={faSpinner} spin size="2x" />
          <p>Cargando negocios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="perfil-section">
        <div className="perfil-section__header">
          <h2>Mis Negocios</h2>
        </div>
        <div className="perfil-section__error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="perfil-section">
      <div className="perfil-section__header">
        <h2>Mis Negocios</h2>
        <button
          className="perfil-section__btn"
          onClick={() => navigate("/publicar-negocio")}>
          <FontAwesomeIcon icon={faPlus} />
          Nuevo Negocio
        </button>
      </div>

      {businesses.length === 0 ? (
        <div className="perfil-section__empty">
          <FontAwesomeIcon icon={faStore} />
          <h3>No tienes negocios registrados</h3>
          <p>Registra tu negocio y llega a más clientes en la región</p>
          <button onClick={() => navigate("/publicar-negocio")}>
            Registrar Negocio
          </button>
        </div>
      ) : (
        <div className="perfil-section__list">
          {businesses.map((business) => (
            <div key={business.id} className="perfil-business-card">
              <div className="perfil-business-card__image">
                {business.imagen_url ? (
                  <img src={business.imagen_url} alt={business.nombre} />
                ) : (
                  <div className="perfil-business-card__placeholder">
                    <FontAwesomeIcon icon={faStore} />
                  </div>
                )}
              </div>
              <div className="perfil-business-card__content">
                <div className="perfil-business-card__header">
                  <h3>{business.nombre}</h3>
                  {renderStatusBadge(business.estado)}
                </div>
                {business.categories && (
                  <span className="perfil-business-card__category">
                    {business.categories.nombre}
                  </span>
                )}
                {business.direccion && (
                  <p className="perfil-business-card__location">
                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                    {business.direccion}
                  </p>
                )}
                {business.telefono && (
                  <p className="perfil-business-card__phone">
                    <FontAwesomeIcon icon={faPhone} />
                    {business.telefono}
                  </p>
                )}
                {business.estado === "rechazado" && business.motivo_rechazo && (
                  <div className="perfil-business-card__rejection">
                    <strong>Motivo del rechazo:</strong>
                    <p>{business.motivo_rechazo}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
