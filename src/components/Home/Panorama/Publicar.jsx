import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import usePublicarForm from "./hooks/usePublicarFormV2";
import { useAuth } from "../../../context/AuthContext";
import AuthModal from "../../Auth/AuthModal";
import {
  PublicarHeader,
  PublicarInfo,
  PublicarForm,
  PublicarAuthModal,
  PublicationTypeModal,
} from "./components";
import { INITIAL_FORM_STATE, PUBLICATION_TYPES } from "./constants";
import "./styles/publicar.css";

/**
 * Componente principal para publicar panoramas/eventos
 * Refactorizado para mejorar escalabilidad y mantenibilidad
 * Soporta creación y edición de eventos
 */
const Publicar = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const {
    // Estados
    formData,
    categories,
    loadingCategories,
    loadingEvent,
    showAuthModal,
    errors,
    isSubmitting,
    previewImages,
    isEditing,
    isSavingDraft,
    // Plan
    planesEnabled,
    destacadasEnabled,
    enabledCalendarModes,
    enabledFields,
    isLoading,
    // Handlers
    handleFieldFocus,
    handleChange,
    handleImageChange,
    removeImage,
    handleSubmit,
    handleSaveDraft,
    closeAuthModal,
    resetForm,
    selectPublicationType,
  } = usePublicarForm();

  // === SELECCIÓN DE PLAN ===
  // El plan se elige ANTES del formulario, no al enviarlo: los campos visibles
  // dependen de él (gratuito = subconjunto, destacada = formulario completo).
  // En edición no se pregunta, y si el admin desactivó las destacadas no hay
  // nada que elegir: se publica gratis.
  const [planChosen, setPlanChosen] = useState(false);
  const needsPlanChoice = !isEditing && !planChosen && destacadasEnabled;

  const handleSelectPublicationType = useCallback(
    (tipo) => {
      selectPublicationType(tipo);
      setPlanChosen(true);
    },
    [selectPublicationType],
  );

  // Cerrar sin elegir equivale a continuar con el plan gratuito
  const handleCloseTypeModal = useCallback(() => {
    selectPublicationType(PUBLICATION_TYPES.NORMAL);
    setPlanChosen(true);
  }, [selectPublicationType]);

  const handleFormSubmit = useCallback(
    (event) => {
      event?.preventDefault?.();
      if (isSubmitting) return;
      if (isEditing) {
        // Edición: mantener flujo actual sin selector de tipo.
        handleSubmit(event);
        return;
      }
      // El plan ya está en formData desde la selección previa.
      handleSubmit({ tipoPublicacion: formData.tipo_publicacion });
    },
    [isSubmitting, isEditing, handleSubmit, formData.tipo_publicacion],
  );

  // Detectar si el formulario tiene datos (no está en blanco).
  // 'tipo_publicacion' se excluye: elegir plan no es "escribir" en el
  // formulario y no debe activar el botón de "Limpiar todo".
  const isDirty = useMemo(() => {
    if (!formData) return false;
    const keys = Object.keys(INITIAL_FORM_STATE).filter(
      (key) => key !== "tipo_publicacion",
    );
    for (const key of keys) {
      const initial = INITIAL_FORM_STATE[key];
      const current = formData[key];
      if (Array.isArray(initial)) {
        if (Array.isArray(current) && current.length > 0) return true;
      } else if (initial !== null && typeof initial === "object") {
        const initialJson = JSON.stringify(initial);
        const currentJson = JSON.stringify(current ?? {});
        if (initialJson !== currentJson) return true;
      } else if (typeof initial === "boolean") {
        if (current !== initial) return true;
      } else if (typeof initial === "number") {
        if (current !== initial && current !== "" && current != null)
          return true;
      } else {
        const val =
          current === undefined || current === null ? "" : String(current);
        const init =
          initial === undefined || initial === null ? "" : String(initial);
        if (val.trim() !== init.trim()) return true;
      }
    }
    return false;
  }, [formData]);

  // Mostrar carga mientras se obtienen datos
  if (loadingEvent || isLoading) {
    return (
      <div className="publicar-page">
        <PublicarHeader />
        <div className="publicar-loading">
          <div className="publicar-loading__spinner"></div>
          <p>Cargando publicación...</p>
        </div>
      </div>
    );
  }

  // === Si no está autenticado y planes están habilitados, mostrar login ===
  if (!isAuthenticated && planesEnabled) {
    return (
      <div className="publicar-page">
        <PublicarHeader />
        <AuthModal isOpen={true} onClose={() => navigate("/")} persistent />
      </div>
    );
  }

  return (
    <div className="publicar-page">
      {/* Header con logo */}
      <PublicarHeader />

      {/* Información de pasos (solo para nuevas publicaciones) */}
      {!isEditing && <PublicarInfo />}

      {/* Título de edición */}
      {isEditing && (
        <div className="publicar-edit-banner">
          <h2>✏️ Editando publicación</h2>
          <p>Modifica los datos que necesites y guarda los cambios</p>
        </div>
      )}

      {/* Formulario principal */}
      <PublicarForm
        formData={formData}
        categories={categories}
        loadingCategories={loadingCategories}
        errors={errors}
        isSubmitting={isSubmitting}
        previewImages={previewImages}
        isEditing={isEditing}
        isSavingDraft={isSavingDraft}
        onSubmit={handleFormSubmit}
        onChange={handleChange}
        onFieldFocus={handleFieldFocus}
        onImageChange={handleImageChange}
        onRemoveImage={removeImage}
        onSaveDraft={handleSaveDraft}
        enabledCalendarModes={enabledCalendarModes}
        enabledFields={enabledFields}
        isDirty={isDirty && !isEditing}
        onReset={resetForm}
      />

      {/* Modal de autenticación */}
      <PublicarAuthModal isOpen={showAuthModal} onClose={closeAuthModal} />

      {/* Selección de plan (Gratuito / Destacada) antes del formulario */}
      <PublicationTypeModal
        isOpen={needsPlanChoice}
        onClose={handleCloseTypeModal}
        onSelect={handleSelectPublicationType}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default Publicar;
