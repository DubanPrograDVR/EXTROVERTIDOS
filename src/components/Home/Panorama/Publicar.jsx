import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faClock,
  faLocationDot,
  faPhone,
  faImage,
  faTag,
  faInfoCircle,
  faBuilding,
  faMusic,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import {
  faInstagram,
  faFacebook,
  faWhatsapp,
  faGoogle,
} from "@fortawesome/free-brands-svg-icons";
import "./styles/publicar.css";

const TIPO_PUBLICACION = [
  { value: "evento", label: "Evento", icon: faMusic },
  { value: "negocio", label: "Negocio", icon: faBuilding },
];

const CATEGORIAS = [
  "Deportes",
  "Música",
  "Arte y Cultura",
  "Gastronomía",
  "Tecnología",
  "Salud y Bienestar",
  "Educación",
  "Entretenimiento",
  "Negocios",
  "Otro",
];

const Publicar = () => {
  const { isAuthenticated, signInWithGoogle } = useAuth();

  // Estado del formulario
  const [formData, setFormData] = useState({
    tipo: "evento",
    titulo: "",
    subtitulo: "",
    descripcion: "",
    categoria: "",
    fecha: "",
    hora: "",
    direccion: "",
    ciudad: "",
    entrada: "",
    contacto: "",
    instagram: "",
    facebook: "",
    whatsapp: "",
    imagen: null,
  });

  // Estado del modal de autenticación
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Verificar autenticación al hacer foco en campos
  const handleFieldFocus = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    }
  };

  // Login con Google
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        console.error("Error al iniciar sesión con Google:", error);
        alert("Error al iniciar sesión con Google. Intenta nuevamente.");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Manejar cambios en inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Limpiar error del campo
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Manejar cambio de imagen
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          imagen: "La imagen no debe superar los 5MB",
        }));
        return;
      }
      setFormData((prev) => ({ ...prev, imagen: file }));
      setPreviewImage(URL.createObjectURL(file));
      setErrors((prev) => ({ ...prev, imagen: "" }));
    }
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = "El título es obligatorio";
    }
    if (!formData.descripcion.trim()) {
      newErrors.descripcion = "La descripción es obligatoria";
    }
    if (!formData.categoria) {
      newErrors.categoria = "Selecciona una categoría";
    }
    if (!formData.direccion.trim()) {
      newErrors.direccion = "La dirección es obligatoria";
    }
    if (!formData.ciudad.trim()) {
      newErrors.ciudad = "La ciudad es obligatoria";
    }
    if (formData.tipo === "evento" && !formData.fecha) {
      newErrors.fecha = "La fecha es obligatoria para eventos";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Verificar autenticación
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    // Validar formulario
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Aquí iría la lógica para enviar a Supabase
      console.log("Datos del formulario:", formData);

      // Simular envío
      await new Promise((resolve) => setTimeout(resolve, 1500));

      alert("¡Publicación creada exitosamente!");
      // Resetear formulario
      setFormData({
        tipo: "evento",
        titulo: "",
        subtitulo: "",
        descripcion: "",
        categoria: "",
        fecha: "",
        hora: "",
        direccion: "",
        ciudad: "",
        entrada: "",
        contacto: "",
        instagram: "",
        facebook: "",
        whatsapp: "",
        imagen: null,
      });
      setPreviewImage(null);
    } catch (error) {
      console.error("Error al crear publicación:", error);
      alert("Error al crear la publicación. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cerrar modal de autenticación
  const closeAuthModal = () => setShowAuthModal(false);

  return (
    <div className="publicar-page">
      {/* Header con logo */}
      <header className="publicar-header">
        <img
          src="/img/Logo_extrovertidos.png"
          alt="Extrovertidos"
          className="publicar-header__logo"
        />
        <h1 className="publicar-header__title">Publica tu Evento o Negocio</h1>
        <p className="publicar-header__subtitle">
          Comparte con la comunidad de Extrovertidos y llega a miles de personas
        </p>
      </header>

      {/* Información previa */}
      <section className="publicar-info">
        <div className="publicar-info__container">
          <h2 className="publicar-info__title">
            <FontAwesomeIcon icon={faInfoCircle} />
            ¿Cómo funciona?
          </h2>
          <div className="publicar-info__steps">
            <div className="publicar-info__step">
              <span className="publicar-info__step-number">1</span>
              <p>Completa el formulario con los detalles de tu publicación</p>
            </div>
            <div className="publicar-info__step">
              <span className="publicar-info__step-number">2</span>
              <p>
                Sube una imagen atractiva que represente tu evento o negocio
              </p>
            </div>
            <div className="publicar-info__step">
              <span className="publicar-info__step-number">3</span>
              <p>Revisa la información y haz clic en "Publicar"</p>
            </div>
            <div className="publicar-info__step">
              <span className="publicar-info__step-number">4</span>
              <p>¡Tu publicación estará visible para toda la comunidad!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Formulario */}
      <section className="publicar-form-section">
        <form
          className="publicar-form"
          onSubmit={handleSubmit}
          onFocus={handleFieldFocus}>
          {/* Tipo de publicación */}
          <div className="publicar-form__group publicar-form__group--tipo">
            <label className="publicar-form__label">Tipo de Publicación</label>
            <div className="publicar-form__tipo-options">
              {TIPO_PUBLICACION.map((tipo) => (
                <button
                  key={tipo.value}
                  type="button"
                  className={`publicar-form__tipo-btn ${
                    formData.tipo === tipo.value ? "active" : ""
                  }`}
                  onClick={() => {
                    if (!isAuthenticated) {
                      setShowAuthModal(true);
                      return;
                    }
                    setFormData((prev) => ({ ...prev, tipo: tipo.value }));
                  }}>
                  <FontAwesomeIcon icon={tipo.icon} />
                  {tipo.label}
                </button>
              ))}
            </div>
          </div>

          {/* Título */}
          <div className="publicar-form__group">
            <label className="publicar-form__label" htmlFor="titulo">
              Título *
            </label>
            <input
              type="text"
              id="titulo"
              name="titulo"
              className={`publicar-form__input ${errors.titulo ? "error" : ""}`}
              placeholder="Ej: Festival de Música 2025"
              value={formData.titulo}
              onChange={handleChange}
              maxLength={100}
            />
            {errors.titulo && (
              <span className="publicar-form__error">{errors.titulo}</span>
            )}
          </div>

          {/* Subtítulo */}
          <div className="publicar-form__group">
            <label className="publicar-form__label" htmlFor="subtitulo">
              Subtítulo (opcional)
            </label>
            <input
              type="text"
              id="subtitulo"
              name="subtitulo"
              className="publicar-form__input"
              placeholder="Ej: La mejor experiencia musical del año"
              value={formData.subtitulo}
              onChange={handleChange}
              maxLength={150}
            />
          </div>

          {/* Descripción */}
          <div className="publicar-form__group">
            <label className="publicar-form__label" htmlFor="descripcion">
              Descripción *
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              className={`publicar-form__textarea ${
                errors.descripcion ? "error" : ""
              }`}
              placeholder="Describe tu evento o negocio en detalle..."
              value={formData.descripcion}
              onChange={handleChange}
              rows={5}
              maxLength={1000}
            />
            <span className="publicar-form__char-count">
              {formData.descripcion.length}/1000
            </span>
            {errors.descripcion && (
              <span className="publicar-form__error">{errors.descripcion}</span>
            )}
          </div>

          {/* Categoría */}
          <div className="publicar-form__group">
            <label className="publicar-form__label" htmlFor="categoria">
              <FontAwesomeIcon icon={faTag} /> Categoría *
            </label>
            <select
              id="categoria"
              name="categoria"
              className={`publicar-form__select ${
                errors.categoria ? "error" : ""
              }`}
              value={formData.categoria}
              onChange={handleChange}>
              <option value="">Selecciona una categoría</option>
              {CATEGORIAS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.categoria && (
              <span className="publicar-form__error">{errors.categoria}</span>
            )}
          </div>

          {/* Fecha y Hora (solo para eventos) */}
          {formData.tipo === "evento" && (
            <div className="publicar-form__row">
              <div className="publicar-form__group">
                <label className="publicar-form__label" htmlFor="fecha">
                  <FontAwesomeIcon icon={faCalendarDays} /> Fecha *
                </label>
                <input
                  type="date"
                  id="fecha"
                  name="fecha"
                  className={`publicar-form__input ${
                    errors.fecha ? "error" : ""
                  }`}
                  value={formData.fecha}
                  onChange={handleChange}
                />
                {errors.fecha && (
                  <span className="publicar-form__error">{errors.fecha}</span>
                )}
              </div>

              <div className="publicar-form__group">
                <label className="publicar-form__label" htmlFor="hora">
                  <FontAwesomeIcon icon={faClock} /> Hora
                </label>
                <input
                  type="time"
                  id="hora"
                  name="hora"
                  className="publicar-form__input"
                  value={formData.hora}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {/* Ubicación */}
          <div className="publicar-form__row">
            <div className="publicar-form__group">
              <label className="publicar-form__label" htmlFor="direccion">
                <FontAwesomeIcon icon={faLocationDot} /> Dirección *
              </label>
              <input
                type="text"
                id="direccion"
                name="direccion"
                className={`publicar-form__input ${
                  errors.direccion ? "error" : ""
                }`}
                placeholder="Ej: Av. Principal 123"
                value={formData.direccion}
                onChange={handleChange}
              />
              {errors.direccion && (
                <span className="publicar-form__error">{errors.direccion}</span>
              )}
            </div>

            <div className="publicar-form__group">
              <label className="publicar-form__label" htmlFor="ciudad">
                Ciudad *
              </label>
              <input
                type="text"
                id="ciudad"
                name="ciudad"
                className={`publicar-form__input ${
                  errors.ciudad ? "error" : ""
                }`}
                placeholder="Ej: Talca"
                value={formData.ciudad}
                onChange={handleChange}
              />
              {errors.ciudad && (
                <span className="publicar-form__error">{errors.ciudad}</span>
              )}
            </div>
          </div>

          {/* Entrada (solo para eventos) */}
          {formData.tipo === "evento" && (
            <div className="publicar-form__group">
              <label className="publicar-form__label" htmlFor="entrada">
                Tipo de Entrada
              </label>
              <input
                type="text"
                id="entrada"
                name="entrada"
                className="publicar-form__input"
                placeholder="Ej: $10.000 / Gratuita"
                value={formData.entrada}
                onChange={handleChange}
              />
            </div>
          )}

          {/* Contacto */}
          <div className="publicar-form__group">
            <label className="publicar-form__label" htmlFor="contacto">
              <FontAwesomeIcon icon={faPhone} /> Teléfono de Contacto
            </label>
            <input
              type="tel"
              id="contacto"
              name="contacto"
              className="publicar-form__input"
              placeholder="Ej: +56 9 1234 5678"
              value={formData.contacto}
              onChange={handleChange}
            />
          </div>

          {/* Redes Sociales */}
          <div className="publicar-form__group">
            <label className="publicar-form__label">Redes Sociales</label>
            <div className="publicar-form__social-inputs">
              <div className="publicar-form__social-input">
                <FontAwesomeIcon icon={faInstagram} />
                <input
                  type="url"
                  name="instagram"
                  placeholder="URL de Instagram"
                  value={formData.instagram}
                  onChange={handleChange}
                />
              </div>
              <div className="publicar-form__social-input">
                <FontAwesomeIcon icon={faFacebook} />
                <input
                  type="url"
                  name="facebook"
                  placeholder="URL de Facebook"
                  value={formData.facebook}
                  onChange={handleChange}
                />
              </div>
              <div className="publicar-form__social-input">
                <FontAwesomeIcon icon={faWhatsapp} />
                <input
                  type="text"
                  name="whatsapp"
                  placeholder="Número de WhatsApp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Imagen */}
          <div className="publicar-form__group">
            <label className="publicar-form__label">
              <FontAwesomeIcon icon={faImage} /> Imagen
            </label>
            <div className="publicar-form__image-upload">
              <input
                type="file"
                id="imagen"
                name="imagen"
                accept="image/*"
                onChange={handleImageChange}
                className="publicar-form__file-input"
              />
              <label htmlFor="imagen" className="publicar-form__file-label">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="publicar-form__preview"
                  />
                ) : (
                  <>
                    <FontAwesomeIcon icon={faImage} />
                    <span>Haz clic para subir una imagen</span>
                    <span className="publicar-form__file-hint">
                      PNG, JPG hasta 5MB
                    </span>
                  </>
                )}
              </label>
            </div>
            {errors.imagen && (
              <span className="publicar-form__error">{errors.imagen}</span>
            )}
          </div>

          {/* Botón de envío */}
          <button
            type="submit"
            className="publicar-form__submit"
            disabled={isSubmitting}>
            {isSubmitting ? "Publicando..." : "Publicar"}
          </button>
        </form>
      </section>

      {/* Modal de autenticación */}
      {showAuthModal && (
        <div className="auth-modal-overlay" onClick={closeAuthModal}>
          <div
            className="auth-modal auth-modal--simple"
            onClick={(e) => e.stopPropagation()}>
            <button className="auth-modal__close" onClick={closeAuthModal}>
              <FontAwesomeIcon icon={faTimes} />
            </button>

            <img
              src="/img/Logo_extrovertidos.png"
              alt="Extrovertidos"
              className="auth-modal__logo"
            />

            <h2 className="auth-modal__title">¡Regístrate para publicar!</h2>
            <p className="auth-modal__message">
              Para poder crear una publicación tienes que registrarte
            </p>

            <button
              className="auth-form__google-btn"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}>
              <FontAwesomeIcon icon={faGoogle} />
              {isGoogleLoading ? "Conectando..." : "Continuar con Google"}
            </button>

            <p className="auth-modal__terms">
              Al continuar, aceptas nuestros{" "}
              <a href="#">Términos de Servicio</a> y{" "}
              <a href="#">Política de Privacidad</a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Publicar;
