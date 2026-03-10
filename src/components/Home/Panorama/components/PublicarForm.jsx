import { useState, useCallback, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faArrowLeft,
  faArrowRight,
  faCheck,
  faExclamationTriangle,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

import {
  WizardStepBasicInfo,
  WizardStepDateTime,
  WizardStepDetails,
  WizardStepMarketing,
  WizardStepImages,
} from "./wizard";
import DraftPreview from "./DraftPreview";
import "../styles/draft-preview.css";

const WIZARD_STEPS = [
  { id: 1, title: "Información", shortTitle: "Info" },
  { id: 2, title: "Fecha y Lugar", shortTitle: "Fecha" },
  { id: 3, title: "Detalles", shortTitle: "Detalles" },
  { id: 4, title: "Marketing", shortTitle: "Marketing" },
  { id: 5, title: "Imágenes", shortTitle: "Imágenes" },
];

/**
 * Formulario principal de publicación de eventos - Modo Wizard
 */
const PublicarForm = ({
  formData,
  categories,
  loadingCategories,
  errors,
  isSubmitting,
  previewImages,
  isEditing,
  isSavingDraft,
  onSubmit,
  onChange,
  onFieldFocus,
  onImageChange,
  onRemoveImage,
  onSaveDraft,
  enabledCalendarModes,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isDraftPreviewOpen, setIsDraftPreviewOpen] = useState(false);
  const [stepError, setStepError] = useState("");
  const [errorKey, setErrorKey] = useState(0);

  // Campos obligatorios por paso
  const validateCurrentStep = useCallback(() => {
    switch (currentStep) {
      case 1:
        return formData.titulo?.trim().length >= 3 && !!formData.category_id;
      case 2: {
        const base =
          !!formData.fecha_evento &&
          !!formData.provincia &&
          formData.comuna?.trim() &&
          formData.direccion?.trim();
        if (!base) return false;
        if (formData.es_multidia && !formData.fecha_fin) return false;
        if (formData.es_recurrente) {
          if (!formData.fecha_evento_recurrente) return false;
          const rep = Number(formData.cantidad_repeticiones);
          if (!rep || rep < 2 || rep > 12) return false;
        }
        return true;
      }
      case 3: {
        if (formData.tipo_entrada === "pagado") {
          const precio = Number(formData.precio);
          if (!precio || precio <= 0) return false;
        }
        if (
          formData.tipo_entrada === "venta_externa" &&
          !formData.url_venta?.trim()
        )
          return false;
        return true;
      }
      case 4:
        return formData.etiqueta_directa?.trim().length >= 2;
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
          <WizardStepBasicInfo
            formData={formData}
            categories={categories}
            loadingCategories={loadingCategories}
            errors={errors}
            onChange={onChange}
          />
        );
      case 2:
        return (
          <WizardStepDateTime
            formData={formData}
            errors={errors}
            onChange={onChange}
            enabledCalendarModes={enabledCalendarModes}
          />
        );
      case 3:
        return (
          <WizardStepDetails
            formData={formData}
            errors={errors}
            onChange={onChange}
          />
        );
      case 4:
        return (
          <WizardStepMarketing
            formData={formData}
            errors={errors}
            onChange={onChange}
          />
        );
      case 5:
        return (
          <WizardStepImages
            previewImages={previewImages}
            errors={errors}
            isSubmitting={isSubmitting}
            isEditing={isEditing}
            isSavingDraft={isSavingDraft}
            onImageChange={onImageChange}
            onRemoveImage={onRemoveImage}
            onSaveDraft={onSaveDraft}
          />
        );
      default:
        return null;
    }
  };

  return (
    <section className="publicar-form-section">
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

      <form
        className="publicar-form"
        onSubmit={onSubmit}
        onFocus={onFieldFocus}>
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
      <DraftPreview
        isOpen={isDraftPreviewOpen}
        onClose={() => setIsDraftPreviewOpen(false)}
        formData={formData}
        previewImages={previewImages}
        categories={categories}
      />
    </section>
  );
};

export default PublicarForm;
