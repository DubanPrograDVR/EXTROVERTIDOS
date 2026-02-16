import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faEye, faSave } from "@fortawesome/free-solid-svg-icons";

// Componentes modulares
import {
  InformacionBasicaSection,
  UbicacionSection,
  ContactoSection,
  HorariosSection,
  RedesSocialesSection,
  MarketingSection,
  ImagenesSection,
  AuthModal,
  useNegocioForm,
} from "./components";
import BusinessDraftPreview from "./components/BusinessDraftPreview";

import "./styles/publicar-negocio.css";

const PublicarNegocio = () => {
  const [isDraftPreviewOpen, setIsDraftPreviewOpen] = useState(false);

  // Hook personalizado que maneja toda la lógica del formulario
  const {
    formData,
    errors,
    categories,
    subcategorias,
    loadingCategories,
    isSubmitting,
    previewImages,
    showAuthModal,
    isSavingDraft,
    handleChange,
    handleDiaChange,
    handleSaveHorarios,
    handleImageChange,
    removeImage,
    handleFieldFocus,
    handleSubmit,
    handleSaveDraft,
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
          subcategorias={subcategorias}
          loadingCategories={loadingCategories}
          onChange={handleChange}
          onFieldFocus={handleFieldFocus}
        />

        {/* Mensajes de Marketing */}
        <MarketingSection
          formData={formData}
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
          errors={errors}
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

        {/* Botones de acción */}
        <div className="publicar-negocio__actions">
          {/* Ver Borrador */}
          <button
            type="button"
            className="publicar-negocio__draft-btn"
            onClick={() => setIsDraftPreviewOpen(true)}>
            <FontAwesomeIcon icon={faEye} />
            Ver Borrador
          </button>

          {/* Guardar Borrador */}
          <button
            type="button"
            className="publicar-negocio__save-draft-btn"
            onClick={handleSaveDraft}
            disabled={isSavingDraft || isSubmitting}>
            {isSavingDraft ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin />
                Guardando...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSave} />
                Guardar Borrador
              </>
            )}
          </button>

          {/* Publicar */}
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
        </div>
      </form>

      {/* Vista previa del borrador */}
      <BusinessDraftPreview
        isOpen={isDraftPreviewOpen}
        onClose={() => setIsDraftPreviewOpen(false)}
        formData={formData}
        previewImages={previewImages}
        categories={categories}
      />

      {/* Modal de autenticación */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default PublicarNegocio;
