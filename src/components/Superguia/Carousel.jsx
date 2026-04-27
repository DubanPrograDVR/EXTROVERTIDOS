import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import "./styles/Carousel.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMapMarkerAlt,
  faCalendarAlt,
  faClock,
} from "@fortawesome/free-solid-svg-icons";

/**
 * Carrusel con efecto "tren": los items se desplazan de forma continua
 * de derecha a izquierda. Se pausa al hacer hover.
 */
export default function Carousel({
  publications,
  onPublicationClick,
  // Velocidad en segundos por cada item que recorre la pista.
  // Más bajo = más rápido.
  speedPerItem = 2.2,
}) {
  const [isPaused, setIsPaused] = useState(false);
  const [canPauseOnHover, setCanPauseOnHover] = useState(false);
  const [isAppleTouchDevice, setIsAppleTouchDevice] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [itemStride, setItemStride] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const carouselRef = useRef(null);
  const trackRef = useRef(null);
  const firstItemRef = useRef(null);
  const animationFrameRef = useRef(null);
  const measurementFrameRef = useRef(null);
  const lastTimestampRef = useRef(null);
  const offsetRef = useRef(0);
  const previousSignatureRef = useRef("");

  const handleMouseEnter = useCallback(() => {
    if (canPauseOnHover) setIsPaused(true);
  }, [canPauseOnHover]);
  const handleMouseLeave = useCallback(() => {
    if (canPauseOnHover) setIsPaused(false);
  }, [canPauseOnHover]);

  const totalItems = publications?.length || 0;

  const publicationSignature = useMemo(
    () => publications?.map((item) => item.id).join("|") || "",
    [publications],
  );

  const updateMeasurements = useCallback(() => {
    const nextContainerWidth = Math.round(
      carouselRef.current?.getBoundingClientRect().width || 0,
    );
    const firstItem = firstItemRef.current;
    const group = firstItem?.parentElement;
    const itemWidth = firstItem?.getBoundingClientRect().width || 0;
    const groupStyles = group ? window.getComputedStyle(group) : null;
    const groupGap = Number.parseFloat(
      groupStyles?.columnGap || groupStyles?.gap || "0",
    );
    const nextItemStride = Math.round(
      itemWidth + (Number.isNaN(groupGap) ? 0 : groupGap),
    );

    setContainerWidth((prev) =>
      Math.abs(prev - nextContainerWidth) > 1 ? nextContainerWidth : prev,
    );
    setItemStride((prev) =>
      Math.abs(prev - nextItemStride) > 1 ? nextItemStride : prev,
    );
  }, []);

  const scheduleMeasurements = useCallback(() => {
    if (measurementFrameRef.current) return;

    measurementFrameRef.current = window.requestAnimationFrame(() => {
      measurementFrameRef.current = null;
      updateMeasurements();
    });
  }, [updateMeasurements]);

  const applyTrackTransform = useCallback((offset) => {
    if (!trackRef.current) return;

    const nextTransform = `translateX(${-offset}px)`;
    trackRef.current.style.transform = nextTransform;
    trackRef.current.style.webkitTransform = nextTransform;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return undefined;
    }

    const detectAppleTouchDevice = () => {
      const {
        userAgent = "",
        platform = "",
        maxTouchPoints = 0,
      } = window.navigator;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isIPadOS = platform === "MacIntel" && maxTouchPoints > 1;
      setIsAppleTouchDevice(isIOS || isIPadOS);
    };

    detectAppleTouchDevice();

    window.addEventListener("orientationchange", detectAppleTouchDevice);
    window.addEventListener("resize", detectAppleTouchDevice);

    return () => {
      window.removeEventListener("orientationchange", detectAppleTouchDevice);
      window.removeEventListener("resize", detectAppleTouchDevice);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;

    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const updateHoverCapability = () => {
      setCanPauseOnHover(mediaQuery.matches);
      if (!mediaQuery.matches) setIsPaused(false);
    };

    updateHoverCapability();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updateHoverCapability);
      return () =>
        mediaQuery.removeEventListener("change", updateHoverCapability);
    }

    mediaQuery.addListener(updateHoverCapability);
    return () => mediaQuery.removeListener(updateHoverCapability);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    updateMotionPreference();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updateMotionPreference);
      return () =>
        mediaQuery.removeEventListener("change", updateMotionPreference);
    }

    mediaQuery.addListener(updateMotionPreference);
    return () => mediaQuery.removeListener(updateMotionPreference);
  }, []);

  useEffect(() => {
    if (!publications || publications.length === 0) return undefined;

    scheduleMeasurements();

    let resizeObserver;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(scheduleMeasurements);
      if (carouselRef.current) resizeObserver.observe(carouselRef.current);
      if (firstItemRef.current) resizeObserver.observe(firstItemRef.current);
    }

    window.addEventListener("resize", scheduleMeasurements);
    window.addEventListener("orientationchange", scheduleMeasurements);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", scheduleMeasurements);
      window.removeEventListener("orientationchange", scheduleMeasurements);
      if (measurementFrameRef.current) {
        window.cancelAnimationFrame(measurementFrameRef.current);
        measurementFrameRef.current = null;
      }
    };
  }, [publicationSignature, publications, scheduleMeasurements]);

  const durationMultiplier = useMemo(() => {
    if (containerWidth <= 480) return 3.4;
    if (containerWidth <= 768) return 3;
    if (containerWidth <= 1180) return 2.3;
    return 1.4;
  }, [containerWidth]);

  const platformDurationMultiplier = useMemo(
    () => (isAppleTouchDevice ? 0.6 : 1),
    [isAppleTouchDevice],
  );

  const renderItemCount = useMemo(() => {
    if (!totalItems) return 0;
    if (totalItems === 1) return 1;
    if (!itemStride || !containerWidth) return Math.min(totalItems, 8);

    return Math.max(3, Math.ceil(containerWidth / itemStride) + 3);
  }, [totalItems, itemStride, containerWidth]);

  const renderedPublications = useMemo(() => {
    if (!publications || !totalItems || !renderItemCount) return [];

    return Array.from({ length: renderItemCount }, (_, slotIndex) => {
      const publicationIndex = (startIndex + slotIndex) % totalItems;
      return {
        item: publications[publicationIndex],
        slotIndex,
      };
    });
  }, [publications, renderItemCount, startIndex, totalItems]);

  useEffect(() => {
    const contentChanged =
      previousSignatureRef.current !== publicationSignature;
    previousSignatureRef.current = publicationSignature;

    if (contentChanged || !itemStride) {
      offsetRef.current = 0;
    } else {
      while (offsetRef.current >= itemStride) {
        offsetRef.current -= itemStride;
      }
      if (offsetRef.current < 0) {
        offsetRef.current = 0;
      }
    }

    lastTimestampRef.current = null;

    applyTrackTransform(offsetRef.current);
  }, [applyTrackTransform, itemStride, publicationSignature]);

  useEffect(() => {
    const resetTimestamp = () => {
      lastTimestampRef.current = null;
    };

    document.addEventListener("visibilitychange", resetTimestamp);
    window.addEventListener("pagehide", resetTimestamp);
    window.addEventListener("pageshow", resetTimestamp);
    window.addEventListener("focus", resetTimestamp);

    return () => {
      document.removeEventListener("visibilitychange", resetTimestamp);
      window.removeEventListener("pagehide", resetTimestamp);
      window.removeEventListener("pageshow", resetTimestamp);
      window.removeEventListener("focus", resetTimestamp);
    };
  }, []);

  useEffect(() => {
    if (
      !itemStride ||
      !trackRef.current ||
      prefersReducedMotion ||
      totalItems <= 1
    ) {
      return undefined;
    }

    if (isPaused) {
      lastTimestampRef.current = null;
      return undefined;
    }

    const pixelsPerSecond =
      itemStride /
      (speedPerItem * durationMultiplier * platformDurationMultiplier);
    const maxFrameDelta = isAppleTouchDevice ? 1 / 30 : 0.05;
    const resumeDelta = isAppleTouchDevice ? 0.18 : 0.25;

    const step = (timestamp) => {
      if (!trackRef.current) return;

      if (document.visibilityState && document.visibilityState !== "visible") {
        lastTimestampRef.current = null;
        animationFrameRef.current = window.requestAnimationFrame(step);
        return;
      }

      if (lastTimestampRef.current == null) {
        lastTimestampRef.current = timestamp;
      }

      const rawDeltaSeconds = (timestamp - lastTimestampRef.current) / 1000;
      const deltaSeconds =
        rawDeltaSeconds > resumeDelta
          ? 1 / 60
          : Math.min(rawDeltaSeconds, maxFrameDelta);
      lastTimestampRef.current = timestamp;

      offsetRef.current += pixelsPerSecond * deltaSeconds;
      if (offsetRef.current >= itemStride) {
        let advancedItems = 0;

        while (offsetRef.current >= itemStride) {
          offsetRef.current -= itemStride;
          advancedItems += 1;
        }

        if (advancedItems > 0) {
          flushSync(() => {
            setStartIndex((prev) => (prev + advancedItems) % totalItems);
          });
        }
      }

      applyTrackTransform(offsetRef.current);

      animationFrameRef.current = window.requestAnimationFrame(step);
    };

    animationFrameRef.current = window.requestAnimationFrame(step);

    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = null;
      lastTimestampRef.current = null;
    };
  }, [
    applyTrackTransform,
    durationMultiplier,
    itemStride,
    isAppleTouchDevice,
    isPaused,
    platformDurationMultiplier,
    prefersReducedMotion,
    speedPerItem,
    totalItems,
  ]);

  if (!publications || publications.length === 0) {
    return null;
  }

  return (
    <div
      ref={carouselRef}
      className={`carousel carousel--train ${
        isPaused ? "carousel--paused" : ""
      } ${isAppleTouchDevice ? "carousel--apple-touch" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}>
      {/* Track del carrusel */}
      <div
        ref={trackRef}
        className="carousel__track"
        style={{
          transform: "translateX(0px)",
          WebkitTransform: "translateX(0px)",
        }}>
        <div className="carousel__group">
          {renderedPublications.map(({ item, slotIndex }) => (
            <div
              key={`carousel-window-slot-${slotIndex}`}
              ref={slotIndex === 0 ? firstItemRef : undefined}
              className="carousel__item"
              aria-hidden={slotIndex >= totalItems}
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
                  <h3 className="carousel__title">
                    {item.titulo || item.nombre}
                  </h3>
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
                    {!item.fecha_evento && item.horarios && (
                      <div className="carousel__date">
                        <FontAwesomeIcon icon={faClock} />
                        <span>
                          {item.horarios.abierto_24h
                            ? "Abierto 24h"
                            : (() => {
                                const diasNombres = [
                                  "Domingo",
                                  "Lunes",
                                  "Martes",
                                  "Miércoles",
                                  "Jueves",
                                  "Viernes",
                                  "Sábado",
                                ];
                                const hoy = diasNombres[new Date().getDay()];
                                const h = item.horarios[hoy];
                                if (!h) return "Cerrado hoy";
                                if (Array.isArray(h) && h[0]?.apertura) {
                                  return `${h[0].apertura} - ${h[0].cierre}`;
                                }
                                if (h.apertura) {
                                  return `${h.apertura} - ${h.cierre}`;
                                }
                                return "Cerrado hoy";
                              })()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
