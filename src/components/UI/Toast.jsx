import { useEffect, useState } from "react";
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

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
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
