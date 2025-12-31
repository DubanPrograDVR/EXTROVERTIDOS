import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";
import "./styles/section.css";

export default function PerfilFavoritos() {
  const navigate = useNavigate();

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
