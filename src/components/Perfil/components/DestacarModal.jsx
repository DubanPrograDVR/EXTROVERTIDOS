
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faRocket, faTimes, faSpinner, faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { getPlanPrices } from "../../../lib/database/settings";
import "./styles/destacar-modal.css";

export default function DestacarModal({ isOpen, onClose, onConfirm, type, item, isProcessing }) {
  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getPlanPrices().then(prices => {
        const priceKey = type === "panorama" ? "publicacion_destacada" : "negocio_destacado";
        setPrice(prices[priceKey] || 0);
        setLoading(false);
      }).catch(err => {
        console.error("Error cargando precio", err);
        setLoading(false);
      });
    }
  }, [isOpen, type]);

  if (!isOpen || !item) return null;

  const isPanorama = type === "panorama";
  const icon = isPanorama ? faStar : faRocket;
  const title = isPanorama ? "Destacar mi panorama" : "Destacar mi negocio";
  const message = isPanorama ? "Vas a destacar tu panorama" : "Vas a destacar tu negocio";
  const objectType = isPanorama ? "publicación" : "negocio";

  return (
    <div className="perfil-destacar-modal-overlay" onClick={onClose}>
      <div className="perfil-destacar-modal" onClick={e => e.stopPropagation()}>
        <button className="perfil-destacar-modal__close" onClick={onClose} disabled={isProcessing} aria-label="Cerrar">
          <FontAwesomeIcon icon={faTimes} />
        </button>
        
        <h3 className="perfil-destacar-modal__header">{title}</h3>
        
        <div className="perfil-destacar-modal__content">
          <div className="perfil-destacar-modal__icon">
            <FontAwesomeIcon icon={icon} />
          </div>
          
          <h4 className="perfil-destacar-modal__title">{message}</h4>
          <p className="perfil-destacar-modal__desc">
            Tu {objectType} aparecerá en los listados destacados y tendrá mayor visibilidad.
          </p>

          <ul className="perfil-destacar-modal__benefits">
            <li>
              <FontAwesomeIcon icon={faCircleCheck} />
              Aparece en los listados destacados
            </li>
            <li>
              <FontAwesomeIcon icon={faCircleCheck} />
              Distintivo dorado premium en tu tarjeta
            </li>
            <li>
              <FontAwesomeIcon icon={faCircleCheck} />
              Mucha mayor visibilidad ante el público
            </li>
          </ul>

          <div className="perfil-destacar-modal__price-box">
            <span className="perfil-destacar-modal__price-label">Precio a pagar</span>
            {loading ? (
              <span className="perfil-destacar-modal__price-value"><FontAwesomeIcon icon={faSpinner} spin /></span>
            ) : (
              <span className="perfil-destacar-modal__price-value">
                ${Number(price).toLocaleString("es-CL")} CLP
              </span>
            )}
          </div>
        </div>
        
        <div className="perfil-destacar-modal__actions">
          <button className="perfil-destacar-modal__btn-cancel" onClick={onClose} disabled={isProcessing}>
            Cancelar
          </button>
          <button 
            className="perfil-destacar-modal__btn-confirm" 
            onClick={() => onConfirm(item)}
            disabled={isProcessing || loading}
          >
            {isProcessing ? (
              <><FontAwesomeIcon icon={faSpinner} spin /> Procesando...</>
            ) : (
              "Continuar al pago"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

