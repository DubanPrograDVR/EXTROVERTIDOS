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
          const recurringDatesCount = Array.isArray(formData.fechas_recurrencia)
            ? formData.fechas_recurrencia.length
            : 0;

          if (recurringDatesCount === 0)
            missing.push({
              field: "fecha_evento",
              label: "Fechas específicas",
            });

          if (recurringDatesCount > 0 && recurringDatesCount < 2)
            missing.push({
              field: "fecha_evento",
              label: "Selecciona al menos 2 fechas",
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

  // Determina si un paso tiene todos sus campos obligatorios completos
  const isStepValid = useCallback(
    (stepId) => {
      switch (stepId) {
        case 1:
          return (
            !!formData.titulo?.trim() &&
            formData.titulo.trim().length >= 3 &&
            !!formData.category_id
          );
        case 2: {
          const recurringDatesCount = Array.isArray(formData.fechas_recurrencia)
            ? formData.fechas_recurrencia.length
            : 0;

          return (
            !!formData.fecha_evento &&
            !!formData.provincia &&
            !!formData.comuna?.trim() &&
            !!formData.direccion?.trim() &&
            (!formData.es_multidia || !!formData.fecha_fin) &&
            (!formData.es_recurrente ||
              (recurringDatesCount >= 2 && recurringDatesCount <= 12))
          );
        }
        case 3: {
          // Validación por tipo de entrada
          return (
            !(
              formData.tipo_entrada === "pagado" &&
              !(Number(formData.precio) > 0)
            ) &&
            !(
              formData.tipo_entrada === "venta_externa" &&
              !formData.url_venta?.trim()
            )
          );
        }
        case 4:
          return (
            !!formData.etiqueta_directa?.trim() &&
            formData.etiqueta_directa.trim().length >= 2
          );
        case 5:
          return (
            Array.isArray(formData.imagenes) && formData.imagenes.length > 0
          );
        default:
          return false;
      }
    },
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
            } ${step.id < currentStep ? "wizard-stepper__step--completed" : ""} ${
              isStepValid(step.id) ? "wizard-stepper__step--valid" : ""
            }`}
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
