import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import usePublicarForm from "./hooks/usePublicarFormV2";
import { useAuth } from "../../../context/AuthContext";
import AuthModal from "../../Auth/AuthModal";
import {
  PublicarHeader,
  PublicarInfo,
  PublicarForm,
  PublicarAuthModal,
  PlanBlockModal,
  detectBlockScenario,
} from "./components";
import { INITIAL_FORM_STATE } from "./constants";
import "./styles/publicar.css";

/**
 * Componente principal para publicar panoramas/eventos
 * Refactorizado para mejorar escalabilidad y mantenibilidad
 * Soporta creación y edición de eventos
 */
const Publicar = () => {
  const { isAdmin, isModerator, isAuthenticated } = useAuth();
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
    activeSubscription,
    anyPanoramaSubscription,
    planesEnabled,
    enabledCalendarModes,
    planInfo,
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
  } = usePublicarForm();

  // Detectar si el usuario está bloqueado para publicar
  // (solo aplica para nuevas publicaciones, no edición)
  const blockScenario = useMemo(() => {
    if (isEditing) return null; // Editar siempre permitido
    return detectBlockScenario({
      subscription: activeSubscription || anyPanoramaSubscription,
      planesEnabled,
      planInfo,
      isAdmin,
      isModerator,
    });
  }, [
    isEditing,
    activeSubscription,
    anyPanoramaSubscription,
    planesEnabled,
    planInfo,
    isAdmin,
    isModerator,
  ]);

  // Detectar si el formulario tiene datos (no está en blanco)
  const isDirty = useMemo(() => {
    if (!formData) return false;
    const keys = Object.keys(INITIAL_FORM_STATE);
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

  // === MODAL INTERCEPTOR: bloquear si no puede publicar ===
  if (blockScenario) {
    return (
      <div className="publicar-page">
        <PublicarHeader />
        <PlanBlockModal
          scenario={blockScenario}
          subscription={activeSubscription || anyPanoramaSubscription}
        />
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
        onSubmit={handleSubmit}
        onChange={handleChange}
        onFieldFocus={handleFieldFocus}
        onImageChange={handleImageChange}
        onRemoveImage={removeImage}
        onSaveDraft={handleSaveDraft}
        enabledCalendarModes={enabledCalendarModes}
        isDirty={isDirty && !isEditing}
        onReset={resetForm}
      />

      {/* Modal de autenticación */}
      <PublicarAuthModal isOpen={showAuthModal} onClose={closeAuthModal} />
    </div>
  );
};

export default Publicar;
