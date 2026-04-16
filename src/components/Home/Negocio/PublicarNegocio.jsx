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
import { canUserPublishBusiness } from "../../../lib/planRules";
import LoginAuthModal from "../../Auth/AuthModal";

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
  const { isAdmin, isModerator, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isDraftPreviewOpen, setIsDraftPreviewOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [stepError, setStepError] = useState("");
  const [missingFields, setMissingFields] = useState([]);
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
  const businessPublishCheck = useMemo(() => {
    return canUserPublishBusiness({
      subscription: superguiaSubscription,
      planesEnabled,
      isAdmin,
      isModerator,
    });
  }, [isAdmin, isModerator, planesEnabled, superguiaSubscription]);

  const needsSuperguiaPlan = !businessPublishCheck.canPublish;

  // Detectar campos obligatorios faltantes por paso
  const getMissingFields = useCallback(() => {
    const missing = [];
    switch (currentStep) {
      case 1:
        if (!formData.nombre.trim())
          missing.push({ field: "nombre", label: "Nombre" });
        if (!formData.descripcion.trim())
          missing.push({ field: "descripcion", label: "Descripción" });
        if (!formData.category_id)
          missing.push({ field: "category_id", label: "Categoría" });
        if (!formData.subcategoria)
          missing.push({ field: "subcategoria", label: "Subcategoría" });
        break;
      case 2:
        break; // Marketing es opcional
      case 3:
        if (!formData.provincia)
          missing.push({ field: "provincia", label: "Provincia" });
        if (!formData.comuna.trim())
          missing.push({ field: "comuna", label: "Comuna" });
        if (!formData.direccion.trim())
          missing.push({ field: "direccion", label: "Dirección" });
        break;
      case 4:
        break; // Horario es opcional
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

  // Si no está autenticado y planes están habilitados, mostrar login
  if (!isAuthenticated && planesEnabled) {
    return (
      <div className="publicar-negocio">
        <header className="publicar-negocio__header">
          <h1 className="publicar-negocio__title">Publicar Negocio</h1>
        </header>
        <LoginAuthModal
          isOpen={true}
          onClose={() => navigate("/")}
          persistent
        />
      </div>
    );
  }

  // Modal si no tiene plan superguía
  if (needsSuperguiaPlan) {
    const reason = businessPublishCheck.reason;
    const fechaFin = businessPublishCheck.fechaFin;
    const fechaFormateada = fechaFin
      ? new Date(fechaFin).toLocaleDateString("es-CL", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : null;

    const scenarioConfig = {
      no_plan: {
        title: "¡Estás a un paso de publicar tu negocio!",
        message: "Adquiere una nueva suscripción a Superguía para publicar",
        btnLabel: "Ver planes",
      },
      plan_expired: {
        title: "¡Renueva tu plan ahora!",
        message: `Tu plan venció el ${fechaFormateada}.\nTe invitamos a seguir publicando tu negocio en Extrovertidos.`,
        btnLabel: "Renovar plan",
      },
      quota_exceeded: {
        title: "Has usado tu cupo de publicación",
        message: `Utilizaste ${businessPublishCheck.cuposUsados} de ${businessPublishCheck.cuposTotal} publicaciones.\nAdquiere una nueva suscripción a Superguía para publicar otro negocio.`,
        btnLabel: "Volver a suscribirme",
      },
      window_expired: {
        title: "Tu plazo de publicación ha vencido",
        message:
          "El período para crear tu publicación de negocio expiró.\nAdquiere una nueva suscripción para publicar.",
        btnLabel: "Ver planes",
      },
    };

    const config = scenarioConfig[reason] || scenarioConfig.no_plan;

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
            <div className="plan-block-modal__icon">
              <img
                src="/img/SG_Extro.png"
                alt="Superguía"
                style={{
                  width: "160px",
                  height: "auto",
                  filter:
                    "drop-shadow(0 0 20px rgba(255, 102, 0, 0.8)) drop-shadow(0 0 40px rgba(255, 102, 0, 0.4))",
                }}
              />
            </div>
            <h2 className="plan-block-modal__title">{config.title}</h2>
            <div className="plan-block-modal__message">
              {config.message.split("\n").map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
            <div className="plan-block-modal__actions">
              <button
                className="plan-block-modal__btn plan-block-modal__btn--primary"
                onClick={() => navigate("/activar-plan")}>
                {config.btnLabel}
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
      {/* Alerta de vencimiento próximo */}
      {businessPublishCheck.warning && (
        <div className="publicar-negocio__warning-banner">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <span>{businessPublishCheck.warning}</span>
        </div>
      )}

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
