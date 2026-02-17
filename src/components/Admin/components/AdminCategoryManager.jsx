import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faEdit,
  faTrash,
  faCheck,
  faTimes,
  faSpinner,
  faGripVertical,
  faToggleOn,
  faToggleOff,
  faExclamationTriangle,
  faPalette,
  faIcons,
  faSortNumericDown,
  faStore,
  faCalendarDays,
  faTag,
} from "@fortawesome/free-solid-svg-icons";
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllBusinessCategories,
  createBusinessCategory,
  updateBusinessCategory,
  deleteBusinessCategory,
} from "../../../lib/database";
import { useToast } from "../../../context/ToastContext";
import "./AdminCategoryManager.css";

/**
 * Formulario inline para crear/editar categoría
 */
const CategoryForm = ({ category, onSave, onCancel, loading, type }) => {
  const [form, setForm] = useState({
    nombre: category?.nombre || "",
    icono: category?.icono || "",
    color: category?.color || "#FF6600",
    orden: category?.orden ?? 0,
    activo: category?.activo ?? true,
  });
  // Subcategorías solo para negocios
  const [subcategorias, setSubcategorias] = useState(
    category?.subcategorias || [],
  );
  const [newSubcat, setNewSubcat] = useState("");

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddSubcat = () => {
    const trimmed = newSubcat.trim();
    if (trimmed && !subcategorias.includes(trimmed)) {
      setSubcategorias((prev) => [...prev, trimmed]);
      setNewSubcat("");
    }
  };

  const handleRemoveSubcat = (index) => {
    setSubcategorias((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    const data = { ...form };
    if (type === "business") {
      data.subcategorias = subcategorias;
    }
    onSave(data);
  };

  return (
    <form className="admin-cat-form" onSubmit={handleSubmit}>
      <div className="admin-cat-form__fields">
        <div className="admin-cat-form__field">
          <label>Nombre *</label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => handleChange("nombre", e.target.value)}
            placeholder="Ej: Música"
            maxLength={50}
            autoFocus
            required
          />
        </div>

        <div className="admin-cat-form__field">
          <label>
            <FontAwesomeIcon icon={faIcons} /> Ícono
          </label>
          <input
            type="text"
            value={form.icono}
            onChange={(e) => handleChange("icono", e.target.value)}
            placeholder="Ej: music, theater"
            maxLength={50}
          />
        </div>

        <div className="admin-cat-form__field admin-cat-form__field--color">
          <label>
            <FontAwesomeIcon icon={faPalette} /> Color
          </label>
          <div className="admin-cat-form__color-wrapper">
            <input
              type="color"
              value={form.color}
              onChange={(e) => handleChange("color", e.target.value)}
            />
            <input
              type="text"
              value={form.color}
              onChange={(e) => handleChange("color", e.target.value)}
              placeholder="#FF6600"
              maxLength={7}
              pattern="^#[0-9A-Fa-f]{6}$"
            />
          </div>
        </div>

        <div className="admin-cat-form__field admin-cat-form__field--small">
          <label>
            <FontAwesomeIcon icon={faSortNumericDown} /> Orden
          </label>
          <input
            type="number"
            value={form.orden}
            onChange={(e) =>
              handleChange("orden", parseInt(e.target.value) || 0)
            }
            min={0}
            max={999}
          />
        </div>

        <div className="admin-cat-form__field admin-cat-form__field--toggle">
          <label>Activa</label>
          <button
            type="button"
            className={`admin-cat-toggle ${form.activo ? "active" : ""}`}
            onClick={() => handleChange("activo", !form.activo)}>
            <FontAwesomeIcon icon={form.activo ? faToggleOn : faToggleOff} />
            <span>{form.activo ? "Sí" : "No"}</span>
          </button>
        </div>
      </div>

      {/* Subcategorías (solo negocios) */}
      {type === "business" && (
        <div className="admin-cat-subcats">
          <label className="admin-cat-subcats__label">
            <FontAwesomeIcon icon={faTag} /> Subcategorías
            <span className="admin-cat-subcats__count">
              ({subcategorias.length})
            </span>
          </label>
          <div className="admin-cat-subcats__list">
            {subcategorias.map((sub, i) => (
              <span key={i} className="admin-cat-subcats__chip">
                {sub}
                <button
                  type="button"
                  onClick={() => handleRemoveSubcat(i)}
                  className="admin-cat-subcats__chip-remove"
                  title="Eliminar">
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </span>
            ))}
          </div>
          <div className="admin-cat-subcats__add">
            <input
              type="text"
              value={newSubcat}
              onChange={(e) => setNewSubcat(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSubcat();
                }
              }}
              placeholder="Agregar subcategoría..."
              maxLength={80}
            />
            <button
              type="button"
              onClick={handleAddSubcat}
              disabled={!newSubcat.trim()}
              className="admin-cat-subcats__add-btn">
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>
        </div>
      )}

      <div className="admin-cat-form__actions">
        <button
          type="submit"
          className="admin-cat-form__btn admin-cat-form__btn--save"
          disabled={loading || !form.nombre.trim()}>
          {loading ? (
            <FontAwesomeIcon icon={faSpinner} spin />
          ) : (
            <FontAwesomeIcon icon={faCheck} />
          )}
          <span>{category ? "Guardar" : "Crear"}</span>
        </button>
        <button
          type="button"
          className="admin-cat-form__btn admin-cat-form__btn--cancel"
          onClick={onCancel}
          disabled={loading}>
          <FontAwesomeIcon icon={faTimes} />
          <span>Cancelar</span>
        </button>
      </div>
    </form>
  );
};

/**
 * Gestor de categorías para el panel de administración
 * Permite gestionar categorías de eventos y de negocios
 */
export default function AdminCategoryManager() {
  const { showToast } = useToast();
  const [categoryType, setCategoryType] = useState("event"); // "event" | "business"
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Funciones CRUD según el tipo
  const crudFns =
    categoryType === "event"
      ? {
          getAll: getAllCategories,
          create: createCategory,
          update: updateCategory,
          remove: deleteCategory,
        }
      : {
          getAll: getAllBusinessCategories,
          create: createBusinessCategory,
          update: updateBusinessCategory,
          remove: deleteBusinessCategory,
        };

  // Cargar categorías
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await crudFns.getAll();
      setCategories(data || []);
    } catch (error) {
      console.error("Error cargando categorías:", error);
      showToast("Error al cargar categorías", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast, categoryType]);

  useEffect(() => {
    // Reset UI state on type change
    setShowCreateForm(false);
    setEditingId(null);
    setDeleteConfirm(null);
    loadCategories();
  }, [loadCategories]);

  // Cambiar tipo
  const handleTypeChange = (newType) => {
    if (newType !== categoryType) {
      setCategoryType(newType);
    }
  };

  // Crear categoría
  const handleCreate = async (formData) => {
    try {
      setActionLoading("create");
      await crudFns.create(formData);
      showToast("Categoría creada exitosamente", "success");
      setShowCreateForm(false);
      await loadCategories();
    } catch (error) {
      showToast(error.message || "Error al crear categoría", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Actualizar categoría
  const handleUpdate = async (categoryId, formData) => {
    try {
      setActionLoading(categoryId);
      await crudFns.update(categoryId, formData);
      showToast("Categoría actualizada", "success");
      setEditingId(null);
      await loadCategories();
    } catch (error) {
      showToast(error.message || "Error al actualizar categoría", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle activo/inactivo rápido
  const handleToggleActive = async (category) => {
    try {
      setActionLoading(category.id);
      await crudFns.update(category.id, { activo: !category.activo });
      setCategories((prev) =>
        prev.map((c) =>
          c.id === category.id ? { ...c, activo: !c.activo } : c,
        ),
      );
      showToast(
        `Categoría ${!category.activo ? "activada" : "desactivada"}`,
        "success",
      );
    } catch (error) {
      showToast(error.message || "Error al cambiar estado", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Eliminar categoría
  const handleDelete = async (categoryId) => {
    try {
      setActionLoading(categoryId);
      await crudFns.remove(categoryId);
      showToast("Categoría eliminada", "success");
      setDeleteConfirm(null);
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    } catch (error) {
      showToast(error.message || "Error al eliminar categoría", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const typeLabel =
    categoryType === "event" ? "Categoría Evento" : "Categoría Negocio";

  if (loading) {
    return (
      <div className="admin-categories">
        <h2>Gestor de Categorías</h2>
        {/* Selector de tipo */}
        <div className="admin-categories__type-selector">
          <button
            className={`admin-categories__type-btn ${categoryType === "event" ? "admin-categories__type-btn--active" : ""}`}
            onClick={() => handleTypeChange("event")}>
            <FontAwesomeIcon icon={faCalendarDays} />
            <span>Categoría Evento</span>
          </button>
          <button
            className={`admin-categories__type-btn ${categoryType === "business" ? "admin-categories__type-btn--active" : ""}`}
            onClick={() => handleTypeChange("business")}>
            <FontAwesomeIcon icon={faStore} />
            <span>Categoría Negocio</span>
          </button>
        </div>
        <div className="admin-categories__loading">
          <FontAwesomeIcon icon={faSpinner} spin />
          <span>Cargando categorías...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-categories">
      {/* Header */}
      <div className="admin-categories__header">
        <div className="admin-categories__header-left">
          <h2>Gestor de Categorías</h2>
          <span className="admin-categories__count">
            {categories.length} categoría{categories.length !== 1 ? "s" : ""}
          </span>
        </div>
        {!showCreateForm && !editingId && (
          <button
            className="admin-categories__add-btn"
            onClick={() => setShowCreateForm(true)}>
            <FontAwesomeIcon icon={faPlus} />
            <span>Nueva {typeLabel}</span>
          </button>
        )}
      </div>

      {/* Selector de tipo */}
      <div className="admin-categories__type-selector">
        <button
          className={`admin-categories__type-btn ${categoryType === "event" ? "admin-categories__type-btn--active" : ""}`}
          onClick={() => handleTypeChange("event")}>
          <FontAwesomeIcon icon={faCalendarDays} />
          <span>Categoría Evento</span>
        </button>
        <button
          className={`admin-categories__type-btn ${categoryType === "business" ? "admin-categories__type-btn--active" : ""}`}
          onClick={() => handleTypeChange("business")}>
          <FontAwesomeIcon icon={faStore} />
          <span>Categoría Negocio</span>
        </button>
      </div>

      {/* Formulario de creación */}
      {showCreateForm && (
        <div className="admin-categories__create-section">
          <h3>Crear Nueva {typeLabel}</h3>
          <CategoryForm
            onSave={handleCreate}
            onCancel={() => setShowCreateForm(false)}
            loading={actionLoading === "create"}
            type={categoryType}
          />
        </div>
      )}

      {/* Lista de categorías */}
      {categories.length === 0 ? (
        <div className="admin-categories__empty">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <p>No hay categorías creadas</p>
          <button onClick={() => setShowCreateForm(true)}>
            Crear primera categoría
          </button>
        </div>
      ) : (
        <div className="admin-categories__list">
          {/* Header de la tabla */}
          <div className="admin-cat-row admin-cat-row--header">
            <span className="admin-cat-col admin-cat-col--order">#</span>
            <span className="admin-cat-col admin-cat-col--color">Color</span>
            <span className="admin-cat-col admin-cat-col--name">Nombre</span>
            <span className="admin-cat-col admin-cat-col--icon">Ícono</span>
            <span className="admin-cat-col admin-cat-col--status">Estado</span>
            <span className="admin-cat-col admin-cat-col--actions">
              Acciones
            </span>
          </div>

          {/* Filas */}
          {categories.map((category) =>
            editingId === category.id ? (
              <div
                key={category.id}
                className="admin-cat-row admin-cat-row--editing">
                <CategoryForm
                  category={category}
                  onSave={(data) => handleUpdate(category.id, data)}
                  onCancel={() => setEditingId(null)}
                  loading={actionLoading === category.id}
                  type={categoryType}
                />
              </div>
            ) : (
              <div
                key={category.id}
                className={`admin-cat-row ${!category.activo ? "admin-cat-row--inactive" : ""}`}>
                <span className="admin-cat-col admin-cat-col--order">
                  <FontAwesomeIcon
                    icon={faGripVertical}
                    className="admin-cat-grip"
                  />
                  {category.orden}
                </span>

                <span className="admin-cat-col admin-cat-col--color">
                  <span
                    className="admin-cat-color-dot"
                    style={{ background: category.color || "#FF6600" }}
                  />
                </span>

                <span className="admin-cat-col admin-cat-col--name">
                  {category.nombre}
                  {categoryType === "business" &&
                    category.subcategorias?.length > 0 && (
                      <span className="admin-cat-subcount">
                        {category.subcategorias.length} sub
                      </span>
                    )}
                </span>

                <span className="admin-cat-col admin-cat-col--icon">
                  {category.icono || "—"}
                </span>

                <span className="admin-cat-col admin-cat-col--status">
                  <button
                    className={`admin-cat-status ${category.activo ? "admin-cat-status--active" : "admin-cat-status--inactive"}`}
                    onClick={() => handleToggleActive(category)}
                    disabled={actionLoading === category.id}>
                    {actionLoading === category.id ? (
                      <FontAwesomeIcon icon={faSpinner} spin />
                    ) : (
                      <>
                        <FontAwesomeIcon
                          icon={category.activo ? faToggleOn : faToggleOff}
                        />
                        <span>{category.activo ? "Activa" : "Inactiva"}</span>
                      </>
                    )}
                  </button>
                </span>

                <span className="admin-cat-col admin-cat-col--actions">
                  <button
                    className="admin-pub-btn admin-pub-btn--edit"
                    title="Editar"
                    onClick={() => setEditingId(category.id)}
                    disabled={actionLoading === category.id}>
                    <FontAwesomeIcon icon={faEdit} />
                  </button>

                  {deleteConfirm === category.id ? (
                    <div className="admin-cat-delete-confirm">
                      <span>¿Eliminar?</span>
                      <button
                        className="admin-pub-btn admin-pub-btn--delete"
                        onClick={() => handleDelete(category.id)}
                        disabled={actionLoading === category.id}
                        title="Confirmar eliminación">
                        {actionLoading === category.id ? (
                          <FontAwesomeIcon icon={faSpinner} spin />
                        ) : (
                          <FontAwesomeIcon icon={faCheck} />
                        )}
                      </button>
                      <button
                        className="admin-pub-btn admin-pub-btn--view"
                        onClick={() => setDeleteConfirm(null)}
                        title="Cancelar">
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </div>
                  ) : (
                    <button
                      className="admin-pub-btn admin-pub-btn--delete"
                      title="Eliminar"
                      onClick={() => setDeleteConfirm(category.id)}
                      disabled={actionLoading === category.id}>
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  )}
                </span>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
