import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faBullhorn,
  faStar,
  faCrown,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { PUBLICATION_TYPES } from "../constants";
import { getPlanPrices } from "../../../../lib/database";
import { useAuth } from "../../../../context/AuthContext";
import "../styles/publication-type-modal.css";

const P_EXTRO_LOGO = "/img/P_Extro_v2.png";

const formatCLP = (amount) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(amount);

/**
 * Modal para elegir el tipo de publicación antes de enviar el formulario.
 *
 * Diseñado para ser escalable: si en el futuro se agregan más tipos
 * (Premium, Patrocinada, Urgente, etc.), basta con agregar una entrada en el
 * arreglo `options` y su valor correspondiente en `PUBLICATION_TYPES`.
 */
export default function PublicationTypeModal({
  isOpen,
  onClose,
  onSelect,
  isSubmitting = false,
}) {
  const { isAdmin, isModerator } = useAuth();
  const isAdminOrMod = isAdmin || isModerator;

  const [precioDestacada, setPrecioDestacada] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [pendingType, setPendingType] = useState(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;

    setLoadingPrice(true);
    getPlanPrices()
      .then((prices) => {
        if (!cancelled) {
          setPrecioDestacada(Number(prices?.publicacion_destacada) || 0);
        }
      })
      .catch((error) => {
        console.warn("[PublicationTypeModal] Error cargando precios:", error);
      })
      .finally(() => {
        if (!cancelled) setLoadingPrice(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) setPendingType(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (event) => {
      if (event.key === "Escape" && !isSubmitting) onClose?.();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, isSubmitting, onClose]);

  const options = useMemo(
    () => [
      {
        type: PUBLICATION_TYPES.NORMAL,
        icon: faBullhorn,
        title: "Publicación Normal",
        priceLabel: "Gratis",
        description:
          "Tu publicación aparecerá en la sección de Panoramas después de la revisión del equipo.",
        highlights: ["Sin costo", "Aparece en Panoramas", "Revisión estándar"],
        ctaLabel: "Publicar gratis",
        variant: "normal",
      },
      {
        type: PUBLICATION_TYPES.DESTACADA,
        icon: faCrown,
        title: "Publicación Destacada",
        priceLabel: isAdminOrMod
          ? null
          : loadingPrice
            ? "Cargando..."
            : precioDestacada
              ? formatCLP(precioDestacada)
              : "Precio no disponible",
        description: isAdminOrMod
          ? "Diseño premium con borde dorado y distintivo especial. Se publicará directamente en Panoramas Destacados sin costo adicional."
          : "Diseño premium con borde dorado y distintivo especial. Tras el pago, la revisará el equipo y aparecerá en Panoramas Destacados.",
        highlights: isAdminOrMod
          ? [
              "Borde dorado y badge Extro",
              "Aparece en Panoramas Destacados",
              "Sin costo adicional",
            ]
          : [
              "Borde dorado y badge Extro",
              "Aparece en Panoramas Destacados",
              "Pago único vía Webpay",
            ],
        ctaLabel: isAdminOrMod ? "Publicar panorama destacado" : "Ir a pagar",
        variant: "destacada",
        featured: true,
      },
    ],
    [isAdminOrMod, loadingPrice, precioDestacada],
  );

  const handleSelect = (type) => {
    if (isSubmitting || pendingType) return;
    setPendingType(type);
    onSelect?.(type);
  };

  if (!isOpen) return null;

  const modal = (
    <div
      className="publication-type-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publication-type-title"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose?.();
        }
      }}>
      <div className="publication-type-modal">
        <button
          type="button"
          className="publication-type-modal__close"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Cerrar">
          <FontAwesomeIcon icon={faTimes} />
        </button>

        <header className="publication-type-modal__header">
          <img
            src={P_EXTRO_LOGO}
            alt=""
            aria-hidden="true"
            className="publication-type-modal__header-icon"
          />
          <h2
            id="publication-type-title"
            className="publication-type-modal__title">
            Elige el tipo de tu publicación
          </h2>
          <p className="publication-type-modal__subtitle">
            Selecciona la opción que mejor se adapte a tu evento.
          </p>
        </header>

        <div className="publication-type-modal__options">
          {options.map((option) => {
            const isBusy = pendingType === option.type && isSubmitting;
            return (
              <button
                key={option.type}
                type="button"
                className={`publication-type-option publication-type-option--${option.variant} ${
                  option.featured ? "publication-type-option--featured" : ""
                }`}
                onClick={() => handleSelect(option.type)}
                disabled={
                  isSubmitting ||
                  (!isAdminOrMod &&
                    option.type === PUBLICATION_TYPES.DESTACADA &&
                    !precioDestacada &&
                    !loadingPrice)
                }
                aria-busy={isBusy}>
                <div className="publication-type-option__icon">
                  <FontAwesomeIcon icon={option.icon} />
                </div>
                <h3 className="publication-type-option__title">
                  {option.title}
                </h3>
                {option.priceLabel && (
                  <p className="publication-type-option__price">
                    {option.priceLabel}
                  </p>
                )}
                <p className="publication-type-option__description">
                  {option.description}
                </p>
                <ul className="publication-type-option__highlights">
                  {option.highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <span className="publication-type-option__cta">
                  {isBusy ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      Procesando...
                    </>
                  ) : (
                    option.ctaLabel
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <p className="publication-type-modal__note">
          Podrás cambiar el tipo desde el panel Admin más adelante.
        </p>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
