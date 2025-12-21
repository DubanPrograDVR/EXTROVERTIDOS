import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faClock,
  faLocationDot,
  faImage,
  faTag,
  faInfoCircle,
  faBuilding,
  faTimes,
  faTicket,
  faLink,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import {
  faInstagram,
  faFacebook,
  faWhatsapp,
  faGoogle,
} from "@fortawesome/free-brands-svg-icons";
import {
  getCategories,
  createEvent,
  uploadEventImage,
} from "../../../lib/database";
import "./styles/publicar.css";

// Tipos de entrada disponibles
const TIPOS_ENTRADA = [
  { value: "gratuito", label: "Gratuito" },
  { value: "pagado", label: "Pagado" },
  { value: "por_confirmar", label: "Por confirmar" },
];

// Provincias de Chile (Región del Maule)
const PROVINCIAS = ["Talca", "Curicó", "Linares", "Cauquenes"];

const Publicar = () => {
  const { user, isAuthenticated, signInWithGoogle, showToast } = useAuth();
  const navigate = useNavigate();

  // Estados
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Estado del formulario adaptado a la estructura de la BD
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    organizador: "",
    category_id: "",
    fecha_evento: "",
    hora_inicio: "",
    hora_fin: "",
    provincia: "",
    comuna: "",
    direccion: "",
    tipo_entrada: "gratuito",
    precio: "",
    url_venta: "",
    redes_sociales: {
      instagram: "",
      facebook: "",
      whatsapp: "",
    },
    imagenes: [],
  });

  // Cargar categorías al montar
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data || []);
      } catch (error) {
        console.error("Error cargando categorías:", error);
        if (showToast) showToast("Error al cargar categorías", "error");
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

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
        if (showToast) showToast("Error al iniciar sesión con Google", "error");
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

    // Manejar campos anidados (redes_sociales)
    if (name.startsWith("redes_")) {
      const socialNetwork = name.replace("redes_", "");
      setFormData((prev) => ({
        ...prev,
        redes_sociales: {
          ...prev.redes_sociales,
          [socialNetwork]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Limpiar error del campo
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Manejar cambio de imágenes (múltiples)
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const maxFiles = 5;
    const maxSize = 5 * 1024 * 1024; // 5MB

    // Validar cantidad
    if (formData.imagenes.length + files.length > maxFiles) {
      setErrors((prev) => ({
        ...prev,
        imagenes: `Máximo ${maxFiles} imágenes permitidas`,
      }));
      return;
    }

    // Validar tamaño y agregar
    const validFiles = [];
    const newPreviews = [];

    for (const file of files) {
      if (file.size > maxSize) {
        setErrors((prev) => ({
          ...prev,
          imagenes: `La imagen ${file.name} supera los 5MB`,
        }));
        continue;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setFormData((prev) => ({
      ...prev,
      imagenes: [...prev.imagenes, ...validFiles],
    }));
    setPreviewImages((prev) => [...prev, ...newPreviews]);
    setErrors((prev) => ({ ...prev, imagenes: "" }));
  };

  // Eliminar imagen
  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      imagenes: prev.imagenes.filter((_, i) => i !== index),
    }));
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
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
    if (!formData.category_id) {
      newErrors.category_id = "Selecciona una categoría";
    }
    if (!formData.fecha_evento) {
      newErrors.fecha_evento = "La fecha es obligatoria";
    }
    if (!formData.provincia) {
      newErrors.provincia = "Selecciona una provincia";
    }
    if (!formData.comuna.trim()) {
      newErrors.comuna = "La comuna es obligatoria";
    }
    if (!formData.direccion.trim()) {
      newErrors.direccion = "La dirección es obligatoria";
    }
    if (formData.tipo_entrada === "pagado" && !formData.precio) {
      newErrors.precio = "Indica el precio del evento";
    }
    if (formData.imagenes.length === 0) {
      newErrors.imagenes = "Sube al menos una imagen";
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
      if (showToast)
        showToast("Por favor completa todos los campos obligatorios", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Subir imágenes
      const imageUrls = [];
      for (const file of formData.imagenes) {
        const url = await uploadEventImage(file, user.id);
        imageUrls.push(url);
      }

      // 2. Preparar datos del evento
      const eventData = {
        user_id: user.id,
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion.trim(),
        organizador:
          formData.organizador.trim() ||
          user.user_metadata?.full_name ||
          "Organizador",
        category_id: parseInt(formData.category_id),
        fecha_evento: formData.fecha_evento,
        hora_inicio: formData.hora_inicio || null,
        hora_fin: formData.hora_fin || null,
        provincia: formData.provincia,
        comuna: formData.comuna.trim(),
        direccion: formData.direccion.trim(),
        tipo_entrada: formData.tipo_entrada,
        precio:
          formData.tipo_entrada === "pagado" ? parseInt(formData.precio) : null,
        url_venta: formData.url_venta.trim() || null,
        redes_sociales: formData.redes_sociales,
        imagenes: imageUrls,
        estado: "pendiente", // Los eventos inician como pendientes de revisión
      };

      // 3. Crear evento en la BD
      await createEvent(eventData);

      if (showToast)
        showToast(
          "¡Evento creado exitosamente! Será revisado pronto.",
          "success"
        );

      // Resetear formulario
      setFormData({
        titulo: "",
        descripcion: "",
        organizador: "",
        category_id: "",
        fecha_evento: "",
        hora_inicio: "",
        hora_fin: "",
        provincia: "",
        comuna: "",
        direccion: "",
        tipo_entrada: "gratuito",
        precio: "",
        url_venta: "",
        redes_sociales: {
          instagram: "",
          facebook: "",
          whatsapp: "",
        },
        imagenes: [],
      });
      setPreviewImages([]);

      // Redirigir al perfil
      navigate("/perfil");
    } catch (error) {
      console.error("Error al crear evento:", error);
      if (showToast)
        showToast("Error al crear el evento. Intenta nuevamente.", "error");
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
        <h1 className="publicar-header__title">Publica tu Panorama</h1>
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
              <p>Completa el formulario con los detalles de tu evento</p>
            </div>
            <div className="publicar-info__step">
              <span className="publicar-info__step-number">2</span>
              <p>Sube imágenes atractivas que representen tu evento</p>
            </div>
            <div className="publicar-info__step">
              <span className="publicar-info__step-number">3</span>
              <p>Nuestro equipo revisará tu publicación</p>
            </div>
            <div className="publicar-info__step">
              <span className="publicar-info__step-number">4</span>
              <p>¡Tu evento estará visible para toda la comunidad!</p>
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
          {/* Título */}
          <div className="publicar-form__group">
            <label className="publicar-form__label" htmlFor="titulo">
              Título del Evento *
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

          {/* Organizador */}
          <div className="publicar-form__group">
            <label className="publicar-form__label" htmlFor="organizador">
              <FontAwesomeIcon icon={faBuilding} /> Organizador
            </label>
            <input
              type="text"
              id="organizador"
              name="organizador"
              className="publicar-form__input"
              placeholder="Nombre del organizador (opcional)"
              value={formData.organizador}
              onChange={handleChange}
              maxLength={100}
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
              placeholder="Describe tu evento en detalle: qué actividades habrá, qué pueden esperar los asistentes..."
              value={formData.descripcion}
              onChange={handleChange}
              rows={5}
              maxLength={2000}
            />
            <span className="publicar-form__char-count">
              {formData.descripcion.length}/2000
            </span>
            {errors.descripcion && (
              <span className="publicar-form__error">{errors.descripcion}</span>
            )}
          </div>

          {/* Categoría */}
          <div className="publicar-form__group">
            <label className="publicar-form__label" htmlFor="category_id">
              <FontAwesomeIcon icon={faTag} /> Categoría *
            </label>
            <select
              id="category_id"
              name="category_id"
              className={`publicar-form__select ${
                errors.category_id ? "error" : ""
              }`}
              value={formData.category_id}
              onChange={handleChange}
              disabled={loadingCategories}>
              <option value="">
                {loadingCategories
                  ? "Cargando categorías..."
                  : "Selecciona una categoría"}
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
            {errors.category_id && (
              <span className="publicar-form__error">{errors.category_id}</span>
            )}
          </div>

          {/* Fecha y Horas */}
          <div className="publicar-form__row publicar-form__row--three">
            <div className="publicar-form__group">
              <label className="publicar-form__label" htmlFor="fecha_evento">
                <FontAwesomeIcon icon={faCalendarDays} /> Fecha *
              </label>
              <input
                type="date"
                id="fecha_evento"
                name="fecha_evento"
                className={`publicar-form__input ${
                  errors.fecha_evento ? "error" : ""
                }`}
                value={formData.fecha_evento}
                onChange={handleChange}
                min={new Date().toISOString().split("T")[0]}
              />
              {errors.fecha_evento && (
                <span className="publicar-form__error">
                  {errors.fecha_evento}
                </span>
              )}
            </div>

            <div className="publicar-form__group">
              <label className="publicar-form__label" htmlFor="hora_inicio">
                <FontAwesomeIcon icon={faClock} /> Hora Inicio
              </label>
              <input
                type="time"
                id="hora_inicio"
                name="hora_inicio"
                className="publicar-form__input"
                value={formData.hora_inicio}
                onChange={handleChange}
              />
            </div>

            <div className="publicar-form__group">
              <label className="publicar-form__label" htmlFor="hora_fin">
                <FontAwesomeIcon icon={faClock} /> Hora Fin
              </label>
              <input
                type="time"
                id="hora_fin"
                name="hora_fin"
                className="publicar-form__input"
                value={formData.hora_fin}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Ubicación */}
          <div className="publicar-form__row">
            <div className="publicar-form__group">
              <label className="publicar-form__label" htmlFor="provincia">
                <FontAwesomeIcon icon={faLocationDot} /> Provincia *
              </label>
              <select
                id="provincia"
                name="provincia"
                className={`publicar-form__select ${
                  errors.provincia ? "error" : ""
                }`}
                value={formData.provincia}
                onChange={handleChange}>
                <option value="">Selecciona una provincia</option>
                {PROVINCIAS.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
              {errors.provincia && (
                <span className="publicar-form__error">{errors.provincia}</span>
              )}
            </div>

            <div className="publicar-form__group">
              <label className="publicar-form__label" htmlFor="comuna">
                Comuna *
              </label>
              <input
                type="text"
                id="comuna"
                name="comuna"
                className={`publicar-form__input ${
                  errors.comuna ? "error" : ""
                }`}
                placeholder="Ej: Talca"
                value={formData.comuna}
                onChange={handleChange}
              />
              {errors.comuna && (
                <span className="publicar-form__error">{errors.comuna}</span>
              )}
            </div>
          </div>

          {/* Dirección */}
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
              placeholder="Ej: Av. Principal 123, Local 5"
              value={formData.direccion}
              onChange={handleChange}
            />
            {errors.direccion && (
              <span className="publicar-form__error">{errors.direccion}</span>
            )}
          </div>

          {/* Tipo de Entrada y Precio */}
          <div className="publicar-form__row">
            <div className="publicar-form__group">
              <label className="publicar-form__label" htmlFor="tipo_entrada">
                <FontAwesomeIcon icon={faTicket} /> Tipo de Entrada *
              </label>
              <select
                id="tipo_entrada"
                name="tipo_entrada"
                className="publicar-form__select"
                value={formData.tipo_entrada}
                onChange={handleChange}>
                {TIPOS_ENTRADA.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>

            {formData.tipo_entrada === "pagado" && (
              <div className="publicar-form__group">
                <label className="publicar-form__label" htmlFor="precio">
                  Precio (CLP) *
                </label>
                <input
                  type="number"
                  id="precio"
                  name="precio"
                  className={`publicar-form__input ${
                    errors.precio ? "error" : ""
                  }`}
                  placeholder="Ej: 10000"
                  value={formData.precio}
                  onChange={handleChange}
                  min="0"
                />
                {errors.precio && (
                  <span className="publicar-form__error">{errors.precio}</span>
                )}
              </div>
            )}
          </div>

          {/* URL de Venta */}
          {formData.tipo_entrada === "pagado" && (
            <div className="publicar-form__group">
              <label className="publicar-form__label" htmlFor="url_venta">
                <FontAwesomeIcon icon={faLink} /> URL de Venta de Entradas
              </label>
              <input
                type="url"
                id="url_venta"
                name="url_venta"
                className="publicar-form__input"
                placeholder="https://ejemplo.com/entradas"
                value={formData.url_venta}
                onChange={handleChange}
              />
            </div>
          )}

          {/* Redes Sociales */}
          <div className="publicar-form__group">
            <label className="publicar-form__label">Redes Sociales</label>
            <div className="publicar-form__social-inputs">
              <div className="publicar-form__social-input">
                <FontAwesomeIcon icon={faInstagram} />
                <input
                  type="url"
                  name="redes_instagram"
                  placeholder="https://instagram.com/tu_evento"
                  value={formData.redes_sociales.instagram}
                  onChange={handleChange}
                />
              </div>
              <div className="publicar-form__social-input">
                <FontAwesomeIcon icon={faFacebook} />
                <input
                  type="url"
                  name="redes_facebook"
                  placeholder="https://facebook.com/tu_evento"
                  value={formData.redes_sociales.facebook}
                  onChange={handleChange}
                />
              </div>
              <div className="publicar-form__social-input">
                <FontAwesomeIcon icon={faWhatsapp} />
                <input
                  type="text"
                  name="redes_whatsapp"
                  placeholder="+56 9 1234 5678"
                  value={formData.redes_sociales.whatsapp}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Imágenes */}
          <div className="publicar-form__group">
            <label className="publicar-form__label">
              <FontAwesomeIcon icon={faImage} /> Imágenes del Evento *
            </label>
            <p className="publicar-form__hint">
              Sube hasta 5 imágenes (PNG, JPG - máx. 5MB cada una)
            </p>

            {/* Preview de imágenes */}
            {previewImages.length > 0 && (
              <div className="publicar-form__image-previews">
                {previewImages.map((preview, index) => (
                  <div key={index} className="publicar-form__preview-item">
                    <img src={preview} alt={`Preview ${index + 1}`} />
                    <button
                      type="button"
                      className="publicar-form__preview-remove"
                      onClick={() => removeImage(index)}>
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input de imagen */}
            {previewImages.length < 5 && (
              <div className="publicar-form__image-upload">
                <input
                  type="file"
                  id="imagenes"
                  name="imagenes"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="publicar-form__file-input"
                  multiple
                />
                <label htmlFor="imagenes" className="publicar-form__file-label">
                  <FontAwesomeIcon icon={faImage} />
                  <span>Haz clic para subir imágenes</span>
                  <span className="publicar-form__file-hint">
                    {previewImages.length}/5 imágenes
                  </span>
                </label>
              </div>
            )}

            {errors.imagenes && (
              <span className="publicar-form__error">{errors.imagenes}</span>
            )}
          </div>

          {/* Botón de envío */}
          <button
            type="submit"
            className="publicar-form__submit"
            disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin />
                Publicando...
              </>
            ) : (
              "Publicar Evento"
            )}
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
