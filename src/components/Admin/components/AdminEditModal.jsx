import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faSave,
  faSpinner,
  faImage,
  faTrash,
  faPlus,
  faCalendarAlt,
  faMapMarkerAlt,
  faTicketAlt,
  faInfoCircle,
  faLink,
} from "@fortawesome/free-solid-svg-icons";
import {
  faInstagram,
  faFacebook,
  faWhatsapp,
} from "@fortawesome/free-brands-svg-icons";
import "./AdminEditModal.css";

// Provincias del Maule
const PROVINCIAS = ["Talca", "Curicó", "Linares", "Cauquenes"];

// Tipos de entrada
const TIPOS_ENTRADA = [
  { value: "sin_entrada", label: "Sin entrada" },
  { value: "gratuito", label: "Entrada gratuita" },
  { value: "pagado", label: "Entrada pagada" },
  { value: "venta_externa", label: "Venta externa" },
];

// Estados de publicación
const ESTADOS = [
  { value: "pendiente", label: "Pendiente", color: "#ffc107" },
  { value: "publicado", label: "Publicado", color: "#28a745" },
  { value: "rechazado", label: "Rechazado", color: "#dc3545" },
];

/**
 * Modal para editar publicaciones desde el panel de administración
 */
export default function AdminEditModal({
  isOpen,
  onClose,
  event,
  categories = [],
  onSave,
  loading = false,
}) {
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    organizador: "",
    category_id: "",
    fecha_evento: "",
    fecha_fin: "",
    es_multidia: false,
    es_recurrente: false,
    dia_recurrencia: "",
    cantidad_repeticiones: 2,
    fechas_recurrencia: [],
    hora_inicio: "",
    hora_fin: "",
    provincia: "",
    comuna: "",
    direccion: "",
    tipo_entrada: "sin_entrada",
    precio: "",
    url_venta: "",
    estado: "pendiente",
    redes_sociales: {
      instagram: "",
      facebook: "",
      whatsapp: "",
    },
    imagenes: [],
  });

  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("info");

  // Cargar datos del evento cuando se abre el modal
  useEffect(() => {
    if (event && isOpen) {
      setFormData({
        titulo: event.titulo || "",
        descripcion: event.descripcion || "",
        organizador: event.organizador || "",
        category_id: event.category_id || "",
        fecha_evento: event.fecha_evento || "",
        fecha_fin: event.fecha_fin || "",
        es_multidia: event.es_multidia || false,
        es_recurrente: event.es_recurrente || false,
        dia_recurrencia: event.dia_recurrencia || "",
        cantidad_repeticiones: event.cantidad_repeticiones || 2,
        fechas_recurrencia: event.fechas_recurrencia || [],
        hora_inicio: event.hora_inicio?.slice(0, 5) || "",
        hora_fin: event.hora_fin?.slice(0, 5) || "",
        provincia: event.provincia || "",
        comuna: event.comuna || "",
        direccion: event.direccion || "",
        tipo_entrada: event.tipo_entrada || "sin_entrada",
        precio: event.precio || "",
        url_venta: event.url_venta || "",
        estado: event.estado || "pendiente",
        redes_sociales: {
          instagram: event.redes_sociales?.instagram || "",
          facebook: event.redes_sociales?.facebook || "",
          whatsapp: event.redes_sociales?.whatsapp || "",
        },
        imagenes: event.imagenes || [],
      });
      setErrors({});
      setActiveTab("info");
    }
  }, [event, isOpen]);

  // Cerrar con ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose, loading]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith("redes_sociales.")) {
      const socialKey = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        redes_sociales: {
          ...prev.redes_sociales,
          [socialKey]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }

    // Limpiar error del campo
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      imagenes: prev.imagenes.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = "El título es obligatorio";
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setActiveTab("info");
      return;
    }

    // Preparar datos para guardar
    const dataToSave = {
      ...formData,
      precio:
        formData.tipo_entrada === "pagado"
          ? parseInt(formData.precio) || null
          : null,
      hora_inicio: formData.hora_inicio || null,
      hora_fin: formData.hora_fin || null,
      fecha_fin: formData.es_multidia
        ? formData.fecha_fin
        : formData.fecha_evento,
    };

    await onSave(event.id, dataToSave);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  if (!isOpen || !event) return null;

  return (
    <div className="admin-edit-overlay" onClick={handleOverlayClick}>
      <div className="admin-edit-modal">
        {/* Header */}
        <div className="admin-edit-modal__header">
          <h2>Editar Publicación</h2>
          <button
            className="admin-edit-modal__close"
            onClick={onClose}
            disabled={loading}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Tabs */}
        <div className="admin-edit-modal__tabs">
          <button
            className={`admin-edit-tab ${activeTab === "info" ? "active" : ""}`}
            onClick={() => setActiveTab("info")}>
            <FontAwesomeIcon icon={faInfoCircle} />
            <span>Información</span>
          </button>
          <button
            className={`admin-edit-tab ${
              activeTab === "datetime" ? "active" : ""
            }`}
            onClick={() => setActiveTab("datetime")}>
            <FontAwesomeIcon icon={faCalendarAlt} />
            <span>Fecha y Hora</span>
          </button>
          <button
            className={`admin-edit-tab ${
              activeTab === "location" ? "active" : ""
            }`}
            onClick={() => setActiveTab("location")}>
            <FontAwesomeIcon icon={faMapMarkerAlt} />
            <span>Ubicación</span>
          </button>
          <button
            className={`admin-edit-tab ${
              activeTab === "ticket" ? "active" : ""
            }`}
            onClick={() => setActiveTab("ticket")}>
            <FontAwesomeIcon icon={faTicketAlt} />
            <span>Entrada</span>
          </button>
          <button
            className={`admin-edit-tab ${
              activeTab === "media" ? "active" : ""
            }`}
            onClick={() => setActiveTab("media")}>
            <FontAwesomeIcon icon={faImage} />
            <span>Imágenes</span>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="admin-edit-modal__content">
          {/* Tab: Información */}
          {activeTab === "info" && (
            <div className="admin-edit-section">
              <div className="admin-edit-field">
                <label htmlFor="titulo">
                  Título <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="titulo"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  placeholder="Título del evento"
                  className={errors.titulo ? "error" : ""}
                />
                {errors.titulo && (
                  <span className="field-error">{errors.titulo}</span>
                )}
              </div>

              <div className="admin-edit-field">
                <label htmlFor="descripcion">Descripción</label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Descripción del evento"
                  rows={4}
                />
              </div>

              <div className="admin-edit-row">
                <div className="admin-edit-field">
                  <label htmlFor="organizador">Organizador</label>
                  <input
                    type="text"
                    id="organizador"
                    name="organizador"
                    value={formData.organizador}
                    onChange={handleChange}
                    placeholder="Nombre del organizador"
                  />
                </div>

                <div className="admin-edit-field">
                  <label htmlFor="category_id">
                    Categoría <span className="required">*</span>
                  </label>
                  <select
                    id="category_id"
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    className={errors.category_id ? "error" : ""}>
                    <option value="">Seleccionar categoría</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                  {errors.category_id && (
                    <span className="field-error">{errors.category_id}</span>
                  )}
                </div>
              </div>

              <div className="admin-edit-field">
                <label htmlFor="estado">Estado de la publicación</label>
                <div className="admin-edit-status-options">
                  {ESTADOS.map((estado) => (
                    <label
                      key={estado.value}
                      className={`admin-edit-status-option ${
                        formData.estado === estado.value ? "selected" : ""
                      }`}
                      style={{
                        "--status-color": estado.color,
                      }}>
                      <input
                        type="radio"
                        name="estado"
                        value={estado.value}
                        checked={formData.estado === estado.value}
                        onChange={handleChange}
                      />
                      <span className="status-dot"></span>
                      {estado.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Redes Sociales */}
              <div className="admin-edit-subsection">
                <h4>
                  <FontAwesomeIcon icon={faLink} /> Redes Sociales
                </h4>
                <div className="admin-edit-row admin-edit-row--three">
                  <div className="admin-edit-field admin-edit-field--icon">
                    <FontAwesomeIcon
                      icon={faInstagram}
                      className="field-icon"
                    />
                    <input
                      type="text"
                      name="redes_sociales.instagram"
                      value={formData.redes_sociales.instagram}
                      onChange={handleChange}
                      placeholder="@usuario o URL"
                    />
                  </div>
                  <div className="admin-edit-field admin-edit-field--icon">
                    <FontAwesomeIcon icon={faFacebook} className="field-icon" />
                    <input
                      type="text"
                      name="redes_sociales.facebook"
                      value={formData.redes_sociales.facebook}
                      onChange={handleChange}
                      placeholder="URL de Facebook"
                    />
                  </div>
                  <div className="admin-edit-field admin-edit-field--icon">
                    <FontAwesomeIcon icon={faWhatsapp} className="field-icon" />
                    <input
                      type="text"
                      name="redes_sociales.whatsapp"
                      value={formData.redes_sociales.whatsapp}
                      onChange={handleChange}
                      placeholder="+56 9 1234 5678"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Fecha y Hora */}
          {activeTab === "datetime" && (
            <div className="admin-edit-section">
              <div className="admin-edit-field">
                <label className="admin-edit-checkbox">
                  <input
                    type="checkbox"
                    name="es_multidia"
                    checked={formData.es_multidia}
                    onChange={handleChange}
                  />
                  <span>Evento de varios días</span>
                </label>
              </div>

              <div className="admin-edit-row">
                <div className="admin-edit-field">
                  <label htmlFor="fecha_evento">
                    {formData.es_multidia ? "Fecha inicio" : "Fecha del evento"}{" "}
                    <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    id="fecha_evento"
                    name="fecha_evento"
                    value={formData.fecha_evento}
                    onChange={handleChange}
                    className={errors.fecha_evento ? "error" : ""}
                  />
                  {errors.fecha_evento && (
                    <span className="field-error">{errors.fecha_evento}</span>
                  )}
                </div>

                {formData.es_multidia && (
                  <div className="admin-edit-field">
                    <label htmlFor="fecha_fin">Fecha fin</label>
                    <input
                      type="date"
                      id="fecha_fin"
                      name="fecha_fin"
                      value={formData.fecha_fin}
                      onChange={handleChange}
                      min={formData.fecha_evento}
                    />
                  </div>
                )}
              </div>

              <div className="admin-edit-row">
                <div className="admin-edit-field">
                  <label htmlFor="hora_inicio">Hora de inicio</label>
                  <input
                    type="time"
                    id="hora_inicio"
                    name="hora_inicio"
                    value={formData.hora_inicio}
                    onChange={handleChange}
                  />
                </div>

                <div className="admin-edit-field">
                  <label htmlFor="hora_fin">Hora de término</label>
                  <input
                    type="time"
                    id="hora_fin"
                    name="hora_fin"
                    value={formData.hora_fin}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab: Ubicación */}
          {activeTab === "location" && (
            <div className="admin-edit-section">
              <div className="admin-edit-row">
                <div className="admin-edit-field">
                  <label htmlFor="provincia">
                    Provincia <span className="required">*</span>
                  </label>
                  <select
                    id="provincia"
                    name="provincia"
                    value={formData.provincia}
                    onChange={handleChange}
                    className={errors.provincia ? "error" : ""}>
                    <option value="">Seleccionar provincia</option>
                    {PROVINCIAS.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                  {errors.provincia && (
                    <span className="field-error">{errors.provincia}</span>
                  )}
                </div>

                <div className="admin-edit-field">
                  <label htmlFor="comuna">
                    Comuna <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="comuna"
                    name="comuna"
                    value={formData.comuna}
                    onChange={handleChange}
                    placeholder="Ej: Talca, Curicó..."
                    className={errors.comuna ? "error" : ""}
                  />
                  {errors.comuna && (
                    <span className="field-error">{errors.comuna}</span>
                  )}
                </div>
              </div>

              <div className="admin-edit-field">
                <label htmlFor="direccion">Dirección</label>
                <input
                  type="text"
                  id="direccion"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  placeholder="Dirección del evento"
                />
              </div>
            </div>
          )}

          {/* Tab: Entrada */}
          {activeTab === "ticket" && (
            <div className="admin-edit-section">
              <div className="admin-edit-field">
                <label>Tipo de entrada</label>
                <div className="admin-edit-ticket-options">
                  {TIPOS_ENTRADA.map((tipo) => (
                    <label
                      key={tipo.value}
                      className={`admin-edit-ticket-option ${
                        formData.tipo_entrada === tipo.value ? "selected" : ""
                      }`}>
                      <input
                        type="radio"
                        name="tipo_entrada"
                        value={tipo.value}
                        checked={formData.tipo_entrada === tipo.value}
                        onChange={handleChange}
                      />
                      {tipo.label}
                    </label>
                  ))}
                </div>
              </div>

              {formData.tipo_entrada === "pagado" && (
                <div className="admin-edit-field">
                  <label htmlFor="precio">Precio (CLP)</label>
                  <input
                    type="number"
                    id="precio"
                    name="precio"
                    value={formData.precio}
                    onChange={handleChange}
                    placeholder="Ej: 5000"
                    min="0"
                  />
                </div>
              )}

              {formData.tipo_entrada === "venta_externa" && (
                <div className="admin-edit-field">
                  <label htmlFor="url_venta">URL de venta de entradas</label>
                  <input
                    type="url"
                    id="url_venta"
                    name="url_venta"
                    value={formData.url_venta}
                    onChange={handleChange}
                    placeholder="https://..."
                  />
                </div>
              )}
            </div>
          )}

          {/* Tab: Imágenes */}
          {activeTab === "media" && (
            <div className="admin-edit-section">
              <div className="admin-edit-images">
                {formData.imagenes.length > 0 ? (
                  <div className="admin-edit-images-grid">
                    {formData.imagenes.map((img, index) => (
                      <div key={index} className="admin-edit-image-item">
                        <img src={img} alt={`Imagen ${index + 1}`} />
                        <button
                          type="button"
                          className="admin-edit-image-remove"
                          onClick={() => handleRemoveImage(index)}>
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="admin-edit-images-empty">
                    <FontAwesomeIcon icon={faImage} />
                    <p>No hay imágenes</p>
                  </div>
                )}
                <p className="admin-edit-images-note">
                  Nota: Para agregar nuevas imágenes, el usuario debe editar
                  desde su perfil.
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="admin-edit-modal__footer">
            <button
              type="button"
              className="admin-edit-btn admin-edit-btn--cancel"
              onClick={onClose}
              disabled={loading}>
              Cancelar
            </button>
            <button
              type="submit"
              className="admin-edit-btn admin-edit-btn--save"
              disabled={loading}>
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  Guardando...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} />
                  Guardar cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
