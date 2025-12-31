import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faStore } from "@fortawesome/free-solid-svg-icons";
import "./styles/section.css";

export default function PerfilNegocios() {
  const navigate = useNavigate();

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
      <div className="perfil-section__empty">
        <FontAwesomeIcon icon={faStore} />
        <h3>No tienes negocios registrados</h3>
        <p>Registra tu negocio y llega a más clientes en la región</p>
        <button onClick={() => navigate("/publicar-negocio")}>
          Registrar Negocio
        </button>
      </div>
    </div>
  );
}
