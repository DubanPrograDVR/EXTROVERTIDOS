import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { isPlanesEnabled } from "../../lib/database";
import { initiatePayment, PaymentError } from "../../lib/payment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faArrowRight,
  faStar,
  faCrown,
  faRocket,
  faStore,
  faCalendarDays,
  faInfinity,
  faPlus,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import "./styles/activar-plan.css";

// Iconos del sitio
const logoExtro = "/img/Logo_extrovertidos.png";
const iconPanorama = "/img/P_Extro.png";
const iconExtro = "/img/E_Extro.png";
const iconSuperguia = "/img/SG_Extro.png";

/**
 * Planes de Panoramas disponibles
 */
const PLANES_PANORAMAS = [
  {
    id: "unica",
    nombre: "Publicación Única",
    descripcion: "Publica un panorama individual",
    precio: 25000,
    icon: faStar,
    features: [
      "1 publicación de panorama",
      "Visible por 30 días",
      "Imágenes incluidas",
      "Soporte básico",
    ],
    destacado: false,
  },
  {
    id: "pack4",
    nombre: "Pack 4 Publicaciones",
    descripcion: "¡Publica Tus 4 Panoramas!",
    precio: 39990,
    precioOriginal: 100000,
    icon: faRocket,
    duracion: "Plan 30 días",
    features: [
      "4 publicaciones de panorama",
      "Visible por 30 días",
      "Imágenes ilimitadas",
      "Soporte prioritario",
      "Estadísticas básicas",
    ],
    destacado: true,
    etiqueta: "Más Popular",
  },
  {
    id: "ilimitado",
    nombre: "Publica Sin Límite",
    descripcion: "¡Publica Todos Tus Panoramas!",
    precio: 70000,
    icon: faCrown,
    duracion: "Plan 30 días",
    features: [
      "Publicaciones ilimitadas",
      "Visible por 30 días",
      "Imágenes ilimitadas",
      "Soporte VIP",
      "Estadísticas completas",
      "Prioridad en el feed",
    ],
    destacado: false,
  },
];

/**
 * Plan de Superguía (negocios)
 */
const PLAN_SUPERGUIA = {
  id: "superguia",
  nombre: "Superguía Extrovertidos",
  descripcion: "¡Publica Tu Negocio!",
  precio: 15000,
  duracion: "365 días",
  features: [
    "Tu negocio visible todo el año",
    "Perfil completo del negocio",
    "Horarios y contacto",
    "Ubicación en mapa",
  ],
};

/**
 * Formateador de precios CLP
 */
const formatPrecio = (precio) => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(precio);
};

export default function ActivarPlan() {
  const { user, isAuthenticated, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [addSuperguia, setAddSuperguia] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Verificar si los planes están habilitados
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const enabled = await isPlanesEnabled();
        // Si no está habilitado y no es admin, redirigir
        if (!enabled && !isAdmin) {
          navigate("/", { replace: true });
          return;
        }
      } catch (error) {
        console.error("Error verificando acceso a planes:", error);
      } finally {
        setCheckingAccess(false);
      }
    };

    if (!loading) {
      checkAccess();
    }
  }, [loading, isAdmin, navigate]);

  // Calcular total
  const getTotal = () => {
    let total = 0;
    if (selectedPlan) {
      const plan = PLANES_PANORAMAS.find((p) => p.id === selectedPlan);
      if (plan) total += plan.precio;
    }
    if (addSuperguia) total += PLAN_SUPERGUIA.precio;
    return total;
  };

  const handleSiguiente = async () => {
    if (!selectedPlan && !addSuperguia) return;
    if (processingPayment) return;

    setProcessingPayment(true);

    try {
      // Iniciar el pago con Transbank a través de la Edge Function
      // La función valida los montos server-side y redirige a Transbank
      await initiatePayment({
        panoramaPlan: selectedPlan,
        addSuperguia,
        resourceId: null, // TODO: pasar business UUID cuando se implemente selección de negocio
      });
      // Si llegamos aquí, el usuario será redirigido a Transbank
      // (la función initiatePayment hace un form.submit() que redirige)
    } catch (error) {
      console.error("Error al iniciar pago:", error);
      setProcessingPayment(false);

      if (error instanceof PaymentError) {
        switch (error.code) {
          case "AUTH_REQUIRED":
            showToast("Debes iniciar sesión para realizar un pago", "error");
            break;
          case "CREATE_FAILED":
            showToast(
              error.message || "Error al iniciar el pago. Intenta nuevamente.",
              "error",
            );
            break;
          default:
            showToast(error.message || "Error al procesar el pago", "error");
        }
      } else {
        showToast("Error inesperado. Por favor intenta nuevamente.", "error");
      }
    }
  };

  if (loading || checkingAccess) {
    return (
      <div className="activar-plan__loading">
        <div className="activar-plan__spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="activar-plan">
      {/* Progress bar */}
      <div className="activar-plan__progress">
        <div className="activar-plan__progress-bar">
          <div
            className="activar-plan__progress-fill"
            style={{ width: "33%" }}></div>
        </div>
        <span className="activar-plan__progress-text">Paso 1 de 3</span>
      </div>

      {/* Header */}
      <header className="activar-plan__header">
        <img
          src={logoExtro}
          alt="Extrovertidos"
          className="activar-plan__logo"
        />
        <h1 className="activar-plan__title">¡Elige tu mejor opción!</h1>
        <p className="activar-plan__subtitle">
          Selecciona una alternativa para Publicar tus Panoramas
        </p>
      </header>

      {/* Planes de Panoramas */}
      <section className="activar-plan__section">
        <div className="activar-plan__section-header">
          <img
            src={iconPanorama}
            alt="Panoramas"
            className="activar-plan__section-icon"
          />
          <h2 className="activar-plan__section-title">Panoramas</h2>
        </div>

        <div className="activar-plan__cards">
          {PLANES_PANORAMAS.map((plan) => (
            <div
              key={plan.id}
              className={`activar-plan__card ${
                plan.destacado ? "activar-plan__card--featured" : ""
              } ${selectedPlan === plan.id ? "activar-plan__card--selected" : ""}`}
              onClick={() => setSelectedPlan(plan.id)}>
              {/* Etiqueta destacada */}
              {plan.etiqueta && (
                <span className="activar-plan__card-badge">
                  {plan.etiqueta}
                </span>
              )}

              {/* Icono del plan */}
              <div className="activar-plan__card-icon">
                <img
                  src={iconPanorama}
                  alt=""
                  className="activar-plan__card-icon-img"
                />
              </div>

              {/* Info del plan */}
              <h3 className="activar-plan__card-name">{plan.nombre}</h3>
              <p className="activar-plan__card-desc">{plan.descripcion}</p>

              {/* Precio */}
              <div className="activar-plan__card-pricing">
                {plan.precioOriginal && (
                  <span className="activar-plan__card-original">
                    {formatPrecio(plan.precioOriginal)}
                  </span>
                )}
                <span className="activar-plan__card-price">
                  {formatPrecio(plan.precio)}
                </span>
              </div>

              {/* Duración */}
              {plan.duracion && (
                <span className="activar-plan__card-duration">
                  {plan.duracion}
                </span>
              )}

              {/* Features */}
              <ul className="activar-plan__card-features">
                {plan.features.map((feat, i) => (
                  <li key={i}>
                    <FontAwesomeIcon icon={faCheck} />
                    {feat}
                  </li>
                ))}
              </ul>

              {/* Botón seleccionar */}
              <button
                type="button"
                className={`activar-plan__card-btn ${
                  selectedPlan === plan.id
                    ? "activar-plan__card-btn--active"
                    : ""
                }`}>
                {selectedPlan === plan.id ? (
                  <>
                    <FontAwesomeIcon icon={faCheck} /> Seleccionado
                  </>
                ) : (
                  "Seleccionar"
                )}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Plan Superguía */}
      <section className="activar-plan__section activar-plan__section--superguia">
        <div className="activar-plan__section-header">
          <img
            src={iconExtro}
            alt="Extrovertidos"
            className="activar-plan__section-icon"
          />
          <h2 className="activar-plan__section-title">
            Superguía Extrovertidos
          </h2>
        </div>

        <div
          className={`activar-plan__superguia ${
            addSuperguia ? "activar-plan__superguia--selected" : ""
          }`}
          onClick={() => setAddSuperguia(!addSuperguia)}>
          <div className="activar-plan__superguia-content">
            <div className="activar-plan__superguia-icon">
              <FontAwesomeIcon icon={faStore} />
            </div>
            <div className="activar-plan__superguia-info">
              <h3>{PLAN_SUPERGUIA.descripcion}</h3>
              <div className="activar-plan__superguia-price">
                <span className="activar-plan__superguia-amount">
                  {formatPrecio(PLAN_SUPERGUIA.precio)}
                </span>
                <span className="activar-plan__superguia-duration">
                  <FontAwesomeIcon icon={faCalendarDays} /> ¡Por{" "}
                  {PLAN_SUPERGUIA.duracion}!
                </span>
              </div>
              <ul className="activar-plan__superguia-features">
                {PLAN_SUPERGUIA.features.map((feat, i) => (
                  <li key={i}>
                    <FontAwesomeIcon icon={faCheck} /> {feat}
                  </li>
                ))}
              </ul>
              <p className="activar-plan__superguia-slogan">
                ¡Haz que siempre te encuentren!
              </p>
            </div>
          </div>
          <button
            type="button"
            className={`activar-plan__superguia-btn ${
              addSuperguia ? "activar-plan__superguia-btn--active" : ""
            }`}>
            {addSuperguia ? (
              <>
                <FontAwesomeIcon icon={faCheck} /> Agregado
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faPlus} /> Agregar
              </>
            )}
          </button>
        </div>
      </section>

      {/* Footer con resumen y botón siguiente */}
      <footer className="activar-plan__footer">
        <div className="activar-plan__footer-summary">
          {(selectedPlan || addSuperguia) && (
            <div className="activar-plan__total">
              <span className="activar-plan__total-label">Total:</span>
              <span className="activar-plan__total-amount">
                {formatPrecio(getTotal())}
              </span>
            </div>
          )}
        </div>
        <button
          type="button"
          className="activar-plan__next-btn"
          disabled={(!selectedPlan && !addSuperguia) || processingPayment}
          onClick={handleSiguiente}>
          {processingPayment ? (
            <>Procesando pago...</>
          ) : (
            <>
              Pagar con Webpay
              <FontAwesomeIcon icon={faChevronRight} />
            </>
          )}
        </button>
      </footer>
    </div>
  );
}
