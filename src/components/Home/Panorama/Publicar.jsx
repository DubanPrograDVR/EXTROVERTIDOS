import usePublicarForm from "./hooks/usePublicarFormV2";
import {
  PublicarHeader,
  PublicarInfo,
  PublicarForm,
  PublicarAuthModal,
} from "./components";
import "./styles/publicar.css";

/**
 * Componente principal para publicar panoramas/eventos
 * Refactorizado para mejorar escalabilidad y mantenibilidad
 * Soporta creación y edición de eventos
 */
const Publicar = () => {
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
    isGoogleLoading,
    isEditing,
    isSavingDraft,
    // Handlers
    handleFieldFocus,
    handleGoogleLogin,
    handleChange,
    handleImageChange,
    removeImage,
    handleSubmit,
    handleSaveDraft,
    closeAuthModal,
  } = usePublicarForm();

  // Mostrar carga mientras se obtiene el evento para editar
  if (loadingEvent) {
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
      />

      {/* Modal de autenticación */}
      <PublicarAuthModal
        isOpen={showAuthModal}
        onClose={closeAuthModal}
        onGoogleLogin={handleGoogleLogin}
        isGoogleLoading={isGoogleLoading}
      />
    </div>
  );
};

export default Publicar;
