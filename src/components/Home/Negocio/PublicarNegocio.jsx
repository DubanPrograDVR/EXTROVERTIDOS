import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLocationDot,
  faImage,
  faTag,
  faInfoCircle,
  faBuilding,
  faTimes,
  faLink,
  faSpinner,
  faPhone,
  faClock,
  faGlobe,
  faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons";
import {
  faInstagram,
  faFacebook,
  faWhatsapp,
  faGoogle,
} from "@fortawesome/free-brands-svg-icons";
import {
  getCategories,
  createBusiness,
  uploadBusinessImage,
} from "../../../lib/database";
import "./styles/publicar-negocio.css";

// Provincias de Chile (Región del Maule)
const PROVINCIAS = ["Talca", "Curicó", "Linares", "Cauquenes"];

// Días de la semana
const DIAS_SEMANA = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

const PublicarNegocio = () => {
  const { user, isAuthenticated, isAdmin, signInWithGoogle, showToast } =
    useAuth();
  const navigate = useNavigate();

  // Estados
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    category_id: "",
    provincia: "",
    comuna: "",
    direccion: "",
    telefono: "",
    email: "",
    sitio_web: "",
    horario_apertura: "",
    horario_cierre: "",
    dias_atencion: [],
    redes_sociales: {
      instagram: "",
      facebook: "",
      whatsapp: "",
    },
    ubicacion_url: "",
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

  // Manejar cambio de días de atención
  const handleDiaChange = (dia) => {
    setFormData((prev) => ({
      ...prev,
      dias_atencion: prev.dias_atencion.includes(dia)
        ? prev.dias_atencion.filter((d) => d !== dia)
        : [...prev.dias_atencion, dia],
    }));
  };

  // Manejar cambio de imágenes
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const maxFiles = 5;
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (formData.imagenes.length + files.length > maxFiles) {
      setErrors((prev) => ({
        ...prev,
        imagenes: `Máximo ${maxFiles} imágenes permitidas`,
      }));
      return;
    }

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

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre del negocio es obligatorio";
    }
    if (!formData.descripcion.trim()) {
      newErrors.descripcion = "La descripción es obligatoria";
    }
    if (!formData.category_id) {
      newErrors.category_id = "Selecciona una categoría";
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
    if (!formData.telefono.trim()) {
      newErrors.telefono = "El teléfono es obligatorio";
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

    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

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
        const url = await uploadBusinessImage(file, user.id);
        imageUrls.push(url);
      }

      // 2. Preparar datos del negocio
      const businessData = {
        user_id: user.id,
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        category_id: parseInt(formData.category_id),
        provincia: formData.provincia,
        comuna: formData.comuna.trim(),
        direccion: formData.direccion.trim(),
        telefono: formData.telefono.trim(),
        email: formData.email.trim() || null,
        sitio_web: formData.sitio_web.trim() || null,
        horario_apertura: formData.horario_apertura || null,
        horario_cierre: formData.horario_cierre || null,
        dias_atencion: formData.dias_atencion,
        redes_sociales: formData.redes_sociales,
        ubicacion_url: formData.ubicacion_url.trim() || null,
        imagen_url: imageUrls[0] || null,
        imagenes: imageUrls,
        estado: "pendiente",
      };

      // 3. Crear negocio en la BD
      await createBusiness(businessData);

      if (showToast)
        showToast(
          "¡Negocio creado exitosamente! Será revisado pronto.",
          "success"
        );

      // Resetear formulario
      setFormData({
        nombre: "",
        descripcion: "",
        category_id: "",
        provincia: "",
        comuna: "",
        direccion: "",
        telefono: "",
        email: "",
        sitio_web: "",
        horario_apertura: "",
        horario_cierre: "",
        dias_atencion: [],
        redes_sociales: {
          instagram: "",
          facebook: "",
          whatsapp: "",
        },
        ubicacion_url: "",
        imagenes: [],
      });
      setPreviewImages([]);

      // Redirigir: admin siempre vuelve al panel, usuarios normales al perfil
      navigate(isAdmin ? "/admin" : "/perfil");
    } catch (error) {
      console.error("Error al crear negocio:", error);
      if (showToast) showToast("Error al crear el negocio", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="publicar-negocio">
      {/* Header */}
      <header className="publicar-negocio__header">
        <h1 className="publicar-negocio__title">Publicar Negocio</h1>
        <p className="publicar-negocio__subtitle">
          Registra tu negocio y llega a más clientes en la región del Maule
        </p>
      </header>

      {/* Formulario */}
      <form className="publicar-negocio__form" onSubmit={handleSubmit}>
        {/* Información básica */}
        <section className="publicar-negocio__section">
          <h2 className="publicar-negocio__section-title">
            <FontAwesomeIcon icon={faBuilding} />
            Información del Negocio
          </h2>

          <div className="publicar-negocio__field">
            <label htmlFor="nombre">
              Nombre del Negocio <span className="required">*</span>
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              onFocus={handleFieldFocus}
              placeholder="Ej: Restaurante El Buen Sabor"
              className={errors.nombre ? "error" : ""}
            />
            {errors.nombre && (
              <span className="publicar-negocio__error">{errors.nombre}</span>
            )}
          </div>

          <div className="publicar-negocio__field">
            <label htmlFor="descripcion">
              Descripción <span className="required">*</span>
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              onFocus={handleFieldFocus}
              placeholder="Describe tu negocio, servicios que ofreces, especialidades..."
              rows={4}
              className={errors.descripcion ? "error" : ""}
            />
            {errors.descripcion && (
              <span className="publicar-negocio__error">
                {errors.descripcion}
              </span>
            )}
          </div>

          <div className="publicar-negocio__field">
            <label htmlFor="category_id">
              <FontAwesomeIcon icon={faTag} />
              Categoría <span className="required">*</span>
            </label>
            {loadingCategories ? (
              <p>Cargando categorías...</p>
            ) : (
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                onFocus={handleFieldFocus}
                className={errors.category_id ? "error" : ""}>
                <option value="">Selecciona una categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            )}
            {errors.category_id && (
              <span className="publicar-negocio__error">
                {errors.category_id}
              </span>
            )}
          </div>
        </section>

        {/* Ubicación */}
        <section className="publicar-negocio__section">
          <h2 className="publicar-negocio__section-title">
            <FontAwesomeIcon icon={faLocationDot} />
            Ubicación
          </h2>

          <div className="publicar-negocio__row">
            <div className="publicar-negocio__field">
              <label htmlFor="provincia">
                Provincia <span className="required">*</span>
              </label>
              <select
                id="provincia"
                name="provincia"
                value={formData.provincia}
                onChange={handleChange}
                onFocus={handleFieldFocus}
                className={errors.provincia ? "error" : ""}>
                <option value="">Selecciona provincia</option>
                {PROVINCIAS.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
              {errors.provincia && (
                <span className="publicar-negocio__error">
                  {errors.provincia}
                </span>
              )}
            </div>

            <div className="publicar-negocio__field">
              <label htmlFor="comuna">
                Comuna <span className="required">*</span>
              </label>
              <input
                type="text"
                id="comuna"
                name="comuna"
                value={formData.comuna}
                onChange={handleChange}
                onFocus={handleFieldFocus}
                placeholder="Ej: Talca"
                className={errors.comuna ? "error" : ""}
              />
              {errors.comuna && (
                <span className="publicar-negocio__error">{errors.comuna}</span>
              )}
            </div>
          </div>

          <div className="publicar-negocio__field">
            <label htmlFor="direccion">
              Dirección <span className="required">*</span>
            </label>
            <input
              type="text"
              id="direccion"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              onFocus={handleFieldFocus}
              placeholder="Ej: Av. Principal 123, Local 5"
              className={errors.direccion ? "error" : ""}
            />
            {errors.direccion && (
              <span className="publicar-negocio__error">
                {errors.direccion}
              </span>
            )}
          </div>

          <div className="publicar-negocio__field">
            <label htmlFor="ubicacion_url">
              <FontAwesomeIcon icon={faMapMarkerAlt} />
              Enlace Google Maps (opcional)
            </label>
            <input
              type="url"
              id="ubicacion_url"
              name="ubicacion_url"
              value={formData.ubicacion_url}
              onChange={handleChange}
              onFocus={handleFieldFocus}
              placeholder="https://maps.google.com/..."
            />
          </div>
        </section>

        {/* Contacto */}
        <section className="publicar-negocio__section">
          <h2 className="publicar-negocio__section-title">
            <FontAwesomeIcon icon={faPhone} />
            Contacto
          </h2>

          <div className="publicar-negocio__row">
            <div className="publicar-negocio__field">
              <label htmlFor="telefono">
                Teléfono <span className="required">*</span>
              </label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                onFocus={handleFieldFocus}
                placeholder="+56 9 1234 5678"
                className={errors.telefono ? "error" : ""}
              />
              {errors.telefono && (
                <span className="publicar-negocio__error">
                  {errors.telefono}
                </span>
              )}
            </div>

            <div className="publicar-negocio__field">
              <label htmlFor="email">Email (opcional)</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onFocus={handleFieldFocus}
                placeholder="contacto@minegocio.cl"
              />
            </div>
          </div>

          <div className="publicar-negocio__field">
            <label htmlFor="sitio_web">
              <FontAwesomeIcon icon={faGlobe} />
              Sitio Web (opcional)
            </label>
            <input
              type="url"
              id="sitio_web"
              name="sitio_web"
              value={formData.sitio_web}
              onChange={handleChange}
              onFocus={handleFieldFocus}
              placeholder="https://www.minegocio.cl"
            />
          </div>
        </section>

        {/* Horarios */}
        <section className="publicar-negocio__section">
          <h2 className="publicar-negocio__section-title">
            <FontAwesomeIcon icon={faClock} />
            Horario de Atención
          </h2>

          <div className="publicar-negocio__row">
            <div className="publicar-negocio__field">
              <label htmlFor="horario_apertura">Hora de apertura</label>
              <input
                type="time"
                id="horario_apertura"
                name="horario_apertura"
                value={formData.horario_apertura}
                onChange={handleChange}
                onFocus={handleFieldFocus}
              />
            </div>

            <div className="publicar-negocio__field">
              <label htmlFor="horario_cierre">Hora de cierre</label>
              <input
                type="time"
                id="horario_cierre"
                name="horario_cierre"
                value={formData.horario_cierre}
                onChange={handleChange}
                onFocus={handleFieldFocus}
              />
            </div>
          </div>

          <div className="publicar-negocio__field">
            <label>Días de atención</label>
            <div className="publicar-negocio__dias">
              {DIAS_SEMANA.map((dia) => (
                <label key={dia} className="publicar-negocio__dia-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.dias_atencion.includes(dia)}
                    onChange={() => handleDiaChange(dia)}
                  />
                  <span>{dia}</span>
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* Redes Sociales */}
        <section className="publicar-negocio__section">
          <h2 className="publicar-negocio__section-title">
            <FontAwesomeIcon icon={faLink} />
            Redes Sociales (opcional)
          </h2>

          <div className="publicar-negocio__field">
            <label htmlFor="redes_instagram">
              <FontAwesomeIcon icon={faInstagram} />
              Instagram
            </label>
            <input
              type="url"
              id="redes_instagram"
              name="redes_instagram"
              value={formData.redes_sociales.instagram}
              onChange={handleChange}
              onFocus={handleFieldFocus}
              placeholder="https://instagram.com/minegocio"
            />
          </div>

          <div className="publicar-negocio__field">
            <label htmlFor="redes_facebook">
              <FontAwesomeIcon icon={faFacebook} />
              Facebook
            </label>
            <input
              type="url"
              id="redes_facebook"
              name="redes_facebook"
              value={formData.redes_sociales.facebook}
              onChange={handleChange}
              onFocus={handleFieldFocus}
              placeholder="https://facebook.com/minegocio"
            />
          </div>

          <div className="publicar-negocio__field">
            <label htmlFor="redes_whatsapp">
              <FontAwesomeIcon icon={faWhatsapp} />
              WhatsApp
            </label>
            <input
              type="url"
              id="redes_whatsapp"
              name="redes_whatsapp"
              value={formData.redes_sociales.whatsapp}
              onChange={handleChange}
              onFocus={handleFieldFocus}
              placeholder="https://wa.me/56912345678"
            />
          </div>
        </section>

        {/* Imágenes */}
        <section className="publicar-negocio__section">
          <h2 className="publicar-negocio__section-title">
            <FontAwesomeIcon icon={faImage} />
            Imágenes
          </h2>

          <div className="publicar-negocio__field">
            <label>
              Fotos del negocio <span className="required">*</span>
            </label>
            <p className="publicar-negocio__hint">
              <FontAwesomeIcon icon={faInfoCircle} />
              Sube hasta 5 imágenes. La primera será la imagen principal.
            </p>

            <div className="publicar-negocio__images-grid">
              {previewImages.map((preview, index) => (
                <div key={index} className="publicar-negocio__image-preview">
                  <img src={preview} alt={`Preview ${index + 1}`} />
                  <button
                    type="button"
                    className="publicar-negocio__image-remove"
                    onClick={() => removeImage(index)}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                  {index === 0 && (
                    <span className="publicar-negocio__image-main">
                      Principal
                    </span>
                  )}
                </div>
              ))}

              {previewImages.length < 5 && (
                <label className="publicar-negocio__image-upload">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    onFocus={handleFieldFocus}
                  />
                  <FontAwesomeIcon icon={faImage} />
                  <span>Agregar imagen</span>
                </label>
              )}
            </div>

            {errors.imagenes && (
              <span className="publicar-negocio__error">{errors.imagenes}</span>
            )}
          </div>
        </section>

        {/* Botón enviar */}
        <button
          type="submit"
          className="publicar-negocio__submit"
          disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <FontAwesomeIcon icon={faSpinner} spin />
              Publicando...
            </>
          ) : (
            "Publicar Negocio"
          )}
        </button>
      </form>

      {/* Modal de autenticación */}
      {showAuthModal && (
        <div
          className="publicar-negocio__auth-modal"
          onClick={() => setShowAuthModal(false)}>
          <div
            className="publicar-negocio__auth-content"
            onClick={(e) => e.stopPropagation()}>
            <button
              className="publicar-negocio__auth-close"
              onClick={() => setShowAuthModal(false)}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <h3>Inicia sesión para continuar</h3>
            <p>Necesitas una cuenta para publicar tu negocio</p>
            <button
              className="publicar-negocio__google-btn"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}>
              {isGoogleLoading ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                <FontAwesomeIcon icon={faGoogle} />
              )}
              Continuar con Google
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicarNegocio;
