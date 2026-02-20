import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  parsePaymentResult,
  getPaymentStatus,
  formatCLP,
  PAYMENT_STATUS,
} from "../../lib/payment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faTimesCircle,
  faExclamationTriangle,
  faArrowLeft,
  faReceipt,
  faSpinner,
  faCreditCard,
  faCalendarCheck,
  faHashtag,
} from "@fortawesome/free-solid-svg-icons";
import "./styles/payment-result.css";

// Logos del sitio
const logoExtro = "/img/Logo_extrovertidos.png";

/**
 * Página de resultado de pago.
 * Se muestra después de que el usuario completa (o abandona)
 * el flujo de pago en Transbank.
 *
 * Lee los query params del redirect y verifica el estado
 * de la transacción contra el servidor.
 */
export default function PaymentResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [paymentData, setPaymentData] = useState(null);
  const [serverStatus, setServerStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Parsear resultado de los query params
  useEffect(() => {
    const result = parsePaymentResult(location.search);
    setPaymentData(result);

    // Si tenemos un buy_order, verificar contra el servidor
    if (result.buyOrder && isAuthenticated) {
      verifyWithServer(result.buyOrder);
    } else {
      setLoading(false);
    }
  }, [location.search, isAuthenticated]);

  /**
   * Verifica el estado real de la transacción contra el servidor.
   * No confiamos solo en los query params del redirect.
   */
  async function verifyWithServer(buyOrder) {
    try {
      const { transaction } = await getPaymentStatus(buyOrder);
      setServerStatus(transaction);
    } catch (err) {
      console.warn("No se pudo verificar con el servidor:", err);
      // No es crítico: usamos los query params como fallback
    } finally {
      setLoading(false);
    }
  }

  // Determinar el estado final (priorizar datos del servidor)
  const finalStatus =
    serverStatus?.status === "completed"
      ? PAYMENT_STATUS.SUCCESS
      : serverStatus?.status === "failed"
        ? PAYMENT_STATUS.FAILED
        : paymentData?.status || PAYMENT_STATUS.ERROR;

  const finalAmount = serverStatus?.amount || paymentData?.amount;
  const finalBuyOrder = serverStatus?.buy_order || paymentData?.buyOrder;
  const finalAuthCode =
    serverStatus?.authorization_code || paymentData?.authorizationCode;
  const finalCardLast = serverStatus?.card_last_four;

  // Estado de carga
  if (authLoading || loading) {
    return (
      <div className="payment-result">
        <div className="payment-result__loading">
          <FontAwesomeIcon icon={faSpinner} spin size="2x" />
          <p>Verificando el estado de tu pago...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-result">
      <div className="payment-result__container">
        {/* Logo */}
        <img
          src={logoExtro}
          alt="Extrovertidos"
          className="payment-result__logo"
        />

        {/* ───── ÉXITO ───── */}
        {finalStatus === PAYMENT_STATUS.SUCCESS && (
          <div className="payment-result__card payment-result__card--success">
            <div className="payment-result__icon-wrapper payment-result__icon-wrapper--success">
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <h1 className="payment-result__title">¡Pago exitoso!</h1>
            <p className="payment-result__subtitle">
              Tu plan ha sido activado correctamente.
            </p>

            <div className="payment-result__details">
              {finalAmount && (
                <div className="payment-result__detail-row">
                  <FontAwesomeIcon icon={faCreditCard} />
                  <span className="payment-result__detail-label">Monto:</span>
                  <span className="payment-result__detail-value">
                    {formatCLP(finalAmount)}
                  </span>
                </div>
              )}
              {finalBuyOrder && (
                <div className="payment-result__detail-row">
                  <FontAwesomeIcon icon={faHashtag} />
                  <span className="payment-result__detail-label">Orden:</span>
                  <span className="payment-result__detail-value payment-result__detail-value--mono">
                    {finalBuyOrder}
                  </span>
                </div>
              )}
              {finalAuthCode && (
                <div className="payment-result__detail-row">
                  <FontAwesomeIcon icon={faReceipt} />
                  <span className="payment-result__detail-label">
                    Autorización:
                  </span>
                  <span className="payment-result__detail-value payment-result__detail-value--mono">
                    {finalAuthCode}
                  </span>
                </div>
              )}
              {finalCardLast && (
                <div className="payment-result__detail-row">
                  <FontAwesomeIcon icon={faCreditCard} />
                  <span className="payment-result__detail-label">Tarjeta:</span>
                  <span className="payment-result__detail-value">
                    **** {finalCardLast}
                  </span>
                </div>
              )}
              <div className="payment-result__detail-row">
                <FontAwesomeIcon icon={faCalendarCheck} />
                <span className="payment-result__detail-label">Fecha:</span>
                <span className="payment-result__detail-value">
                  {new Date().toLocaleDateString("es-CL", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            {/* Items comprados */}
            {serverStatus?.items && serverStatus.items.length > 0 && (
              <div className="payment-result__items">
                <h3>Planes activados:</h3>
                <ul>
                  {serverStatus.items.map((item, i) => (
                    <li key={i}>
                      {formatPlanName(item.plan)} — {formatCLP(item.amount)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ───── RECHAZADO ───── */}
        {finalStatus === PAYMENT_STATUS.FAILED && (
          <div className="payment-result__card payment-result__card--failed">
            <div className="payment-result__icon-wrapper payment-result__icon-wrapper--failed">
              <FontAwesomeIcon icon={faTimesCircle} />
            </div>
            <h1 className="payment-result__title">Pago rechazado</h1>
            <p className="payment-result__subtitle">
              {paymentData?.message ||
                "Tu banco rechazó la transacción. No se realizó ningún cargo."}
            </p>
            {finalBuyOrder && (
              <p className="payment-result__order">
                Orden: <code>{finalBuyOrder}</code>
              </p>
            )}
          </div>
        )}

        {/* ───── ABANDONADO ───── */}
        {finalStatus === PAYMENT_STATUS.ABORTED && (
          <div className="payment-result__card payment-result__card--aborted">
            <div className="payment-result__icon-wrapper payment-result__icon-wrapper--aborted">
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </div>
            <h1 className="payment-result__title">Pago cancelado</h1>
            <p className="payment-result__subtitle">
              Cancelaste el proceso de pago. No se realizó ningún cargo.
            </p>
          </div>
        )}

        {/* ───── ERROR ───── */}
        {finalStatus === PAYMENT_STATUS.ERROR && (
          <div className="payment-result__card payment-result__card--error">
            <div className="payment-result__icon-wrapper payment-result__icon-wrapper--failed">
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </div>
            <h1 className="payment-result__title">Error en el pago</h1>
            <p className="payment-result__subtitle">
              {paymentData?.message ||
                "Ocurrió un error al procesar tu pago. Por favor intenta nuevamente."}
            </p>
          </div>
        )}

        {/* Botones de acción */}
        <div className="payment-result__actions">
          {finalStatus === PAYMENT_STATUS.SUCCESS ? (
            <>
              <button
                className="payment-result__btn payment-result__btn--primary"
                onClick={() => navigate("/perfil")}>
                Ir a mi perfil
              </button>
              <button
                className="payment-result__btn payment-result__btn--secondary"
                onClick={() => navigate("/")}>
                Volver al inicio
              </button>
            </>
          ) : (
            <>
              <button
                className="payment-result__btn payment-result__btn--primary"
                onClick={() => navigate("/activar-plan")}>
                <FontAwesomeIcon icon={faArrowLeft} />
                Intentar nuevamente
              </button>
              <button
                className="payment-result__btn payment-result__btn--secondary"
                onClick={() => navigate("/")}>
                Volver al inicio
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Formatea el nombre técnico del plan a uno legible
 */
function formatPlanName(planId) {
  const names = {
    panorama_unica: "Publicación Única",
    panorama_pack4: "Pack 4 Publicaciones",
    panorama_ilimitado: "Publica Sin Límite",
    superguia: "Superguía Extrovertidos",
  };
  return names[planId] || planId;
}
