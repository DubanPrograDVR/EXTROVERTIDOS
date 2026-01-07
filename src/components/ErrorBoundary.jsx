import { Component } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faExclamationTriangle,
  faRedo,
} from "@fortawesome/free-solid-svg-icons";
import "./styles/error-boundary.css";

/**
 * Error Boundary para capturar errores de React y mostrar UI de fallback
 * Previene que toda la aplicación crashee por un error en un componente
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Actualizar estado para mostrar UI de fallback
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log del error para debugging
    console.error("ErrorBoundary capturó un error:", error, errorInfo);
    this.setState({ errorInfo });

    // Aquí podrías enviar el error a un servicio de monitoreo
    // Por ejemplo: Sentry, LogRocket, etc.
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      // UI de fallback personalizada
      return (
        <div className="error-boundary">
          <div className="error-boundary__content">
            <div className="error-boundary__icon">
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </div>

            <h1 className="error-boundary__title">¡Ups! Algo salió mal</h1>

            <p className="error-boundary__message">
              Ha ocurrido un error inesperado. Nuestro equipo ha sido
              notificado.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <details className="error-boundary__details">
                <summary>Detalles del error (solo desarrollo)</summary>
                <pre>{this.state.error.toString()}</pre>
                {this.state.errorInfo && (
                  <pre>{this.state.errorInfo.componentStack}</pre>
                )}
              </details>
            )}

            <div className="error-boundary__actions">
              <button
                className="error-boundary__btn error-boundary__btn--primary"
                onClick={this.handleReload}>
                <FontAwesomeIcon icon={faRedo} />
                Recargar página
              </button>

              <button
                className="error-boundary__btn error-boundary__btn--secondary"
                onClick={this.handleGoHome}>
                Ir al inicio
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
