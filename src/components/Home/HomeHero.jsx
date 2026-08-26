import { useCallback, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faCalendarDays,
  faChevronLeft,
  faChevronRight,
  faLocationDot,
} from "@fortawesome/free-solid-svg-icons";
import { LOCATIONS } from "../Superguia/data";
import {
  esEventoVigente,
  ordenarEventos,
} from "./homeUtils";

const formatearFecha = (fecha) => {
  if (!fecha) return "Fecha por confirmar";
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function HomeHero({
  eventos,
  ciudad,
  comuna,
  cargando,
  error,
  onEventoClick,
  semillaOrden = 0,
}) {
  const [indice, setIndice] = useState(0);
  const [movimientoReducido, setMovimientoReducido] = useState(false);
  const [paginaVisible, setPaginaVisible] = useState(true);

  const eventosDestacados = useMemo(() => {
    const nombreCiudad = LOCATIONS[ciudad]?.nombre;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const limite = new Date(hoy);
    limite.setDate(limite.getDate() + 7);

    const ubicados = (eventos || []).filter((evento) => {
      if (!esEventoVigente(evento, hoy) || !evento.fecha_evento) return false;
      if (
        nombreCiudad &&
        evento.provincia?.toLowerCase() !== nombreCiudad.toLowerCase()
      ) {
        return false;
      }
      if (comuna && evento.comuna?.toLowerCase() !== comuna.toLowerCase()) {
        return false;
      }
      return true;
    });

    const proximos = ubicados.filter(
      (evento) => new Date(`${evento.fecha_evento}T00:00:00`) <= limite,
    );
    const lista = proximos.length > 0 ? proximos : ubicados;

    return ordenarEventos(lista, true, semillaOrden)
      .slice(0, 8);
  }, [ciudad, comuna, eventos, semillaOrden]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const actualizarPreferencia = () => setMovimientoReducido(mediaQuery.matches);
    actualizarPreferencia();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", actualizarPreferencia);
      return () => mediaQuery.removeEventListener("change", actualizarPreferencia);
    }

    mediaQuery.addListener(actualizarPreferencia);
    return () => mediaQuery.removeListener(actualizarPreferencia);
  }, []);

  useEffect(() => {
    const actualizarVisibilidad = () =>
      setPaginaVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", actualizarVisibilidad);
    return () => document.removeEventListener("visibilitychange", actualizarVisibilidad);
  }, []);

  const indiceVisible =
    eventosDestacados.length > 0
      ? Math.min(indice, eventosDestacados.length - 1)
      : 0;

  const siguiente = useCallback(() => {
    setIndice((actual) =>
      actual >= eventosDestacados.length - 1 ? 0 : actual + 1,
    );
  }, [eventosDestacados.length]);

  const anterior = useCallback(() => {
    setIndice((actual) =>
      actual <= 0 ? eventosDestacados.length - 1 : actual - 1,
    );
  }, [eventosDestacados.length]);

  useEffect(() => {
    if (eventosDestacados.length <= 1 || movimientoReducido || !paginaVisible) {
      return undefined;
    }

    const temporizador = window.setTimeout(siguiente, 4500);
    return () => window.clearTimeout(temporizador);
  }, [eventosDestacados.length, indiceVisible, movimientoReducido, paginaVisible, siguiente]);

  return (
    <section
      className="home-consolidado__hero"
      aria-label="Panoramas destacados">
      {cargando ? (
        <div className="home-consolidado__hero-state" role="status">
          Cargando panoramas destacados...
        </div>
      ) : error ? (
        <div className="home-consolidado__hero-state" role="status">
          El carrusel estará disponible cuando se recupere el contenido.
        </div>
      ) : eventosDestacados.length === 0 ? (
        <div className="home-consolidado__hero-state">
          <p className="home-consolidado__eyebrow">Extrovertidos</p>
          <h1 id="home-hero-title">Descubre lo que ocurre cerca de ti</h1>
          <p>Explora la cartelera completa más abajo.</p>
        </div>
      ) : (
        <>
          <p className="home-consolidado__hero-label">Próximos panoramas</p>
          <div className="home-consolidado__hero-slides" aria-live="polite">
            {eventosDestacados.map((evento, indiceEvento) => {
              const activo = indiceEvento === indiceVisible;
              const imagen =
                Array.isArray(evento.imagenes) && evento.imagenes.length > 0
                  ? evento.imagenes[0]
                  : "/img/Home1.png";

              return (
                <article
                  key={evento.id}
                  className={`home-consolidado__hero-slide ${activo ? "is-active" : ""}`}
                  aria-hidden={!activo}
                  style={{ backgroundImage: `url(${imagen})` }}>
                  <div className="home-consolidado__hero-overlay" />
                  <div className="home-consolidado__hero-content">
                    <span className="home-consolidado__hero-category">
                      {evento.categories?.nombre || "Panorama"}
                    </span>
                    <h1 id={activo ? "home-hero-title" : undefined}>
                      {evento.titulo}
                    </h1>
                    <div className="home-consolidado__hero-info">
                      <span>
                        <FontAwesomeIcon icon={faCalendarDays} aria-hidden="true" />
                        {formatearFecha(evento.fecha_evento)}
                      </span>
                      <span>
                        <FontAwesomeIcon icon={faLocationDot} aria-hidden="true" />
                        {evento.comuna || evento.provincia || "Ubicación por confirmar"}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="home-consolidado__hero-action"
                      tabIndex={activo ? 0 : -1}
                      onClick={() => onEventoClick(evento)}>
                      Ver panorama
                      <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {eventosDestacados.length > 1 && (
            <>
              <button
                type="button"
                className="home-consolidado__hero-control home-consolidado__hero-control--prev"
                onClick={anterior}
                aria-label="Panorama anterior">
                <FontAwesomeIcon icon={faChevronLeft} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="home-consolidado__hero-control home-consolidado__hero-control--next"
                onClick={siguiente}
                aria-label="Panorama siguiente">
                <FontAwesomeIcon icon={faChevronRight} aria-hidden="true" />
              </button>
              <div className="home-consolidado__hero-dots" aria-label="Seleccionar panorama">
                {eventosDestacados.map((evento, indiceEvento) => (
                  <button
                    type="button"
                    key={evento.id}
                    className={indiceEvento === indiceVisible ? "is-active" : ""}
                    onClick={() => setIndice(indiceEvento)}
                    aria-label={`Mostrar panorama ${indiceEvento + 1}`}
                    aria-current={indiceEvento === indiceVisible ? "true" : undefined}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
