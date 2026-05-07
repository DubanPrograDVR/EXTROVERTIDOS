import { useState, useEffect, useRef } from "react";
import { useScrollOnFocus } from "../../../hooks/useScrollOnFocus";
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
  faGlobe,
  faTag,
} from "@fortawesome/free-solid-svg-icons";
import {
  faInstagram,
  faFacebook,
  faWhatsapp,
} from "@fortawesome/free-brands-svg-icons";
import { uploadEventImage } from "../../../lib/database/images";
import {
  formatChileanPhone,
  normalizeSocialLinks,
} from "../../../lib/textWrap";
import {
  PROVINCIAS,
  COMUNAS_POR_PROVINCIA,
  TIPOS_ENTRADA,
} from "../../Home/Panorama/constants";
import "./AdminEditModal.css";

// Estados de publicación
const ESTADOS = [
  { value: "pendiente", label: "Pendiente", color: "#ffc107" },
  { value: "publicado", label: "Publicado", color: "#28a745" },
  { value: "rechazado", label: "Rechazado", color: "#dc3545" },
];

const SCHEDULE_MODES = [
  { value: "single", label: "Un solo día" },
  { value: "range", label: "Varios días" },
  { value: "specific", label: "Fechas específicas" },
];

const DAY_NAMES = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

const normalizeDateList = (dates) =>
  Array.from(
    new Set((Array.isArray(dates) ? dates : []).filter(Boolean)),
  ).sort();

const addDaysToDateKey = (dateKey, days) => {
  if (!dateKey) return "";
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const getInclusiveDays = (startDate, endDate) => {
  if (!startDate || !endDate) return null;
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  return Math.max(1, Math.round((end - start) / 86400000) + 1);
};

const getMainWeekday = (dates) => {
  const [firstDate] = normalizeDateList(dates);
  if (!firstDate) return "";
  return DAY_NAMES[new Date(`${firstDate}T00:00:00`).getDay()];
};

const isRealPublicationImage = (imageUrl) =>
  Boolean(imageUrl) && !String(imageUrl).includes("/img/Home1.png");

const getRealPublicationImages = (images) =>
  Array.isArray(images) ? images.filter(isRealPublicationImage) : [];

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
    mismo_horario: true,
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
    sitio_web: "",
    etiqueta_directa: "",
  });

  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("info");
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const scrollOnFocus = useScrollOnFocus({ block: "nearest" });
  const fileInputRef = useRef(null);

  // Cargar datos del evento cuando se abre el modal
  useEffect(() => {
    if (event && isOpen) {
      // Mapear valores antiguos de DB a valores de formulario
      const tipoEntradaReverseMap = {
        gratis: "gratuito",
        externo: "venta_externa",
      };
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
        mismo_horario: event.mismo_horario ?? true,
        hora_inicio: event.hora_inicio?.slice(0, 5) || "",
        hora_fin: event.hora_fin?.slice(0, 5) || "",
        provincia: event.provincia || "",
        comuna: event.comuna || "",
        direccion: event.direccion || "",
        tipo_entrada:
          tipoEntradaReverseMap[event.tipo_entrada] ||
          event.tipo_entrada ||
          "sin_entrada",
        precio: event.precio || "",
        url_venta: event.url_venta || "",
        estado: event.estado || "pendiente",
        redes_sociales: {
          instagram: event.redes_sociales?.instagram || "",
          facebook: event.redes_sociales?.facebook || "",
          whatsapp: event.redes_sociales?.whatsapp || "",
        },
        imagenes: getRealPublicationImages(event.imagenes),
        titulo_marketing: event.titulo_marketing || "",
        mensaje_marketing: event.mensaje_marketing || "",
        titulo_marketing_2: event.titulo_marketing_2 || "",
        mensaje_marketing_2: event.mensaje_marketing_2 || "",
        sitio_web: event.sitio_web || "",
        etiqueta_directa: event.etiqueta_directa || "",
      });
      setErrors({});
      setActiveTab("info");
      setNewImageFiles([]);
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
    const nextValue =
      type === "checkbox"
        ? typeof checked === "boolean"
          ? checked
          : Boolean(value)
        : value;

    if (name.startsWith("redes_sociales.")) {
      const socialKey = name.split(".")[1];
      const socialValue =
        socialKey === "whatsapp" ? formatChileanPhone(value) : value;
      setFormData((prev) => ({
        ...prev,
        redes_sociales: {
          ...prev.redes_sociales,
          [socialKey]: socialValue,
        },
      }));
    } else {
      setFormData((prev) => {
        if (name === "fecha_evento" && prev.es_recurrente) {
          const dates = normalizeDateList(prev.fechas_recurrencia);
          const nextDates = normalizeDateList(
            dates.length > 0 ? [nextValue, ...dates.slice(1)] : [nextValue],
          );
          return {
            ...prev,
            fecha_evento: nextDates[0] || nextValue,
            fechas_recurrencia: nextDates,
            cantidad_repeticiones: nextDates.length || 1,
            dia_recurrencia: getMainWeekday(nextDates),
          };
        }

        return {
          ...prev,
          [name]: nextValue,
          ...(name === "provincia" && prev.provincia !== value
            ? { comuna: "" }
            : {}),
          ...(name === "fecha_evento" &&
          prev.es_multidia &&
          prev.fecha_fin < value
            ? { fecha_fin: value }
            : {}),
        };
      });
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
    const recurrenceDates = normalizeDateList(formData.fechas_recurrencia);

    if (!formData.titulo.trim()) {
      newErrors.titulo = "El título es obligatorio";
    }
    if (!formData.category_id) {
      newErrors.category_id = "Selecciona una categoría";
    }
    if (!formData.fecha_evento) {
      newErrors.fecha_evento = "La fecha es obligatoria";
    }
    if (formData.es_multidia && !formData.fecha_fin) {
      newErrors.fecha_fin = "Selecciona la fecha de término";
    }
    if (
      formData.es_multidia &&
      formData.fecha_evento &&
      formData.fecha_fin &&
      formData.fecha_fin < formData.fecha_evento
    ) {
      newErrors.fecha_fin =
        "La fecha de término no puede ser anterior al inicio";
    }
    if (formData.es_recurrente && recurrenceDates.length < 2) {
      newErrors.fechas_recurrencia = "Agrega al menos dos fechas de repetición";
    }
    if (!formData.provincia) {
      newErrors.provincia = "Selecciona una provincia";
    }
    if (!formData.comuna.trim()) {
      newErrors.comuna = "La comuna es obligatoria";
    }
    if (
      getRealPublicationImages(formData.imagenes).length +
        newImageFiles.length ===
      0
    ) {
      newErrors.imagenes = "Debes agregar al menos una imagen real";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleScheduleModeChange = (mode) => {
    setFormData((prev) => {
      if (mode === "range") {
        return {
          ...prev,
          es_multidia: true,
          es_recurrente: false,
          fecha_fin: prev.fecha_fin || prev.fecha_evento,
          fechas_recurrencia: [],
          dia_recurrencia: "",
          cantidad_repeticiones: 1,
        };
      }

      if (mode === "specific") {
        const dates = normalizeDateList(
          prev.fechas_recurrencia?.length
            ? prev.fechas_recurrencia
            : prev.fecha_evento
              ? [prev.fecha_evento, addDaysToDateKey(prev.fecha_evento, 7)]
              : [],
        );
        return {
          ...prev,
          es_multidia: false,
          es_recurrente: true,
          fecha_fin: "",
          fechas_recurrencia: dates,
          cantidad_repeticiones: dates.length || 2,
          dia_recurrencia: getMainWeekday(dates),
        };
      }

      return {
        ...prev,
        es_multidia: false,
        es_recurrente: false,
        fecha_fin: "",
        fechas_recurrencia: [],
        dia_recurrencia: "",
        cantidad_repeticiones: 1,
      };
    });
    setErrors((prev) => ({
      ...prev,
      fecha_fin: null,
      fechas_recurrencia: null,
    }));
  };

  const updateRecurrenceDates = (dates) => {
    const nextDates = normalizeDateList(dates);
    setFormData((prev) => ({
      ...prev,
      fechas_recurrencia: nextDates,
      fecha_evento: nextDates[0] || prev.fecha_evento,
      cantidad_repeticiones: nextDates.length || 1,
      dia_recurrencia: getMainWeekday(nextDates),
    }));
    if (errors.fechas_recurrencia) {
      setErrors((prev) => ({ ...prev, fechas_recurrencia: null }));
    }
  };

  const handleRecurrenceDateChange = (index, value) => {
    const dates = normalizeDateList(formData.fechas_recurrencia);
    dates[index] = value;
    updateRecurrenceDates(dates);
  };

  const handleAddRecurrenceDate = () => {
    const dates = normalizeDateList(formData.fechas_recurrencia);
    const nextDate = dates.length
      ? addDaysToDateKey(dates[dates.length - 1], 7)
      : formData.fecha_evento || new Date().toISOString().slice(0, 10);
    updateRecurrenceDates([...dates, nextDate]);
  };

  const handleRemoveRecurrenceDate = (index) => {
    const dates = normalizeDateList(formData.fechas_recurrencia);
    updateRecurrenceDates(dates.filter((_, dateIndex) => dateIndex !== index));
  };

  const handleAddImages = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const maxTotal = 5;
    const currentTotal =
      (formData.imagenes?.length || 0) + newImageFiles.length;
    const available = maxTotal - currentTotal;
    if (available <= 0) return;
    setNewImageFiles((prev) => [...prev, ...files.slice(0, available)]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveNewImage = (index) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      const hasNoRealImages =
        getRealPublicationImages(formData.imagenes).length +
          newImageFiles.length ===
        0;
      const hasDateErrors =
        !formData.fecha_evento ||
        (formData.es_multidia &&
          (!formData.fecha_fin ||
            formData.fecha_fin < formData.fecha_evento)) ||
        (formData.es_recurrente &&
          normalizeDateList(formData.fechas_recurrencia).length < 2);
      setActiveTab(
        hasNoRealImages ? "media" : hasDateErrors ? "dates" : "info",
      );
      return;
    }

    const recurrenceDates = normalizeDateList(formData.fechas_recurrencia);
    const isRecurring = Boolean(formData.es_recurrente);
    const isMultiDay = Boolean(formData.es_multidia && !isRecurring);
    const scheduleEndDate = isRecurring
      ? recurrenceDates[recurrenceDates.length - 1] || formData.fecha_evento
      : isMultiDay
        ? formData.fecha_fin || formData.fecha_evento
        : formData.fecha_evento;

    // Preparar datos para guardar
    const dataToSave = {
      ...formData,
      redes_sociales: normalizeSocialLinks(formData.redes_sociales, {
        preserveEmpty: true,
      }),
      precio:
        formData.tipo_entrada === "pagado"
          ? parseInt(formData.precio) || null
          : null,
      url_venta:
        formData.tipo_entrada === "venta_externa"
          ? formData.url_venta || null
          : null,
      hora_inicio: formData.hora_inicio || null,
      hora_fin: formData.hora_fin || null,
      fecha_fin: scheduleEndDate,
      es_multidia: isMultiDay,
      es_recurrente: isRecurring,
      dia_recurrencia: isRecurring ? getMainWeekday(recurrenceDates) : "",
      cantidad_repeticiones: isRecurring ? recurrenceDates.length : 1,
      fechas_recurrencia: isRecurring ? recurrenceDates : [],
      mismo_horario: formData.mismo_horario !== false,
      imagenes: getRealPublicationImages(formData.imagenes),
    };

    // Subir nuevas imágenes si hay
    if (newImageFiles.length > 0 && event?.user_id) {
      setUploading(true);
      try {
        const uploadedUrls = [];
        for (const file of newImageFiles) {
          const url = await uploadEventImage(file, event.user_id);
          uploadedUrls.push(url);
        }
        dataToSave.imagenes = [...(dataToSave.imagenes || []), ...uploadedUrls];
      } catch (error) {
        console.error("Error al subir imágenes:", error);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    await onSave(event.id, dataToSave);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  if (!isOpen || !event) return null;

  const comunas = formData.provincia
    ? COMUNAS_POR_PROVINCIA[formData.provincia] || []
    : [];
  const scheduleMode = formData.es_recurrente
    ? "specific"
    : formData.es_multidia
      ? "range"
      : "single";
  const recurrenceDates = normalizeDateList(formData.fechas_recurrencia);
  const durationDays = getInclusiveDays(
    formData.fecha_evento,
    formData.fecha_fin,
  );

  return (
    <div className="admin-edit-overlay" onClick={handleOverlayClick}>
      <div
        className="admin-edit-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Editar publicación">
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
              activeTab === "dates" ? "active" : ""
            }`}
            onClick={() => setActiveTab("dates")}>
            <FontAwesomeIcon icon={faCalendarAlt} />
            <span>Fechas</span>
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
        <form
          onSubmit={handleSubmit}
          className="admin-edit-modal__content"
          onFocus={scrollOnFocus}>
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
                <label htmlFor="etiqueta_directa">
                  <FontAwesomeIcon icon={faTag} /> Etiqueta destacada
                </label>
                <input
                  type="text"
                  id="etiqueta_directa"
                  name="etiqueta_directa"
                  value={formData.etiqueta_directa}
                  onChange={handleChange}
                  placeholder="Ej: Imperdible, Gratis, Familiar..."
                  maxLength={50}
                />
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
                      value={formatChileanPhone(
                        formData.redes_sociales.whatsapp || "",
                      )}
                      onChange={handleChange}
                      placeholder="+56 9 1234 5678"
                    />
                  </div>
                </div>
                <div
                  className="admin-edit-field admin-edit-field--icon"
                  style={{ marginTop: "8px" }}>
                  <FontAwesomeIcon icon={faGlobe} className="field-icon" />
                  <input
                    type="url"
                    name="sitio_web"
                    value={formData.sitio_web}
                    onChange={handleChange}
                    placeholder="https://www.ejemplo.com"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab: Fechas */}
          {activeTab === "dates" && (
            <div className="admin-edit-section">
              <div className="admin-edit-field">
                <label>Tipo de calendario</label>
                <div className="admin-edit-schedule-options">
                  {SCHEDULE_MODES.map((mode) => (
                    <button
                      key={mode.value}
                      type="button"
                      className={`admin-edit-schedule-option ${
                        scheduleMode === mode.value ? "selected" : ""
                      }`}
                      onClick={() => handleScheduleModeChange(mode.value)}>
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="admin-edit-row">
                <div className="admin-edit-field">
                  <label htmlFor="fecha_evento">
                    Fecha de inicio <span className="required">*</span>
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

                {scheduleMode === "range" && (
                  <div className="admin-edit-field">
                    <label htmlFor="fecha_fin">
                      Fecha de término <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      id="fecha_fin"
                      name="fecha_fin"
                      value={formData.fecha_fin}
                      onChange={handleChange}
                      className={errors.fecha_fin ? "error" : ""}
                    />
                    {errors.fecha_fin && (
                      <span className="field-error">{errors.fecha_fin}</span>
                    )}
                  </div>
                )}
              </div>

              {scheduleMode === "range" && durationDays && (
                <div className="admin-edit-schedule-summary">
                  Dura {durationDays} día{durationDays > 1 ? "s" : ""}{" "}
                  consecutivo
                  {durationDays > 1 ? "s" : ""}.
                </div>
              )}

              {scheduleMode === "specific" && (
                <div className="admin-edit-subsection admin-edit-subsection--schedule">
                  <h4>
                    <FontAwesomeIcon icon={faCalendarAlt} /> Fechas de
                    repetición
                  </h4>
                  <div className="admin-edit-recurring-list">
                    {recurrenceDates.map((date, index) => (
                      <div
                        key={`${date}-${index}`}
                        className="admin-edit-recurring-row">
                        <span className="admin-edit-recurring-index">
                          {index + 1}
                        </span>
                        <input
                          type="date"
                          value={date}
                          onChange={(e) =>
                            handleRecurrenceDateChange(index, e.target.value)
                          }
                        />
                        <button
                          type="button"
                          className="admin-edit-recurring-remove"
                          onClick={() => handleRemoveRecurrenceDate(index)}
                          disabled={recurrenceDates.length <= 1}
                          aria-label="Quitar fecha">
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    ))}
                  </div>
                  {errors.fechas_recurrencia && (
                    <span className="field-error">
                      {errors.fechas_recurrencia}
                    </span>
                  )}
                  <button
                    type="button"
                    className="admin-edit-btn admin-edit-btn--ghost"
                    onClick={handleAddRecurrenceDate}>
                    <FontAwesomeIcon icon={faPlus} /> Agregar otra fecha
                  </button>
                  {recurrenceDates.length > 0 && (
                    <div className="admin-edit-schedule-summary">
                      Se repite {recurrenceDates.length} vez
                      {recurrenceDates.length > 1 ? "es" : ""}
                      {formData.dia_recurrencia
                        ? `; día principal: ${formData.dia_recurrencia}`
                        : ""}
                      .
                    </div>
                  )}
                </div>
              )}

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

              {(scheduleMode === "range" || scheduleMode === "specific") && (
                <label className="admin-edit-checkbox admin-edit-checkbox--boxed">
                  <input
                    type="checkbox"
                    name="mismo_horario"
                    checked={formData.mismo_horario !== false}
                    onChange={handleChange}
                  />
                  Usar el mismo horario todos los días
                </label>
              )}
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
                  <select
                    id="comuna"
                    name="comuna"
                    value={formData.comuna}
                    onChange={handleChange}
                    disabled={!formData.provincia}
                    className={errors.comuna ? "error" : ""}>
                    <option value="">
                      {formData.provincia
                        ? "Seleccionar comuna"
                        : "Primero selecciona provincia"}
                    </option>
                    {comunas.map((comuna) => (
                      <option key={comuna} value={comuna}>
                        {comuna}
                      </option>
                    ))}
                  </select>
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
                {errors.imagenes && (
                  <span className="field-error">{errors.imagenes}</span>
                )}

                {/* Nuevas imágenes seleccionadas */}
                {newImageFiles.length > 0 && (
                  <>
                    <p
                      style={{
                        color: "#ff6600",
                        fontSize: "0.85rem",
                        margin: "12px 0 8px",
                        fontWeight: "600",
                      }}>
                      Nuevas imágenes a subir:
                    </p>
                    <div className="admin-edit-images-grid">
                      {newImageFiles.map((file, index) => (
                        <div
                          key={`new-${index}`}
                          className="admin-edit-image-item"
                          style={{ border: "2px solid #ff6600" }}>
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Nueva ${index + 1}`}
                          />
                          <button
                            type="button"
                            className="admin-edit-image-remove"
                            onClick={() => handleRemoveNewImage(index)}>
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Botón para agregar imágenes */}
                {(formData.imagenes?.length || 0) + newImageFiles.length <
                  5 && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      onChange={handleAddImages}
                      style={{ display: "none" }}
                    />
                    <button
                      type="button"
                      className="admin-edit-btn admin-edit-btn--add-image"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        marginTop: "12px",
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "2px dashed rgba(255,102,0,0.5)",
                        background: "rgba(255,102,0,0.1)",
                        color: "#ff6600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        fontSize: "0.9rem",
                        fontWeight: "600",
                      }}>
                      <FontAwesomeIcon icon={faPlus} /> Agregar imágenes
                    </button>
                  </>
                )}
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
              disabled={loading || uploading}>
              {loading || uploading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  {uploading ? "Subiendo imágenes..." : "Guardando..."}
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
