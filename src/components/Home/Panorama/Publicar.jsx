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
  PlanBlockModal,
  PublicationTypeModal,
  detectBlockScenario,
} from "./components";
import { INITIAL_FORM_STATE, PUBLICATION_TYPES } from "./constants";
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
    destacadasEnabled,
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

  // === MODAL DE TIPO DE PUBLICACIÓN ===
  // Al presionar "Publicar" en una publicación nueva, se muestra un modal para
  // elegir entre Normal (gratis) o Destacada (paga vía Webpay). Para ediciones
  // se omite el modal y se guarda directamente.
  const [showTypeModal, setShowTypeModal] = useState(false);
  // Cuando el usuario está bloqueado por plan pero elige la ruta Destacada,
  // se salta la validación de plan y se envía directo como destacada.
  const [forceDestacada, setForceDestacada] = useState(false);

  const handleFormSubmit = useCallback(
    (event) => {
      event?.preventDefault?.();
      if (isSubmitting) return;
      if (isEditing) {
        // Edición: mantener flujo actual sin selector de tipo.
        handleSubmit(event);
        return;
      }
      if (forceDestacada) {
        // El usuario llegó vía el CTA de destacada desde PlanBlockModal:
        // se salta la selección y se envía como destacada directamente.
        handleSubmit({ tipoPublicacion: PUBLICATION_TYPES.DESTACADA });
        return;
      }
      if (!destacadasEnabled) {
        // Destacadas desactivadas globalmente por el admin: sin modal,
        // se publica directamente como normal (gratis).
        handleSubmit({ tipoPublicacion: PUBLICATION_TYPES.NORMAL });
        return;
      }
      setShowTypeModal(true);
    },
    [isSubmitting, isEditing, handleSubmit, forceDestacada, destacadasEnabled],
  );

  const handleSelectPublicationType = useCallback(
    async (tipo) => {
      const result = await handleSubmit({ tipoPublicacion: tipo });
      setShowTypeModal(false);
      return result;
    },
    [handleSubmit],
  );

  const handleCloseTypeModal = useCallback(() => {
    if (isSubmitting) return;
    setShowTypeModal(false);
  }, [isSubmitting]);

  const handlePublishDestacadaFromBlock = useCallback(() => {
    setForceDestacada(true);
  }, []);

  // Detectar si el usuario está bloqueado para publicar
  // (solo aplica para nuevas publicaciones, no edición)
  // Si el usuario eligió "Publicar como Destacada" desde el bloque, se ignora
  // el escenario ya que destacada no requiere plan.
  const blockScenario = useMemo(() => {
    if (isEditing) return null; // Editar siempre permitido
    if (forceDestacada) return null;
    return detectBlockScenario({
      subscription: activeSubscription || anyPanoramaSubscription,
      planesEnabled,
      planInfo,
      isAdmin,
      isModerator,
    });
  }, [
    isEditing,
    forceDestacada,
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
          onPublishDestacada={
            destacadasEnabled ? handlePublishDestacadaFromBlock : null
          }
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
        onSubmit={handleFormSubmit}
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

      {/* Modal de tipo de publicación (Normal / Destacada) */}
      <PublicationTypeModal
        isOpen={showTypeModal && !isEditing && destacadasEnabled}
        onClose={handleCloseTypeModal}
        onSelect={handleSelectPublicationType}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default Publicar;
