import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCrown,
  faArrowRight,
  faWandMagicSparkles,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { PUBLICATION_TYPES } from "../Panorama/constants";
import { getPlanPrices } from "../../../lib/database";
import { useAuth } from "../../../context/AuthContext";
import usePlansVisibility from "../../../hooks/usePlansVisibility";
import "./styles/crear-publicacion.css";

const LOGO_PANORAMA = "/img/P_Extro_v2.png";
const LOGO_SUPER_BUSCADOR = "/img/SG_Extro_v2.png";

const formatCLP = (amount) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(amount);

/**
 * Pantalla única de selección de tipo de publicación (/crear-publicacion).
 *
 * Reemplaza al flujo de modales (PublicationTypeModal + PlanBlockModal): una
 * sola pantalla, un solo clic hasta el formulario. Cada tarjeta es un <Link>
 * real, así que se puede abrir en pestaña nueva y es navegable por teclado.
 *
 * Las publicaciones gratuitas no dependen de los toggles comerciales de
 * suscripciones. Los toggles de destacados sí controlan las opciones pagadas.
 * El toggle "Destacar negocio" vive dentro de la tarjeta de negocio y
 * pre-selecciona el tipo destacado en el formulario (/publicar-negocio).
 */
const CrearPublicacion = () => {
  const { isAdmin, isModerator } = useAuth();
  const isAdminOrMod = isAdmin || isModerator;

  const {
    superguiaVisible,
    destacadasEnabled,
    negociosDestacadasEnabled,
    loading: loadingVisibility,
  } = usePlansVisibility();

  const [precioDestacada, setPrecioDestacada] = useState(null);
  const [negocioDestacadoPrice, setNegocioDestacadoPrice] = useState(0);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [negocioDestacado, setNegocioDestacado] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getPlanPrices()
      .then((prices) => {
        if (!cancelled) {
          setPrecioDestacada(Number(prices?.publicacion_destacada) || 0);
          setNegocioDestacadoPrice(Number(prices?.negocio_destacado) || 0);
        }
      })
      .catch((error) => {
        console.warn("[CrearPublicacion] Error cargando precios:", error);
      })
      .finally(() => {
        if (!cancelled) setLoadingPrice(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const puedeDestacarNegocio = Boolean(
    negociosDestacadasEnabled && (isAdminOrMod || negocioDestacadoPrice > 0),
  );

  const precioDestacadaLabel = useMemo(() => {
    if (isAdminOrMod) return "Sin costo";
    if (loadingPrice) return "Cargando...";
    return precioDestacada
      ? formatCLP(precioDestacada)
      : "Precio no disponible";
  }, [isAdminOrMod, loadingPrice, precioDestacada]);

  const opciones = useMemo(() => {
    const items = [];

    items.push({
      id: "panorama-gratuito",
      to: `/publicar-panorama?plan=${PUBLICATION_TYPES.NORMAL}`,
      variant: "gratuito",
      logo: LOGO_PANORAMA,
      eyebrow: "Panorama",
      title: "Panorama gratuito",
      price: "Gratis",
      priceSuffix: null,
      features: [
        "Publicidad de tu actividad",
        "Ubicación en cartelera general",
      ],
      description:
        "Publica tu evento sin costo. Aparecerá en la sección de Panoramas después de la revisión del equipo.",
      cta: "Publicar gratis",
    });

    if (destacadasEnabled) {
      items.push({
        id: "panorama-destacado",
        to: `/publicar-panorama?plan=${PUBLICATION_TYPES.DESTACADA}`,
        variant: "destacada",
        logo: LOGO_PANORAMA,
        eyebrow: "Panorama",
        title: "Panorama destacado",
        price: precioDestacadaLabel,
        priceSuffix:
          !isAdminOrMod && precioDestacada ? "/ por publicación" : null,
        badge: "Recomendado",
        description: isAdminOrMod
          ? "Diseño premium con borde dorado y distintivo especial. Se publicará directamente en Panoramas Destacados sin costo adicional."
          : "Diseño premium con borde dorado y distintivo especial. Tras el pago, la revisará el equipo y aparecerá en Panoramas Destacados.",
        features: [
          "Visibilidad destacada",
          "Carrusel principal",
          "Ubicación preferencial",
          "Mayor Publicidad de tu actividad",
        ],
        cta: "Destacar panorama",
      });
    }

    items.push({
      id: "negocio",
      to:
        negocioDestacado && puedeDestacarNegocio
          ? "/publicar-negocio?destacado=1"
          : "/publicar-negocio",
      variant: "negocio",
      logo: LOGO_SUPER_BUSCADOR,
      noteLogo: LOGO_SUPER_BUSCADOR,
      eyebrow: "Super buscador",
      title: "Publicar mi negocio",
      price: superguiaVisible ? "Plan Super buscador" : "Disponible",
      priceSuffix: null,
      features: [
        "Mayor publicidad de tu servicio o negocio",
        "Llega a más personas",
        "Conecta con más potenciales clientes",
      ],
      description:
        "Publica tu negocio en el super buscador de extrovertidos, más conexión, más visibilidad y más clientes.",
      cta: "Publicar negocio",
    });

    const order = {
      destacada: 0,
      gratuito: 1,
      negocio: 2,
    };

    return items.sort((a, b) => order[a.variant] - order[b.variant]);
  }, [
    superguiaVisible,
    destacadasEnabled,
    isAdminOrMod,
    precioDestacadaLabel,
    precioDestacada,
    negocioDestacado,
    puedeDestacarNegocio,
  ]);

  if (loadingVisibility || loadingPrice) {
    return (
      <div className="crear-publicacion">
        <div className="page-loader">
          <div className="page-loader__spinner"></div>
          <p>Cargando opciones...</p>
        </div>
      </div>
    );
  }

  const hayOpciones = opciones.length > 0;

  return (
    <div className="crear-publicacion">
      <header className="crear-publicacion__header">
        <div className="crear-publicacion__header-inner">
          <span className="crear-publicacion__badge">
            Planes de publicación
          </span>
          <h1 className="crear-publicacion__title">
            Lleva tus panoramas al{" "}
            <span className="crear-publicacion__title-accent">
              siguiente nivel
            </span>
          </h1>
          <p className="crear-publicacion__subtitle">
            Elige el plan que mejor se adapte a ti y destaca entre miles de
            personas.
          </p>
        </div>
      </header>

      <main className="crear-publicacion__content">
        {hayOpciones ? (
          <>
            <div className="crear-publicacion__options">
              {opciones.map((opcion) => (
                <Link
                  key={opcion.id}
                  to={opcion.to}
                  className={`crear-publicacion__card crear-publicacion__card--${opcion.variant}`}>
                  {opcion.badge && (
                    <span className="crear-publicacion__card-badge">
                      <FontAwesomeIcon icon={faCrown} aria-hidden="true" />
                      {opcion.badge}
                    </span>
                  )}

                  <span
                    className="crear-publicacion__card-watermark"
                    aria-hidden="true">
                    <img src={opcion.logo} alt="" />
                  </span>

                  <span className="crear-publicacion__card-head">
                    <span className="crear-publicacion__card-head-main">
                      <span className="crear-publicacion__card-icon">
                        <img src={opcion.logo} alt="" aria-hidden="true" />
                      </span>
                      <span className="crear-publicacion__card-head-text">
                        <span className="crear-publicacion__card-eyebrow">
                          {opcion.eyebrow}
                        </span>
                        <h2 className="crear-publicacion__card-title">
                          {opcion.title}
                        </h2>
                        <p className="crear-publicacion__card-price">
                          {opcion.price}
                          {opcion.priceSuffix && (
                            <span className="crear-publicacion__card-price-suffix">
                              {opcion.priceSuffix}
                            </span>
                          )}
                        </p>
                      </span>
                    </span>

                    {opcion.id === "negocio" && puedeDestacarNegocio && (
                      <span
                        className="crear-publicacion__highlight"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setNegocioDestacado((prev) => !prev);
                        }}>
                        <span className="crear-publicacion__highlight-label">
                          Destacar negocio
                        </span>
                        <span className="crear-publicacion__toggle-wrap">
                          <FontAwesomeIcon
                            icon={faWandMagicSparkles}
                            className="crear-publicacion__highlight-spark"
                            aria-hidden="true"
                          />
                          <button
                            type="button"
                            aria-pressed={negocioDestacado}
                            aria-label="Destacar negocio"
                            className={`crear-publicacion__toggle ${
                              negocioDestacado
                                ? "crear-publicacion__toggle--active"
                                : ""
                            }`}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setNegocioDestacado((prev) => !prev);
                            }}>
                            <span className="crear-publicacion__toggle-knob" />
                          </button>
                        </span>
                        <span className="crear-publicacion__highlight-help">
                          Tu negocio se verá con un borde especial y una
                          etiqueta premium.
                          {!isAdminOrMod &&
                            negocioDestacado &&
                            negocioDestacadoPrice > 0 && (
                              <>
                                {" "}
                                {formatCLP(negocioDestacadoPrice)} · Pago único
                                vía Webpay.
                              </>
                            )}
                        </span>
                      </span>
                    )}
                  </span>

                  <div className="crear-publicacion__card-description">
                    {opcion.features && opcion.features.length > 0 && (
                      <ul className="crear-publicacion__card-features">
                        {opcion.features.map((feature, idx) => (
                          <li key={idx}>
                            <FontAwesomeIcon icon={faCheck} aria-hidden="true" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    )}

                    {opcion.description && (
                      <p className="crear-publicacion__card-description-text">
                        {opcion.description}
                      </p>
                    )}
                  </div>

                  <div className="crear-publicacion__card-side">
                    <span className="crear-publicacion__card-cta">
                      {opcion.cta}
                      <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>

          </>
        ) : (
          <div className="crear-publicacion__empty">
            <h2 className="crear-publicacion__empty-title">
              No hay opciones de publicación disponibles
            </h2>
            <p className="crear-publicacion__empty-text">
              Estamos ajustando las publicaciones en Extrovertidos. Vuelve a
              intentarlo en un rato o escríbenos si necesitas publicar ahora.
            </p>
            <Link to="/" className="crear-publicacion__empty-link">
              Volver al inicio
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};

export default CrearPublicacion;
