import { useState, useEffect } from "react";
import "./styles/authModal.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faEnvelope,
  faLock,
  faUser,
  faEye,
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";
import { faGoogle, faFacebookF } from "@fortawesome/free-brands-svg-icons";

export default function AuthModal({ isOpen, onClose, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => setMode(initialMode), [initialMode]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => (document.body.style.overflow = "unset");
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === "register" && formData.password !== formData.confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }
    console.log(mode === "login" ? "Login:" : "Register:", formData);
  };

  const updateForm = (field, value) =>
    setFormData({ ...formData, [field]: value });

  if (!isOpen) return null;

  return (
    <div
      className="auth-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal">
        <button className="auth-modal__close" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>

        <div className="auth-modal__logo">
          <img src="/img/Logo_extrovertidos.png" alt="Extrovertidos" />
        </div>

        <div className="auth-modal__tabs">
          <button
            className={`auth-modal__tab ${mode === "login" ? "active" : ""}`}
            onClick={() => setMode("login")}>
            Iniciar Sesión
          </button>
          <button
            className={`auth-modal__tab ${mode === "register" ? "active" : ""}`}
            onClick={() => setMode("register")}>
            Registrarse
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <div className="auth-form__input-wrapper">
              <FontAwesomeIcon icon={faUser} className="auth-form__icon" />
              <input
                type="text"
                placeholder="Nombre completo"
                value={formData.name}
                onChange={(e) => updateForm("name", e.target.value)}
                required
              />
            </div>
          )}

          <div className="auth-form__input-wrapper">
            <FontAwesomeIcon icon={faEnvelope} className="auth-form__icon" />
            <input
              type="email"
              placeholder="Correo electrónico"
              value={formData.email}
              onChange={(e) => updateForm("email", e.target.value)}
              required
            />
          </div>

          <div className="auth-form__input-wrapper">
            <FontAwesomeIcon icon={faLock} className="auth-form__icon" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              value={formData.password}
              onChange={(e) => updateForm("password", e.target.value)}
              required
            />
            <button
              type="button"
              className="auth-form__toggle-password"
              onClick={() => setShowPassword(!showPassword)}>
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
            </button>
          </div>

          {mode === "register" && (
            <div className="auth-form__input-wrapper">
              <FontAwesomeIcon icon={faLock} className="auth-form__icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Confirmar contraseña"
                value={formData.confirmPassword}
                onChange={(e) => updateForm("confirmPassword", e.target.value)}
                required
              />
            </div>
          )}

          {mode === "login" && (
            <div className="auth-form__options">
              <label className="auth-form__checkbox">
                <input type="checkbox" /> Recordarme
              </label>
              <a href="#" className="auth-form__forgot">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          )}

          {mode === "register" && (
            <div className="auth-form__options">
              <label className="auth-form__checkbox">
                <input type="checkbox" required /> Acepto los{" "}
                <a href="#" className="auth-form__link">
                  términos y condiciones
                </a>
              </label>
            </div>
          )}

          <button type="submit" className="auth-form__submit">
            {mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
          </button>

          <div className="auth-form__divider">
            <span>o continúa con</span>
          </div>

          <div className="auth-form__social">
            <button type="button" className="auth-form__social-btn google">
              <FontAwesomeIcon icon={faGoogle} /> Google
            </button>
            <button type="button" className="auth-form__social-btn facebook">
              <FontAwesomeIcon icon={faFacebookF} /> Facebook
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
