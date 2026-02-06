import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

// Componentes modulares
import {
  InformacionBasicaSection,
  UbicacionSection,
  ContactoSection,
  HorariosSection,
  RedesSocialesSection,
  ImagenesSection,
  AuthModal,
  useNegocioForm,
} from "./components";

import "./styles/publicar-negocio.css";

const PublicarNegocio = () => {
  // Hook personalizado que maneja toda la lógica del formulario
  const {
    formData,
    errors,
    categories,
    loadingCategories,
    isSubmitting,
    previewImages,
    showAuthModal,
    handleChange,
    handleDiaChange,
    handleSaveHorarios,
    handleImageChange,
    removeImage,
    handleFieldFocus,
    handleSubmit,
    setShowAuthModal,
  } = useNegocioForm();

  return (
    <div className="publicar-negocio">
      {/* Header */}
      <header className="publicar-negocio__header">
        <h1 className="publicar-negocio__title">Publicar Negocio</h1>
        <p className="publicar-negocio__subtitle">
          Registra tu negocio y llega a más clientes en la región del Maule
        </p>
      </header>

      {/* Formulario */}
      <form className="publicar-negocio__form" onSubmit={handleSubmit}>
        {/* Información básica */}
        <InformacionBasicaSection
          formData={formData}
          errors={errors}
          categories={categories}
          loadingCategories={loadingCategories}
          onChange={handleChange}
          onFieldFocus={handleFieldFocus}
        />

        {/* Ubicación */}
        <UbicacionSection
          formData={formData}
          errors={errors}
          onChange={handleChange}
          onFieldFocus={handleFieldFocus}
        />

        {/* Contacto */}
        <ContactoSection
          formData={formData}
          errors={errors}
          onChange={handleChange}
          onFieldFocus={handleFieldFocus}
        />

        {/* Horarios */}
        <HorariosSection
          formData={formData}
          onDiaChange={handleDiaChange}
          onSaveHorarios={handleSaveHorarios}
          onFieldFocus={handleFieldFocus}
        />

        {/* Redes Sociales */}
        <RedesSocialesSection
          formData={formData}
          onChange={handleChange}
          onFieldFocus={handleFieldFocus}
        />

        {/* Imágenes */}
        <ImagenesSection
          previewImages={previewImages}
          errors={errors}
          onImageChange={handleImageChange}
          onRemoveImage={removeImage}
          onFieldFocus={handleFieldFocus}
        />

        {/* Botón enviar */}
        <button
          type="submit"
          className="publicar-negocio__submit"
          disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <FontAwesomeIcon icon={faSpinner} spin />
              Publicando...
            </>
          ) : (
            "Publicar Negocio"
          )}
        </button>
      </form>

      {/* Modal de autenticación */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default PublicarNegocio;
