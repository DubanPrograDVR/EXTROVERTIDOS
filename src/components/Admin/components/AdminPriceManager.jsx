import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getPlanPrices, updatePlanPrices } from "../../../lib/database";
import "../styles/admin-pricing.css";

const PLAN_LABELS = [
  { key: "panorama_unica", label: "Publicacion Unica" },
  { key: "panorama_pack4", label: "Pack 4 Publicaciones" },
  { key: "panorama_ilimitado", label: "Publica Sin Limite" },
  { key: "superguia", label: "Superguia Extrovertidos" },
];

const formatCLP = (amount) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(amount);

export default function AdminPriceManager() {
  const { user } = useAuth();
  const [prices, setPrices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    const loadPrices = async () => {
      try {
        const data = await getPlanPrices();
        setPrices(data);
      } catch (err) {
        console.error("Error cargando precios:", err);
        setError("No se pudieron cargar los precios.");
      } finally {
        setLoading(false);
      }
    };

    loadPrices();
  }, []);

  const parsedPrices = useMemo(() => {
    if (!prices) return {};
    return PLAN_LABELS.reduce((acc, plan) => {
      const raw = prices[plan.key];
      acc[plan.key] = Number.isFinite(Number(raw)) ? Number(raw) : 0;
      return acc;
    }, {});
  }, [prices]);

  const handleChange = (key, value) => {
    setSavedMessage("");
    setError(null);
    setPrices((prev) => ({
      ...(prev || {}),
      [key]: value === "" ? "" : Number(value),
    }));
  };

  const handleSave = async () => {
    if (!user?.id || saving) return;

    const invalid = PLAN_LABELS.find((plan) => {
      const value = Number(parsedPrices[plan.key]);
      return !Number.isFinite(value) || value <= 0;
    });

    if (invalid) {
      setError("Todos los precios deben ser numeros mayores a 0.");
      return;
    }

    setSaving(true);
    setError(null);
    setSavedMessage("");

    try {
      await updatePlanPrices(parsedPrices, user.id);
      // Recargar precios desde DB para verificar que se guardaron
      const reloadedPrices = await getPlanPrices();
      setPrices(reloadedPrices);
      setSavedMessage(
        "✓ Precios actualizados correctamente. Se aplicarán inmediatamente.",
      );
      // Limpiar mensaje después de 4 segundos
      setTimeout(() => setSavedMessage(""), 4000);
    } catch (err) {
      console.error("[AdminPriceManager] Error guardando precios:", err);
      let errorMsg = "No se pudo guardar la configuracion.";
      if (
        err?.message?.includes("permission") ||
        err?.message?.includes("denied")
      ) {
        errorMsg =
          "Permiso denegado. Verifica que tengas rol de administrador.";
      } else if (err?.message?.includes("not")) {
        errorMsg = "Hubo un problema al guardar. Intenta de nuevo.";
      }
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-pricing">
        <div className="admin-pricing__loading">Cargando precios...</div>
      </div>
    );
  }

  return (
    <div className="admin-pricing">
      <div className="admin-pricing__header">
        <h2>Gestionar Precios</h2>
        <p>Actualiza los montos de las suscripciones para usuarios normales.</p>
      </div>

      <div className="admin-pricing__card">
        {PLAN_LABELS.map((plan) => (
          <div key={plan.key} className="admin-pricing__row">
            <div className="admin-pricing__label">
              <span>{plan.label}</span>
              <small>{formatCLP(parsedPrices[plan.key] || 0)}</small>
            </div>
            <input
              type="number"
              min="1"
              step="1"
              value={prices?.[plan.key] ?? ""}
              onChange={(event) => handleChange(plan.key, event.target.value)}
              className="admin-pricing__input"
              aria-label={`Precio ${plan.label}`}
            />
          </div>
        ))}

        {error && <div className="admin-pricing__error">{error}</div>}
        {savedMessage && (
          <div className="admin-pricing__success">{savedMessage}</div>
        )}

        <button
          className="admin-pricing__save"
          onClick={handleSave}
          disabled={saving}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
