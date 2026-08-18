import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBullhorn,
  faCrown,
  faStore,
  faCheck,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import {
  PUBLICATION_TYPES,
  FREE_PLAN_FIELDS,
  FREE_PLAN_SOCIAL_NETWORKS,
} from "../Panorama/constants";
import {
  getActivePublishSubscription,
  getPlanPrices,
} from "../../../lib/database";
import { useAuth } from "../../../context/AuthContext";
import usePlansVisibility from "../../../hooks/usePlansVisibility";
import "./styles/crear-publicacion.css";

const LOGO = "/img/Logo_con_r_v3.png";

const formatCLP = (amount) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(amount);

/** "a, b y c" */
const formatList = (items) => {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
};

// ─────────────────────────────────────────────────
// CAMPOS POR PLAN (derivados, no duplicados)
// ─────────────────────────────────────────────────
// Aquí SOLO viven las etiquetas legibles de cada campo. El reparto entre plan
// gratuito y destacado NO se escribe a mano: se deriva de FREE_PLAN_FIELDS
// (Panorama/constants), que es la única fuente de verdad. Si un campo cambia de
// plan allá, esta pantalla lo refleja sola.
const FIELD_LABELS = {
  titulo: "Título",
  descripcion: "Descripción",
  category_id: "Categoría",
  fecha_evento: "Fecha del evento",
  fecha_fin: "Eventos de varios días",
  es_recurrente: "Eventos que se repiten",
  hora_inicio: "Horarios de inicio y término",
  provincia: "Provincia",
  comuna: "Comuna",
  direccion: "Dirección exacta",
  ubicacion_url: "Ubicación en el mapa",
  tipo_entrada: "Tipo de entrada y precio",
  url_venta: "Link de venta de entradas",
  redes_sociales: "Redes sociales",
  telefono_contacto: "Teléfono de contacto",
  sitio_web: "Sitio web",
  titulo_marketing: "Mensajes de marketing",
  hashtags: "Hashtags",
  etiqueta_directa: "Etiqueta destacada",
  imagenes: "Imágenes",
};

const SOCIAL_LABELS = {
  facebook: "Facebook",
  tiktok: "TikTok",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  youtube: "YouTube",
  twitter: "X",
  linkedin: "LinkedIn",
};

/** Campos incluidos en el plan gratuito, con sus etiquetas legibles. */
const FREE_FIELD_LABELS = FREE_PLAN_FIELDS.filter(
  (field) => FIELD_LABELS[field],
).map((field) => {
  if (field === "redes_sociales") {
    const redes = FREE_PLAN_SOCIAL_NETWORKS.map(
      (red) => SOCIAL_LABELS[red] || red,
    );
    return `${FIELD_LABELS[field]} (${formatList(redes)})`;
  }
  return FIELD_LABELS[field];
});

/** Campos que solo abre el formulario completo (destacada). */
const EXTRA_FIELD_LABELS = Object.keys(FIELD_LABELS)
  .filter((field) => !FREE_PLAN_FIELDS.includes(field))
  .map((field) => FIELD_LABELS[field]);

const EXTRA_FIELDS_TEXT = formatList(EXTRA_FIELD_LABELS);

/**
 * Pantalla única de selección de tipo de publicación (/crear-publicacion).
 *
 * Reemplaza al flujo de modales (PublicationTypeModal + PlanBlockModal): una
 * sola pantalla, un solo clic hasta el formulario. Cada tarjeta es un <Link>
 * real, así que se puede abrir en pestaña nueva y es navegable por teclado.
 *
 * Las publicaciones gratuitas no dependen de los toggles comerciales de
 * suscripciones. Los toggles de destacados sí controlan las opciones pagadas.
 */
const CrearPublicacion = () => {
  const { user, isAdmin, isModerator } = useAuth();
  const isAdminOrMod = isAdmin || isModerator;

  const {
    superguiaVisible,
    destacadasEnabled,
    loading: loadingVisibility,
  } = usePlansVisibility();

  const [precioDestacada, setPrecioDestacada] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [cupoSuscripcion, setCupoSuscripcion] = useState(null);

  useEffect(() => {
    let cancelled = false;

    getPlanPrices()
      .then((prices) => {
        if (!cancelled) {
          setPrecioDestacada(Number(prices?.publicacion_destacada) || 0);
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

  useEffect(() => {
    let cancelled = false;

    if (!user?.id) {
      return undefined;
    }

    getActivePublishSubscription(user.id)
      .then((subscription) => {
        if (!cancelled) {
          setCupoSuscripcion({
            userId: user.id,
            disponible: Boolean(subscription),
          });
        }
      })
      .catch((error) => {
        console.warn(
          "[CrearPublicacion] Error cargando cupo de suscripción:",
          error,
        );
        if (!cancelled) {
          setCupoSuscripcion({ userId: user.id, disponible: false });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const tieneCupoSuscripcion = Boolean(
    user?.id &&
      cupoSuscripcion?.userId === user.id &&
      cupoSuscripcion.disponible,
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
      icon: faBullhorn,
      eyebrow: "Panorama",
      title: "Panorama gratuito",
      price: "Gratis",
      description:
        "Publica tu evento sin costo. Aparecerá en la sección de Panoramas después de la revisión del equipo.",
      featuresTitle: "Formulario básico. Incluye:",
      features: FREE_FIELD_LABELS,
      note: EXTRA_FIELDS_TEXT
        ? `No incluye: ${EXTRA_FIELDS_TEXT.toLowerCase()}.`
        : null,
      cta: "Publicar gratis",
    });

    if (destacadasEnabled) {
      items.push({
        id: "panorama-destacado",
        to: `/publicar-panorama?plan=${PUBLICATION_TYPES.DESTACADA}`,
        variant: "destacada",
        icon: faCrown,
        eyebrow: "Panorama",
        title: "Panorama destacado",
        price: precioDestacadaLabel,
        badge: "Recomendado",
        description: isAdminOrMod
          ? "Diseño premium con borde dorado y distintivo especial. Se publicará directamente en Panoramas Destacados sin costo adicional."
          : "Diseño premium con borde dorado y distintivo especial. Tras el pago, la revisará el equipo y aparecerá en Panoramas Destacados.",
        featuresTitle: "Formulario completo. Además:",
        features: [
          "Borde dorado y badge Extro",
          "Aparece en Panoramas Destacados",
          isAdminOrMod ? "Sin costo adicional" : "Pago único vía Webpay",
        ],
        note: EXTRA_FIELDS_TEXT
          ? `Suma a lo del plan gratuito: ${EXTRA_FIELDS_TEXT.toLowerCase()} y todas las redes sociales.`
          : null,
        cta: "Publicar destacado",
      });
    }

    items.push({
      id: "negocio",
      to: "/publicar-negocio",
      variant: "negocio",
      icon: faStore,
      eyebrow: "Super buscador",
      title: "Publicar un negocio",
      price: superguiaVisible ? "Plan Super buscador" : "Disponible",
      description:
        "Crea la ficha de tu negocio en la Super buscador para que te encuentren durante todo el año, no solo el día del evento.",
      featuresTitle: "La ficha incluye:",
      features: [
        "Horarios de atención y ubicación",
        "Contacto, redes sociales y galería de imágenes",
        "Categorías y búsqueda por comuna",
      ],
      note: superguiaVisible
        ? "Se activa con tu plan Super buscador y el equipo la revisa antes de publicarla."
        : "El equipo revisará tu publicación antes de mostrarla en la Super buscador.",
      cta: "Publicar mi negocio",
    });

    return items;
  }, [
    superguiaVisible,
    destacadasEnabled,
    isAdminOrMod,
    precioDestacadaLabel,
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
        <img
          src={LOGO}
          alt="Extrovertidos"
          className="crear-publicacion__logo"
        />
        <h1 className="crear-publicacion__title">¿Qué quieres publicar?</h1>
        <p className="crear-publicacion__subtitle">
          Elige una opción y te llevamos directo al formulario. Sin pasos
          intermedios.
        </p>
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
                      {opcion.badge}
                    </span>
                  )}

                  <span className="crear-publicacion__card-icon">
                    <FontAwesomeIcon icon={opcion.icon} />
                  </span>

                  <span className="crear-publicacion__card-eyebrow">
                    {opcion.eyebrow}
                  </span>

                  <h2 className="crear-publicacion__card-title">
                    {opcion.title}
                  </h2>

                  <p className="crear-publicacion__card-price">
                    {opcion.price}
                  </p>

                  <p className="crear-publicacion__card-description">
                    {opcion.description}
                  </p>

                  <p className="crear-publicacion__card-features-title">
                    {opcion.featuresTitle}
                  </p>

                  <ul className="crear-publicacion__card-features">
                    {opcion.features.map((feature) => (
                      <li key={feature}>
                        <FontAwesomeIcon icon={faCheck} aria-hidden="true" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {opcion.note && (
                    <p className="crear-publicacion__card-note">
                      {opcion.note}
                    </p>
                  )}

                  <span className="crear-publicacion__card-cta">
                    {opcion.cta}
                    <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>

            {/* Acceso secundario a las suscripciones: es el único upsell hacia
                /activar-plan que queda en el flujo de creación, pero no debe
                competir con las tres tarjetas principales. */}
            <p className="crear-publicacion__upsell">
              ¿Publicas seguido?{" "}
              <Link
                to="/activar-plan"
                className="crear-publicacion__upsell-link">
                Mira los planes de suscripción
                <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
              </Link>
            </p>
            {tieneCupoSuscripcion && (
              <p className="crear-publicacion__upsell crear-publicacion__upsell--plan">
                ¿Ya tienes un plan con cupo?{" "}
                <Link
                  to="/publicar-panorama?modo=suscripcion"
                  className="crear-publicacion__upsell-link">
                  Usar mi plan
                  <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
                </Link>
              </p>
            )}
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
