import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRobot, faCheck, faExclamationTriangle, faArrowRight, faSpinner, faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import { supabase } from "../../../lib/supabase";
import "../styles/admin.css";

export default function AdminImportIA() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const validateUrl = (testUrl) => {
    if (!testUrl) return "La URL no puede estar vacía.";
    if (!testUrl.includes("instagram.com")) return "La URL ingresada no corresponde a una publicación válida de Instagram.";
    return null;
  };

  const handleAnalyze = async () => {
    setError(null);
    setResult(null);
    
    const validationError = validateUrl(url);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      if (!token) throw new Error("No hay sesión activa.");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-instagram`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ url })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || "Error al analizar la publicación.");
      }

      setResult(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (result) {
      // Redirigir al formulario prellenando datos vía location state
      navigate("/publicar-panorama", { state: { iaData: result } });
    }
  };

  const renderConfidence = (score) => {
    let color = "red";
    let text = "Baja confianza";
    if (score >= 80) { color = "green"; text = "Alta confianza"; }
    else if (score >= 60) { color = "goldenrod"; text = "Requiere revisión"; }

    return (
      <div style={{ margin: "15px 0" }}>
        <strong>Relevancia del panorama:</strong>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "5px" }}>
          <div style={{ width: "200px", height: "10px", background: "#333", borderRadius: "5px", overflow: "hidden" }}>
            <div style={{ width: `${score}%`, height: "100%", background: color }}></div>
          </div>
          <span>{score}% ({text})</span>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>
          <FontAwesomeIcon icon={faRobot} className="admin-header__icon" />
          Importar panorama con IA
        </h1>
        <p className="admin-header__subtitle">
          Pega el enlace de una publicación pública de Instagram y la IA intentará convertirla automáticamente en un panorama.
        </p>
      </div>

      <div className="admin-card" style={{ maxWidth: "600px" }}>
        <div className="admin-card__content">
          <label style={{ display: "block", marginBottom: "10px", fontWeight: "bold" }}>
            URL de Instagram
          </label>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.instagram.com/p/XXXXXXXX/"
              style={{ flex: 1, padding: "10px", borderRadius: "5px", border: "1px solid #444", background: "#222", color: "white" }}
              disabled={loading}
            />
            <button 
              className="admin-btn admin-btn--primary"
              onClick={handleAnalyze}
              disabled={loading || !url}
            >
              {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : "Analizar publicación"}
            </button>
          </div>

          {error && (
            <div style={{ marginTop: "15px", padding: "10px", background: "rgba(255, 0, 0, 0.1)", borderLeft: "4px solid red", color: "#ff6b6b" }}>
              <FontAwesomeIcon icon={faTimesCircle} style={{ marginRight: "10px" }} />
              {error}
            </div>
          )}

          {loading && (
            <div style={{ marginTop: "20px" }}>
              <p>?? Analizando panorama...</p>
              <ul style={{ listStyle: "none", padding: 0, color: "#aaa" }}>
                <li>? Analizando contenido</li>
                <li>? Detectando ubicación</li>
                <li>? Identificando fecha</li>
                <li>? Generando información</li>
              </ul>
            </div>
          )}

          {result && (
            <div style={{ marginTop: "30px", borderTop: "1px solid #444", paddingTop: "20px" }}>
              {!result.es_panorama ? (
                <div style={{ padding: "15px", background: "rgba(255, 0, 0, 0.1)", borderLeft: "4px solid red", color: "#ff6b6b" }}>
                  <p><strong>? Este contenido no es un panorama válido</strong></p>
                  <p>{result.motivo_rechazo}</p>
                </div>
              ) : (
                <>
                  <h3 style={{ marginBottom: "15px" }}>Resultado del Análisis</h3>
                  <div style={{ background: "#222", padding: "15px", borderRadius: "5px" }}>
                    <p><strong>Título:</strong> {result.titulo || "-"}</p>
                    <p><strong>Fecha:</strong> {result.fecha || "-"}</p>
                    <p><strong>Ubicación:</strong> {result.ubicacion || "-"} ({result.comuna || "-"})</p>
                    
                    {renderConfidence(result.confianza)}
                    
                    {result.informacion_faltante && result.informacion_faltante.length > 0 && (
                      <div style={{ marginTop: "15px", padding: "10px", background: "rgba(255, 165, 0, 0.1)", borderLeft: "4px solid goldenrod", color: "goldenrod" }}>
                        <strong>?? Información faltante:</strong>
                        <ul style={{ marginTop: "5px", marginLeft: "20px" }}>
                          {result.informacion_faltante.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
                    <button className="admin-btn admin-btn--primary" onClick={handleContinue}>
                      Continuar y Revisar <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: "10px" }} />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
