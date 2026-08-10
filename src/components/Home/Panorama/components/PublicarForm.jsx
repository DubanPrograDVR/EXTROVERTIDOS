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
import FormResetButton from "../../../UI/FormResetButton";
import { getStepMissingFields } from "../hooks/useFormValidation";
import "../styles/draft-preview.css";

const WIZARD_STEPS = [
  { id: 1, title: "Información", shortTitle: "Info" },
  { id: 2, title: "Fecha y Lugar", shortTitle: "Fecha" },
  { id: 3, title: "Redes y Contacto", shortTitle: "Redes" },
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
  isDirty = false,
  onReset,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isDraftPreviewOpen, setIsDraftPreviewOpen] = useState(false);
  const [stepError, setStepError] = useState("");
  const [missingFields, setMissingFields] = useState([]);
  const [errorKey, setErrorKey] = useState(0);
  const [passedSteps, setPassedSteps] = useState(() => new Set());

  // Campos obligatorios faltantes del paso actual.
  // Las reglas viven en EVENT_VALIDATION_SCHEMA (única fuente de verdad,
  // compartida con la validación de submit); aquí solo se consultan.
  const getMissingFields = useCallback(
    () => getStepMissingFields(currentStep, formData),
    [currentStep, formData],
  );

  // Un paso es válido cuando no le falta ningún campo obligatorio
  const isStepValid = useCallback(
    (stepId) => getStepMissingFields(stepId, formData).length === 0,
    [formData],
  );

  useEffect(() => {
    if (!stepError) return undefined;

    const timeoutId = window.setTimeout(() => {
      setStepError("");
      setMissingFields([]);
    }, 8000);

    return () => window.clearTimeout(timeoutId);
  }, [errorKey, stepError]);

  const goToStep = useCallback(
    (step) => {
      setStepError("");
      setMissingFields([]);

      if (step !== currentStep) {
        setPassedSteps((prev) => new Set(prev).add(currentStep));
      }

      setCurrentStep(step);
      window.scrollTo({ top: 300, behavior: "smooth" });
    },
    [currentStep],
  );

  const scrollToField = useCallback((fieldName) => {
    const el =
      document.getElementById(fieldName) ||
      document.querySelector(`[name="${fieldName}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus({ preventScroll: true });
    }
  }, []);

  // Todos los pasos con campos obligatorios están completos
  const areAllRequiredComplete =
    isStepValid(1) && isStepValid(2) && isStepValid(3) && isStepValid(4);

  const goNext = useCallback(() => {
    if (currentStep < WIZARD_STEPS.length) {
      const missing = getMissingFields();
      if (missing.length > 0) {
        setMissingFields(missing);
        setStepError("Campos obligatorios faltantes:");
        setErrorKey((k) => k + 1);
        return;
      }
      setStepError("");
      setMissingFields([]);
      goToStep(currentStep + 1);
    }
  }, [currentStep, goToStep, getMissingFields]);

  const goPrev = useCallback(() => {
    if (currentStep > 1) {
      setStepError("");
      goToStep(currentStep - 1);
    }
  }, [currentStep, goToStep]);

  const isStepCompleted = useCallback(
    (stepId) =>
      stepId < currentStep && (stepId !== 3 || passedSteps.has(stepId)),
    [currentStep, passedSteps],
  );

  const shouldMarkStepValid = useCallback(
    (stepId) => {
      if (!isStepValid(stepId)) return false;
      if (stepId === 3)
        return passedSteps.has(stepId) && stepId !== currentStep;
      return true;
    },
    [currentStep, isStepValid, passedSteps],
  );

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
        {WIZARD_STEPS.map((step) => {
          const stepCompleted = isStepCompleted(step.id);
          const stepValid = shouldMarkStepValid(step.id);

          return (
            <button
              key={step.id}
              type="button"
              className={`wizard-stepper__step ${
                step.id === currentStep ? "wizard-stepper__step--active" : ""
              } ${stepCompleted ? "wizard-stepper__step--completed" : ""} ${
                stepValid ? "wizard-stepper__step--valid" : ""
              }`}
              onClick={() => goToStep(step.id)}>
              <span className="wizard-stepper__number">
                {stepCompleted ? <FontAwesomeIcon icon={faCheck} /> : step.id}
              </span>
              <span className="wizard-stepper__title">{step.title}</span>
              <span className="wizard-stepper__short-title">
                {step.shortTitle}
              </span>
            </button>
          );
        })}
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
        <div className="wizard-step-container">
          {/* Reset discreto en esquina superior derecha: solo paso 1 */}
          {onReset && currentStep === 1 && (
            <div className="publicar-form__reset-corner">
              <FormResetButton
                isDirty={isDirty}
                onReset={onReset}
                label="Limpiar todo"
                confirmTitle="¿Limpiar todo el formulario?"
                confirmMessage="Se borrará toda la información ingresada en el panorama (textos, fechas, ubicación, imágenes, etc.). Esta acción no se puede deshacer."
              />
            </div>
          )}
          {renderStep()}
        </div>

        {/* Mensaje de validación */}
        {stepError && (
          <div className="wizard-step-error">
            <div className="wizard-step-error__content">
              <FontAwesomeIcon icon={faExclamationTriangle} />
              <span>{stepError}</span>
              {missingFields.length > 0 && (
                <div className="wizard-step-error__fields">
                  {missingFields.map((f) => (
                    <button
                      key={f.field}
                      type="button"
                      className="wizard-step-error__field-btn"
                      onClick={() => scrollToField(f.field)}>
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              className="wizard-step-error__close"
              onClick={() => {
                setStepError("");
                setMissingFields([]);
              }}
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
            className={`wizard-nav__btn wizard-nav__btn--draft${
              areAllRequiredComplete ? " wizard-nav__btn--draft--ready" : ""
            }`}
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
