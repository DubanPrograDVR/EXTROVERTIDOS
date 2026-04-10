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
  const [missingFields, setMissingFields] = useState([]);
  const [errorKey, setErrorKey] = useState(0);

  // Detectar campos obligatorios faltantes por paso
  const getMissingFields = useCallback(() => {
    const missing = [];
    switch (currentStep) {
      case 1:
        if (!formData.titulo?.trim() || formData.titulo.trim().length < 3)
          missing.push({ field: "titulo", label: "Título" });
        if (!formData.category_id)
          missing.push({ field: "category_id", label: "Categoría" });
        break;
      case 2:
        if (!formData.fecha_evento)
          missing.push({ field: "fecha_evento", label: "Fecha del evento" });
        if (!formData.provincia)
          missing.push({ field: "provincia", label: "Provincia" });
        if (!formData.comuna?.trim())
          missing.push({ field: "comuna", label: "Comuna" });
        if (!formData.direccion?.trim())
          missing.push({ field: "direccion", label: "Dirección" });
        if (formData.es_multidia && !formData.fecha_fin)
          missing.push({ field: "fecha_fin", label: "Fecha de término" });
        if (formData.es_recurrente) {
          if (!formData.fecha_evento_recurrente)
            missing.push({
              field: "fecha_evento_recurrente",
              label: "Fecha recurrente",
            });
          const rep = Number(formData.cantidad_repeticiones);
          if (!rep || rep < 2 || rep > 12)
            missing.push({
              field: "cantidad_repeticiones",
              label: "Cantidad de repeticiones",
            });
        }
        break;
      case 3:
        if (formData.tipo_entrada === "pagado") {
          const precio = Number(formData.precio);
          if (!precio || precio <= 0)
            missing.push({ field: "precio", label: "Precio" });
        }
        if (
          formData.tipo_entrada === "venta_externa" &&
          !formData.url_venta?.trim()
        )
          missing.push({ field: "url_venta", label: "URL de venta" });
        break;
      case 4:
        if (
          !formData.etiqueta_directa?.trim() ||
          formData.etiqueta_directa.trim().length < 2
        )
          missing.push({
            field: "etiqueta_directa",
            label: "Etiqueta directa",
          });
        break;
      default:
        break;
    }
    return missing;
  }, [currentStep, formData]);

  const validateCurrentStep = useCallback(() => {
    return getMissingFields().length === 0;
  }, [getMissingFields]);

  useEffect(() => {
    if (!stepError) return undefined;

    const timeoutId = window.setTimeout(() => {
      setStepError("");
      setMissingFields([]);
    }, 8000);

    return () => window.clearTimeout(timeoutId);
  }, [errorKey]);

  const goToStep = useCallback((step) => {
    setStepError("");
    setMissingFields([]);
    setCurrentStep(step);
    window.scrollTo({ top: 300, behavior: "smooth" });
  }, []);

  const scrollToField = useCallback((fieldName) => {
    const el =
      document.getElementById(fieldName) ||
      document.querySelector(`[name="${fieldName}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus({ preventScroll: true });
    }
  }, []);

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
