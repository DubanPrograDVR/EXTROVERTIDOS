import { useState } from "react";
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
import logo from "../../../public/img/Logo_extrovertidos.png";
import Secciones from "./Secciones";
import Footer from "./Footer";

const CITIES = [
  "Talca",
  "Santiago",
  "Valparaíso",
  "Concepción",
  "Viña del Mar",
  "La Serena",
  "Antofagasta",
  "Temuco",
];

export default function Home() {
  const [currentCityIndex, setCurrentCityIndex] = useState(0);

  const handlePrevCity = () => {
    setCurrentCityIndex((prev) => (prev === 0 ? CITIES.length - 1 : prev - 1));
  };

  const handleNextCity = () => {
    setCurrentCityIndex((prev) => (prev === CITIES.length - 1 ? 0 : prev + 1));
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
                LOS PANORAMAS, ACTIVIDADES Y EVENTOS
              </span>
              <span className="title-accent">DE TU CIUDAD</span>
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
                onClick={handlePrevCity}
                aria-label="Ciudad anterior">
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>

              <div className="city-display">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="city-icon" />
                <span className="city-name">{CITIES[currentCityIndex]}</span>
              </div>

              <button
                className="city-arrow"
                onClick={handleNextCity}
                aria-label="Ciudad siguiente">
                <FontAwesomeIcon icon={faChevronRight} />
              </button>

              <button className="search-btn" aria-label="Buscar">
                <FontAwesomeIcon icon={faSearch} />
              </button>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="action-buttons">
            <button className="action-btn btn-panoramas">
              <FontAwesomeIcon icon={faMapMarkedAlt} className="btn-icon" />
              <span>Panoramas</span>
            </button>
            <button className="action-btn btn-superguia">
              <FontAwesomeIcon icon={faCompass} className="btn-icon" />
              <span>
                Superguía
                <br />
                Extrovertidos
              </span>
            </button>
          </div>

          {/* Texto Final */}
          <div className="home-footer">
            <h2 className="footer-text">
              ¡LO MEJOR ESTÁ EN{" "}
              <span className="text-highlight">EXTROVERTIDOS!</span>
            </h2>
          </div>
        </div>

        {/* Elementos decorativos */}
        <div className="bg-decoration decoration-1"></div>
        <div className="bg-decoration decoration-2"></div>
        <div className="bg-decoration decoration-3"></div>

        {/* Secciones principales */}
      </section>

      <Secciones />

      <Footer />
    </>
  );
}
