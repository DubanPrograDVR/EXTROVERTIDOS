import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

/**
 * Componente para probar la conexión a Supabase
 * Muestra el estado de conexión y permite hacer pruebas básicas
 */
export default function SupabaseTest() {
  const [status, setStatus] = useState("Verificando conexión...");
  const [error, setError] = useState(null);
  const [details, setDetails] = useState(null);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setStatus("Conectando a Supabase...");
      setError(null);

      // Test 1: Verificar que las variables de entorno existen
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!url || !key) {
        throw new Error(
          "Faltan variables de entorno. Revisa tu archivo .env:\n" +
          "VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY"
        );
      }

      // Test 2: Intentar una consulta simple (health check)
      const { data, error: dbError } = await supabase
        .from("categories")
        .select("count")
        .limit(1);

      if (dbError) {
        // Si la tabla no existe, igual la conexión funciona
        if (dbError.code === "42P01") {
          setStatus("✅ Conexión exitosa!");
          setDetails({
            url: url.substring(0, 30) + "...",
            mensaje: "Conectado, pero la tabla 'categories' no existe. Ejecuta el schema.sql en Supabase.",
          });
          return;
        }
        throw dbError;
      }

      setStatus("✅ Conexión exitosa!");
      setDetails({
        url: url.substring(0, 30) + "...",
        mensaje: "Todo funcionando correctamente",
        tablaCategories: "Existe ✓",
      });

    } catch (err) {
      setStatus("❌ Error de conexión");
      setError(err.message);
      console.error("Error Supabase:", err);
    }
  };

  const styles = {
    container: {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      background: "#1a1a1a",
      border: "1px solid #ff6600",
      borderRadius: "12px",
      padding: "20px",
      maxWidth: "350px",
      zIndex: 9999,
      fontFamily: "monospace",
      fontSize: "13px",
    },
    title: {
      color: "#ff6600",
      margin: "0 0 15px 0",
      fontSize: "16px",
    },
    status: {
      color: status.includes("✅") ? "#4CAF50" : status.includes("❌") ? "#f44336" : "#fff",
      marginBottom: "10px",
    },
    error: {
      color: "#f44336",
      background: "rgba(244, 67, 54, 0.1)",
      padding: "10px",
      borderRadius: "6px",
      whiteSpace: "pre-wrap",
    },
    details: {
      color: "#888",
      fontSize: "11px",
    },
    button: {
      background: "#ff6600",
      color: "#fff",
      border: "none",
      padding: "8px 16px",
      borderRadius: "6px",
      cursor: "pointer",
      marginTop: "10px",
    },
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>🔌 Test Supabase</h3>
      
      <p style={styles.status}>{status}</p>
      
      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}
      
      {details && (
        <div style={styles.details}>
          <p><strong>URL:</strong> {details.url}</p>
          <p><strong>Estado:</strong> {details.mensaje}</p>
          {details.tablaCategories && (
            <p><strong>Tabla categories:</strong> {details.tablaCategories}</p>
          )}
        </div>
      )}
      
      <button style={styles.button} onClick={testConnection}>
        Probar de nuevo
      </button>
    </div>
  );
}
