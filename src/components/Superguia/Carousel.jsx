import { useState, useRef, useEffect, useCallback } from "react";
import "./styles/Carousel.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faMapMarkerAlt,
  faCalendarAlt,
} from "@fortawesome/free-solid-svg-icons";

export default function Carousel({ publications, onPublicationClick }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const autoPlayRef = useRef(null);
  const resumeTimeoutRef = useRef(null);
  const transitionTimerRef = useRef(null);

  const itemsToShow = 4;
  const totalItems = publications?.length || 0;
  const autoPlayInterval = 3500; // Velocidad del autoplay
  const transitionDuration = 500; // Duración de la transición en ms

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  // Navegar al siguiente con protección de transición
  const goToNext = useCallback(() => {
    if (isTransitioning || totalItems === 0) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % totalItems);
    transitionTimerRef.current = setTimeout(
      () => setIsTransitioning(false),
      transitionDuration,
    );
  }, [totalItems, isTransitioning]);

  // Navegar al anterior con protección de transición
  const goToPrev = useCallback(() => {
    if (isTransitioning || totalItems === 0) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + totalItems) % totalItems);
    transitionTimerRef.current = setTimeout(
      () => setIsTransitioning(false),
      transitionDuration,
    );
  }, [totalItems, isTransitioning]);

  // Ir a un índice específico
  const goToIndex = useCallback(
    (index) => {
      if (isTransitioning || totalItems === 0) return;
      setIsTransitioning(true);
      setCurrentIndex(index);
      transitionTimerRef.current = setTimeout(
        () => setIsTransitioning(false),
        transitionDuration,
      );
    },
    [totalItems, isTransitioning],
  );

  // Auto-play controlado
  useEffect(() => {
    if (isPaused || totalItems === 0) {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
      return;
    }

    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalItems);
    }, autoPlayInterval);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
    };
  }, [isPaused, totalItems]);

  // Pausar al hacer hover
  const handleMouseEnter = useCallback(() => {
    // Cancelar cualquier timeout de reanudación pendiente
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
    setIsPaused(true);
  }, []);

  // Reanudar al salir del hover con delay para evitar "saltos"
  const handleMouseLeave = useCallback(() => {
    // Delay antes de reanudar para transición suave
    resumeTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 300);
  }, []);

  // Obtener items visibles con efecto circular
  const getVisibleItems = useCallback(() => {
    if (totalItems === 0) return [];
    const items = [];
    for (let i = 0; i < itemsToShow; i++) {
      const index = (currentIndex + i) % totalItems;
      items.push({ ...publications[index], displayIndex: i });
    }
    return items;
  }, [currentIndex, publications, totalItems, itemsToShow]);

  if (!publications || publications.length === 0) {
    return null;
  }

  const visibleItems = getVisibleItems();

  return (
    <div
      className={`carousel ${isPaused ? "carousel--paused" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}>
      {/* Botón anterior */}
      <button
        className="carousel__nav carousel__nav--prev"
        onClick={goToPrev}
        disabled={isTransitioning}
        aria-label="Anterior">
        <FontAwesomeIcon icon={faChevronLeft} />
      </button>

      {/* Track del carrusel */}
      <div className="carousel__track">
        {visibleItems.map((item, index) => (
          <div
            key={`${item.id}-${currentIndex}-${index}`}
            className={`carousel__item ${
              index === Math.floor(itemsToShow / 2) ? "active" : ""
            }`}
            onClick={() => onPublicationClick && onPublicationClick(item)}>
            <div className="carousel__card">
              <img
                src={
                  Array.isArray(item.imagenes) && item.imagenes.length > 0
                    ? item.imagenes[0]
                    : "/img/Home1.png"
                }
                alt={item.titulo}
                className="carousel__image"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  e.target.src = "/img/Home1.png";
                }}
              />
              <div className="carousel__info">
                <h3 className="carousel__title">{item.titulo}</h3>
                <div className="carousel__meta">
                  <div className="carousel__location">
                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                    <span>
                      {item.comuna || item.ciudad}
                      {item.provincia ? `, ${item.provincia}` : ""}
                    </span>
                  </div>
                  {item.fecha_evento && (
                    <div className="carousel__date">
                      <FontAwesomeIcon icon={faCalendarAlt} />
                      <span>
                        {new Date(item.fecha_evento).toLocaleDateString(
                          "es-CL",
                          {
                            day: "numeric",
                            month: "short",
                          },
                        )}
                      </span>
                    </div>
                  )}
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
        disabled={isTransitioning}
        aria-label="Siguiente">
        <FontAwesomeIcon icon={faChevronRight} />
      </button>

      {/* Indicadores */}
      <div className="carousel__indicators">
        {publications.slice(0, Math.min(8, totalItems)).map((_, index) => (
          <button
            key={index}
            className={`carousel__dot ${
              index === currentIndex % Math.min(8, totalItems) ? "active" : ""
            }`}
            onClick={() => goToIndex(index)}
            aria-label={`Ir a slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
