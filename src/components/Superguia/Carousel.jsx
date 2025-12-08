import { useState, useRef, useEffect, useCallback } from "react";
import "./styles/Carousel.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons";

export default function Carousel({ publications, onPublicationClick }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoPlayRef = useRef(null);

  const itemsToShow = 5; // Cantidad visible a la vez
  const totalItems = publications.length;

  // Navegar al siguiente
  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalItems);
  }, [totalItems]);

  // Navegar al anterior
  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalItems) % totalItems);
  }, [totalItems]);

  // Auto-play con control de pausa
  useEffect(() => {
    if (isPaused || totalItems === 0) return;

    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalItems);
    }, 4000);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isPaused, totalItems]);

  // Pausar/Reanudar auto-play al hover
  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  // Obtener items visibles con efecto circular
  const getVisibleItems = () => {
    const items = [];
    for (let i = 0; i < itemsToShow; i++) {
      const index = (currentIndex + i) % totalItems;
      items.push({ ...publications[index], displayIndex: i });
    }
    return items;
  };

  if (!publications || publications.length === 0) {
    return null;
  }

  return (
    <div
      className="carousel"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}>
      {/* Botón anterior */}
      <button
        className="carousel__nav carousel__nav--prev"
        onClick={goToPrev}
        aria-label="Anterior">
        <FontAwesomeIcon icon={faChevronLeft} />
      </button>

      {/* Track del carrusel */}
      <div className="carousel__track">
        {getVisibleItems().map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className={`carousel__item ${
              index === Math.floor(itemsToShow / 2) ? "active" : ""
            }`}
            onClick={() => onPublicationClick && onPublicationClick(item)}>
            <div className="carousel__card">
              <img
                src={item.imagen || "/img/placeholder.jpg"}
                alt={item.titulo}
                className="carousel__image"
              />
              <div className="carousel__info">
                <div className="carousel__location">
                  <FontAwesomeIcon icon={faMapMarkerAlt} />
                  <span>{item.ciudad}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Botón siguiente */}
      <button
        className="carousel__nav carousel__nav--next"
        onClick={goToNext}
        aria-label="Siguiente">
        <FontAwesomeIcon icon={faChevronRight} />
      </button>

      {/* Indicadores */}
      <div className="carousel__indicators">
        {publications.slice(0, Math.min(10, totalItems)).map((_, index) => (
          <button
            key={index}
            className={`carousel__dot ${
              index === currentIndex % 10 ? "active" : ""
            }`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Ir a slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
