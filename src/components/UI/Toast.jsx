import { useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faTimesCircle,
  faInfoCircle,
  faExclamationTriangle,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import "./styles/toast.css";

const Toast = ({ message, type = "success", duration = 4000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const closeTimerRef = useRef(null);

  // Limpiar timer de cierre al desmontar
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    closeTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  };

  const icons = {
    success: faCheckCircle,
    error: faTimesCircle,
    info: faInfoCircle,
    warning: faExclamationTriangle,
  };

  if (!isVisible) return null;

  return (
    <div className={`toast toast--${type} ${isExiting ? "toast--exit" : ""}`}>
      <div className="toast__icon">
        <FontAwesomeIcon icon={icons[type]} />
      </div>
      <div className="toast__content">
        <p className="toast__message">{message}</p>
      </div>
      <button className="toast__close" onClick={handleClose}>
        <FontAwesomeIcon icon={faTimes} />
      </button>
    </div>
  );
};

export default Toast;
