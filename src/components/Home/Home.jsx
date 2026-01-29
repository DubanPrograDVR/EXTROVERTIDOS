import { useNavigate } from "react-router-dom";
import { useCity } from "../../context/CityContext";
import "./styles/home.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMapMarkerAlt,
  faChevronLeft,
  faChevronRight,
  faSearch,
  faCompass,
  faMapMarkedAlt,
} from "@fortawesome/free-solid-svg-icons";
import Secciones from "./Secciones";

// Imágenes servidas desde public/
const logo = "/img/Logo_extrovertidos.png";
import Panoramas from "./Panoramas";
import Footer from "./Footer";

export default function Home() {
  const navigate = useNavigate();
  const { cityName, prevCity, nextCity } = useCity();

  // Buscar panoramas por ciudad seleccionada
  const handleSearch = () => {
    navigate(`/panoramas?ciudad=${encodeURIComponent(cityName)}`);
  };

  // Ir a panoramas con la ciudad seleccionada
  const handlePanoramasClick = () => {
    navigate(`/panoramas?ciudad=${encodeURIComponent(cityName)}`);
  };

  // Ir a superguía
  const handleSuperguiaClick = () => {
    navigate("/superguia");
  };

  return (
    <>
      <section className="home-section">
        <div className="home-container">
          {/* Título Principal */}
          <div className="home-header">
            <h1 className="home-title">
              <span className="title-highlight">¡ENCUENTRA!</span>
              <span className="title-main">
                LOS <span className="text-panoramas">PANORAMAS</span>,{" "}
                <span className="text-actividades">ACTIVIDADES</span> Y{" "}
                <span className="text-eventos">EVENTOS</span>
              </span>
              <span className="title-accent">
                DE TU <span className="title-ciudad">CIUDAD</span>
              </span>
            </h1>
          </div>

          {/* Logo Central */}
          <div className="home-logo">
            <img src={logo} alt="Extrovertidos" className="logo-main" />
          </div>

          {/* Selector de Ciudad */}
          <div className="city-selector">
            <p className="city-question">¿En qué ciudad te encuentras?</p>
            <div className="city-picker">
              <button
                className="city-arrow"
                onClick={prevCity}
                aria-label="Ciudad anterior">
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>

              <div className="city-display">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="city-icon" />
                <span className="city-name">{cityName}</span>
              </div>

              <button
                className="city-arrow"
                onClick={nextCity}
                aria-label="Ciudad siguiente">
                <FontAwesomeIcon icon={faChevronRight} />
              </button>

              <button
                className="search-btn"
                onClick={handleSearch}
                aria-label="Buscar">
                <FontAwesomeIcon icon={faSearch} />
              </button>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="action-buttons">
            <button
              className="action-btn btn-panoramas"
              onClick={handlePanoramasClick}>
              <FontAwesomeIcon icon={faMapMarkedAlt} className="btn-icon" />
              <span>Panoramas</span>
            </button>
            <button
              className="action-btn btn-superguia"
              onClick={handleSuperguiaClick}>
              <FontAwesomeIcon icon={faCompass} className="btn-icon" />
              <span>
                Superguía
                <br />
                Extrovertidos
              </span>
            </button>
          </div>
        </div>

        {/* Elementos decorativos */}
        <div className="bg-decoration decoration-1"></div>
        <div className="bg-decoration decoration-2"></div>
        <div className="bg-decoration decoration-3"></div>

        {/* Secciones principales */}
      </section>

      <Panoramas />

      <Secciones />

      <Footer />
    </>
  );
}
