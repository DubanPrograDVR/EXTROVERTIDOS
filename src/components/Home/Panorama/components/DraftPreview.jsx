import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faCalendarDays,
  faCalendarWeek,
  faClock,
  faTicket,
  faLocationDot,
  faUser,
  faBuilding,
  faImage,
} from "@fortawesome/free-solid-svg-icons";
import {
  faInstagram,
  faFacebook,
  faWhatsapp,
} from "@fortawesome/free-brands-svg-icons";

/**
 * Componente de vista previa del borrador
 * Muestra cómo se verá la publicación en tiempo real
 */
const DraftPreview = ({
  isOpen,
  onClose,
  formData,
  previewImages,
  categories,
}) => {
  if (!isOpen) return null;

  // Obtener categoría seleccionada
  const selectedCategory = categories?.find(
    (cat) => cat.id === parseInt(formData.category_id)
  );

  // Formatear fecha
  const formatearFecha = (fecha, formato = "largo") => {
    if (!fecha) return "Sin fecha";
    const date = new Date(fecha + "T00:00:00");
    if (formato === "corto") {
      return date.toLocaleDateString("es-CL", {
        day: "numeric",
        month: "short",
      });
    }
    return date.toLocaleDateString("es-CL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Formatear hora
  const formatearHora = (hora) => {
    if (!hora) return null;
    return hora.substring(0, 5);
  };

  // Obtener display de fecha
  const getFechaDisplay = () => {
    if (!formData.fecha_evento) return "Fecha no especificada";
    
    if (formData.es_multidia && formData.fecha_fin) {
      const inicioCorto = formatearFecha(formData.fecha_evento, "corto");
      const finCorto = formatearFecha(formData.fecha_fin, "corto");
      const anio = new Date(formData.fecha_evento + "T00:00:00").getFullYear();
      return `${inicioCorto} al ${finCorto}, ${anio}`;
    }
    return formatearFecha(formData.fecha_evento);
  };

  // Obtener texto de entrada
  const getEntradaText = () => {
    const tipos = {
      sin_entrada: "Sin entrada requerida",
      gratuito: "Entrada gratuita",
      pagado: formData.precio ? `$${formData.precio} CLP` : "Precio por definir",
      venta_externa: "Ver enlace de venta",
    };
    return tipos[formData.tipo_entrada] || "No especificado";
  };

  // Obtener imagen de preview
  const getPreviewImage = () => {
    if (previewImages && previewImages.length > 0) {
      return previewImages[0];
    }
    return "/img/placeholder-event.png";
  };

  // Verificar si hay redes sociales
  const hasRedesSociales = () => {
    return (
      formData.redes_sociales?.instagram ||
      formData.redes_sociales?.facebook ||
      formData.redes_sociales?.whatsapp
    );
  };

  return (
    <div className="draft-preview-overlay" onClick={onClose}>
      <div className="draft-preview" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="draft-preview__header">
          <h2>Vista Previa del Borrador</h2>
          <button className="draft-preview__close" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Contenido */}
        <div className="draft-preview__content">
          {/* Imagen principal */}
          <div className="draft-preview__image-container">
            {previewImages && previewImages.length > 0 ? (
              <>
                <img
                  src={getPreviewImage()}
                  alt="Preview"
                  className="draft-preview__image"
                />
                {previewImages.length > 1 && (
                  <div className="draft-preview__image-count">
                    <FontAwesomeIcon icon={faImage} />
                    +{previewImages.length - 1} más
                  </div>
                )}
              </>
            ) : (
              <div className="draft-preview__no-image">
                <FontAwesomeIcon icon={faImage} />
                <span>Sin imágenes</span>
              </div>
            )}
            
            {/* Badge de categoría */}
            {selectedCategory && (
              <span
                className="draft-preview__category"
                style={{ backgroundColor: selectedCategory.color || "#ff6600" }}
              >
                {selectedCategory.nombre}
              </span>
            )}
          </div>

          {/* Info principal */}
          <div className="draft-preview__info">
            {/* Título */}
            <h3 className="draft-preview__title">
              {formData.titulo || "Título del evento"}
            </h3>

            {/* Organizador */}
            {formData.organizador && (
              <p className="draft-preview__organizer">
                <FontAwesomeIcon icon={faBuilding} />
                {formData.organizador}
              </p>
            )}

            {/* Fecha */}
            <div className="draft-preview__detail">
              <FontAwesomeIcon
                icon={formData.es_multidia ? faCalendarWeek : faCalendarDays}
              />
              <span>{getFechaDisplay()}</span>
            </div>

            {/* Horario */}
            {(formData.hora_inicio || formData.hora_fin) && (
              <div className="draft-preview__detail">
                <FontAwesomeIcon icon={faClock} />
                <span>
                  {formData.hora_inicio && formatearHora(formData.hora_inicio)}
                  {formData.hora_inicio && formData.hora_fin && " - "}
                  {formData.hora_fin && formatearHora(formData.hora_fin)}
                </span>
              </div>
            )}

            {/* Ubicación */}
            <div className="draft-preview__detail">
              <FontAwesomeIcon icon={faLocationDot} />
              <span>
                {formData.direccion || "Dirección"}
                {formData.comuna && `, ${formData.comuna}`}
                {formData.provincia && `, ${formData.provincia}`}
              </span>
            </div>

            {/* Entrada */}
            <div className="draft-preview__detail draft-preview__detail--ticket">
              <FontAwesomeIcon icon={faTicket} />
              <span>{getEntradaText()}</span>
            </div>

            {/* Descripción */}
            <div className="draft-preview__description">
              <h4>Descripción</h4>
              <p>
                {formData.descripcion || "Sin descripción agregada aún..."}
              </p>
            </div>

            {/* Redes sociales */}
            {hasRedesSociales() && (
              <div className="draft-preview__socials">
                <h4>Redes Sociales</h4>
                <div className="draft-preview__socials-list">
                  {formData.redes_sociales?.instagram && (
                    <span className="draft-preview__social">
                      <FontAwesomeIcon icon={faInstagram} />
                      Instagram
                    </span>
                  )}
                  {formData.redes_sociales?.facebook && (
                    <span className="draft-preview__social">
                      <FontAwesomeIcon icon={faFacebook} />
                      Facebook
                    </span>
                  )}
                  {formData.redes_sociales?.whatsapp && (
                    <span className="draft-preview__social">
                      <FontAwesomeIcon icon={faWhatsapp} />
                      WhatsApp
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer con nota */}
        <div className="draft-preview__footer">
          <p>
            <strong>Nota:</strong> Esta es una vista previa. Los cambios que
            realices en el formulario se reflejarán aquí automáticamente.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DraftPreview;
