import { useMemo } from "react";
import usePublicarForm from "./hooks/usePublicarFormV2";
import { useAuth } from "../../../context/AuthContext";
import {
  PublicarHeader,
  PublicarInfo,
  PublicarForm,
  PublicarAuthModal,
  PlanBlockModal,
  detectBlockScenario,
} from "./components";
import "./styles/publicar.css";

/**
 * Componente principal para publicar panoramas/eventos
 * Refactorizado para mejorar escalabilidad y mantenibilidad
 * Soporta creación y edición de eventos
 */
const Publicar = () => {
  const { isAdmin, isModerator } = useAuth();
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
      />

      {/* Modal de autenticación */}
      <PublicarAuthModal isOpen={showAuthModal} onClose={closeAuthModal} />
    </div>
  );
};

export default Publicar;
