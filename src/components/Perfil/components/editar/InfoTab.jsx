import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBuilding } from "@fortawesome/free-solid-svg-icons";

/**
 * Tab de información básica del evento
 */
export default function InfoTab({ formData, errors, categories, onChange }) {
  return (
    <div className="user-edit-modal__content">
      <div className="user-edit-modal__field">
        <label htmlFor="titulo">
          Título <span className="required">*</span>
        </label>
        <input
          type="text"
          id="titulo"
          name="titulo"
          value={formData.titulo}
          onChange={onChange}
          placeholder="Título del evento"
          className={errors.titulo ? "error" : ""}
        />
        {errors.titulo && (
          <span className="user-edit-modal__error">{errors.titulo}</span>
        )}
      </div>

      <div className="user-edit-modal__field">
        <label htmlFor="organizador">
          <FontAwesomeIcon icon={faBuilding} />
          Organizador
        </label>
        <input
          type="text"
          id="organizador"
          name="organizador"
          value={formData.organizador}
          onChange={onChange}
          placeholder="Nombre del organizador"
        />
      </div>

      <div className="user-edit-modal__field">
        <label htmlFor="descripcion">Descripción</label>
        <textarea
          id="descripcion"
          name="descripcion"
          value={formData.descripcion}
          onChange={onChange}
          rows={4}
          placeholder="Describe el evento..."
        />
      </div>

      <div className="user-edit-modal__field">
        <label htmlFor="category_id">
          Categoría <span className="required">*</span>
        </label>
        <select
          id="category_id"
          name="category_id"
          value={formData.category_id}
          onChange={onChange}
          className={errors.category_id ? "error" : ""}>
          <option value="">Selecciona una categoría</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nombre}
            </option>
          ))}
        </select>
        {errors.category_id && (
          <span className="user-edit-modal__error">{errors.category_id}</span>
        )}
      </div>

      <div className="user-edit-modal__field">
        <label htmlFor="mensaje_marketing">Mensaje promocional</label>
        <textarea
          id="mensaje_marketing"
          name="mensaje_marketing"
          value={formData.mensaje_marketing}
          onChange={onChange}
          rows={2}
          placeholder="Mensaje destacado para promocionar tu evento..."
        />
      </div>
    </div>
  );
}
