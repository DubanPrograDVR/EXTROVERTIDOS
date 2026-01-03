import usePublicarForm from "./hooks/usePublicarForm";
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
 */
const Publicar = () => {
  const {
    // Estados
    formData,
    categories,
    loadingCategories,
    showAuthModal,
    errors,
    isSubmitting,
    previewImages,
    isGoogleLoading,
    // Handlers
    handleFieldFocus,
    handleGoogleLogin,
    handleChange,
    handleImageChange,
    removeImage,
    handleSubmit,
    closeAuthModal,
  } = usePublicarForm();

  return (
    <div className="publicar-page">
      {/* Header con logo */}
      <PublicarHeader />

      {/* Información de pasos */}
      <PublicarInfo />

      {/* Formulario principal */}
      <PublicarForm
        formData={formData}
        categories={categories}
        loadingCategories={loadingCategories}
        errors={errors}
        isSubmitting={isSubmitting}
        previewImages={previewImages}
        onSubmit={handleSubmit}
        onChange={handleChange}
        onFieldFocus={handleFieldFocus}
        onImageChange={handleImageChange}
        onRemoveImage={removeImage}
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
