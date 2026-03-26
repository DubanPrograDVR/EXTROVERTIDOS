import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faEye,
  faSave,
  faTimes,
  faStore,
  faArrowLeft,
  faArrowRight,
  faCheck,
  faExclamationTriangle,
  faXmark,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../../context/AuthContext";

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
import "../Panorama/components/styles/plan-block-modal.css";

const WIZARD_STEPS = [
  { id: 1, title: "Información", shortTitle: "Info" },
  { id: 2, title: "Marketing", shortTitle: "Marketing" },
  { id: 3, title: "Ubicación", shortTitle: "Ubicación" },
  { id: 4, title: "Horarios", shortTitle: "Horarios" },
  { id: 5, title: "Imágenes", shortTitle: "Imágenes" },
];

const PublicarNegocio = () => {
  const { isAdmin, isModerator } = useAuth();
  const navigate = useNavigate();
  const [isDraftPreviewOpen, setIsDraftPreviewOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [stepError, setStepError] = useState("");
  const [errorKey, setErrorKey] = useState(0);

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
    // Plan
    superguiaSubscription,
    planesEnabled,
    loadingPlan,
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

  // Detectar si el usuario necesita plan superguía
  const needsSuperguiaPlan = useMemo(() => {
    if (isAdmin || isModerator) return false;
    if (!planesEnabled) return false;
    if (!superguiaSubscription) return true;
    // Verificar si está vencida
    if (superguiaSubscription.fecha_fin) {
      const endDate = new Date(superguiaSubscription.fecha_fin);
      if (endDate <= new Date()) return true;
    }
    return false;
  }, [isAdmin, isModerator, planesEnabled, superguiaSubscription]);

  // Campos obligatorios por paso
  const validateCurrentStep = useCallback(() => {
    switch (currentStep) {
      case 1:
        return (
          formData.nombre.trim() &&
          formData.descripcion.trim() &&
          formData.category_id &&
          formData.subcategoria
        );
      case 2:
        return true; // Marketing es opcional
      case 3:
        return (
          formData.provincia &&
          formData.comuna.trim() &&
          formData.direccion.trim() &&
          formData.telefono.trim()
        );
      case 4:
        return formData.dias_atencion.length > 0;
      case 5:
        return true; // Se valida al publicar
      default:
        return true;
    }
  }, [currentStep, formData]);

  useEffect(() => {
    if (!stepError) return undefined;

    const timeoutId = window.setTimeout(() => {
      setStepError("");
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [errorKey]);

  const goToStep = useCallback((step) => {
    setStepError("");
    setCurrentStep(step);
    window.scrollTo({ top: 300, behavior: "smooth" });
  }, []);

  const goNext = useCallback(() => {
    if (currentStep < WIZARD_STEPS.length) {
      if (!validateCurrentStep()) {
        setStepError(
          "Debes completar todos los campos obligatorios para seguir avanzando",
        );
        setErrorKey((k) => k + 1);
        return;
      }
      setStepError("");
      goToStep(currentStep + 1);
    }
  }, [currentStep, goToStep, validateCurrentStep]);

  const goPrev = useCallback(() => {
    if (currentStep > 1) {
      setStepError("");
      goToStep(currentStep - 1);
    }
  }, [currentStep, goToStep]);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <InformacionBasicaSection
            formData={formData}
            errors={errors}
            categories={categories}
            subcategorias={subcategorias}
            loadingCategories={loadingCategories}
            onChange={handleChange}
            onFieldFocus={handleFieldFocus}
          />
        );
      case 2:
        return (
          <MarketingSection
            formData={formData}
            onChange={handleChange}
            onFieldFocus={handleFieldFocus}
          />
        );
      case 3:
        return (
          <>
            <UbicacionSection
              formData={formData}
              errors={errors}
              onChange={handleChange}
              onFieldFocus={handleFieldFocus}
            />
            <ContactoSection
              formData={formData}
              errors={errors}
              onChange={handleChange}
              onFieldFocus={handleFieldFocus}
            />
          </>
        );
      case 4:
        return (
          <>
            <HorariosSection
              formData={formData}
              errors={errors}
              onDiaChange={handleDiaChange}
              onSaveHorarios={handleSaveHorarios}
              onFieldFocus={handleFieldFocus}
            />
            <RedesSocialesSection
              formData={formData}
              onChange={handleChange}
              onFieldFocus={handleFieldFocus}
            />
          </>
        );
      case 5:
        return (
          <>
            <ImagenesSection
              previewImages={previewImages}
              errors={errors}
              onImageChange={handleImageChange}
              onRemoveImage={removeImage}
              onFieldFocus={handleFieldFocus}
            />

            {/* Botones de acción */}
            <div className="publicar-negocio__actions">
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
          </>
        );
      default:
        return null;
    }
  };

  // Mostrar carga mientras se obtienen datos del plan
  if (loadingPlan) {
    return (
      <div className="publicar-negocio">
        <header className="publicar-negocio__header">
          <h1 className="publicar-negocio__title">Publicar Negocio</h1>
        </header>
        <div className="publicar-negocio__loading">
          <FontAwesomeIcon icon={faSpinner} spin size="2x" />
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  // Modal si no tiene plan superguía
  if (needsSuperguiaPlan) {
    return (
      <div className="publicar-negocio">
        <header className="publicar-negocio__header">
          <h1 className="publicar-negocio__title">Publicar Negocio</h1>
          <p className="publicar-negocio__subtitle">
            Registra tu negocio y llega a más clientes en la región del Maule
          </p>
        </header>
        <div
          className="plan-block-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Necesitas un plan">
          <div className="plan-block-modal">
            <button
              className="plan-block-modal__close"
              onClick={() => navigate(-1)}
              aria-label="Volver atrás">
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <div
              className="plan-block-modal__icon"
              style={{ color: "#ff6600" }}>
              <FontAwesomeIcon icon={faStore} />
            </div>
            <h2 className="plan-block-modal__title">
              Debes activar tu plan para publicar un negocio
            </h2>
            <div className="plan-block-modal__message">
              <p>
                Para publicar tu negocio en nuestra Superguía necesitas tener un
                plan activo. ¡Activa tu plan y llega a más clientes!
              </p>
            </div>
            <div className="plan-block-modal__actions">
              <button
                className="plan-block-modal__btn plan-block-modal__btn--primary"
                onClick={() => navigate("/activar-plan")}>
                Ver planes
              </button>
              <button
                className="plan-block-modal__btn plan-block-modal__btn--secondary"
                onClick={() => navigate(-1)}>
                Volver atrás
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="publicar-negocio">
      {/* Header */}
      <header className="publicar-negocio__header">
        <img
          src="/img/Logo_con_r.png"
          alt="Extrovertidos"
          className="publicar-negocio__logo"
        />
        <h1 className="publicar-negocio__title">Publicar Negocio</h1>
        <p className="publicar-negocio__subtitle">
          Registra tu negocio y llega a más clientes en la región del Maule
        </p>
      </header>

      {/* Info: ¿Cómo funciona? */}
      <section className="publicar-negocio__info">
        <div className="publicar-negocio__info-container">
          <h2 className="publicar-negocio__info-title">
            <FontAwesomeIcon icon={faInfoCircle} />
            ¿Cómo funciona?
          </h2>
          <div className="publicar-negocio__info-steps">
            {[
              "Completa el formulario con los datos de tu negocio",
              "Sube imágenes atractivas que representen tu negocio",
              "Nuestro equipo revisará tu publicación",
              "¡Tu negocio estará visible para toda la comunidad!",
            ].map((step, index) => (
              <div key={index} className="publicar-negocio__info-step">
                <span className="publicar-negocio__info-step-number">
                  {index + 1}
                </span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stepper / Progress Bar */}
      <div className="wizard-stepper">
        {WIZARD_STEPS.map((step) => (
          <button
            key={step.id}
            type="button"
            className={`wizard-stepper__step ${
              step.id === currentStep ? "wizard-stepper__step--active" : ""
            } ${step.id < currentStep ? "wizard-stepper__step--completed" : ""}`}
            onClick={() => goToStep(step.id)}>
            <span className="wizard-stepper__number">
              {step.id < currentStep ? (
                <FontAwesomeIcon icon={faCheck} />
              ) : (
                step.id
              )}
            </span>
            <span className="wizard-stepper__title">{step.title}</span>
            <span className="wizard-stepper__short-title">
              {step.shortTitle}
            </span>
          </button>
        ))}
        <div
          className="wizard-stepper__progress"
          style={{
            width: `${((currentStep - 1) / (WIZARD_STEPS.length - 1)) * 100}%`,
          }}
        />
      </div>

      {/* Formulario */}
      <form className="publicar-negocio__form" onSubmit={handleSubmit}>
        {/* Contenido del paso actual */}
        <div className="wizard-step-container">{renderStep()}</div>

        {/* Mensaje de validación */}
        {stepError && (
          <div className="wizard-step-error">
            <div className="wizard-step-error__content">
              <FontAwesomeIcon icon={faExclamationTriangle} />
              <span>{stepError}</span>
            </div>
            <button
              type="button"
              className="wizard-step-error__close"
              onClick={() => setStepError("")}
              aria-label="Cerrar alerta">
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        )}

        {/* Navegación del Wizard */}
        <div className="wizard-nav">
          <button
            type="button"
            className="wizard-nav__btn wizard-nav__btn--prev"
            onClick={goPrev}
            disabled={currentStep === 1}>
            <FontAwesomeIcon icon={faArrowLeft} />
            Anterior
          </button>

          <button
            type="button"
            className="wizard-nav__btn wizard-nav__btn--draft"
            onClick={() => setIsDraftPreviewOpen(true)}>
            <FontAwesomeIcon icon={faEye} />
            Ver Borrador
          </button>

          {currentStep < WIZARD_STEPS.length && (
            <button
              type="button"
              className="wizard-nav__btn wizard-nav__btn--next"
              onClick={goNext}>
              Siguiente
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          )}
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
