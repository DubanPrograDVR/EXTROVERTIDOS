import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BusinessCard from "./BusinessCard";
import "./styles/BusinessGrid.css";
import { useAuth } from "../../context/AuthContext";
import { useRealtimeRefetch } from "../../hooks/useRealtimeRefetch";
import { getBusinessLikesState } from "../../lib/database";

/**
 * Grid de negocios.
 *
 * Optimización: hace UNA sola consulta batched a `business_likes` para todos
 * los negocios visibles (en lugar de 1+ consulta por card) y mantiene UNA
 * sola suscripción Realtime para refrescar el lote.
 */
export default function BusinessGrid({
  businesses,
  onBusinessClick,
  categories,
}) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const businessIds = useMemo(
    () => (businesses || []).map((b) => b.id).filter(Boolean),
    [businesses],
  );
  const businessIdsKey = businessIds.join(",");
  const businessIdsSetRef = useRef(new Set());
  useEffect(() => {
    businessIdsSetRef.current = new Set(businessIds);
  }, [businessIds]);

  const [likesMap, setLikesMap] = useState({});

  const fetchLikes = useCallback(async () => {
    if (!businessIds.length) {
      setLikesMap({});
      return;
    }
    try {
      const state = await getBusinessLikesState(userId, businessIds);
      setLikesMap(state || {});
    } catch (error) {
      console.error(
        "Error cargando estado de likes batched (negocios):",
        error,
      );
    }
    // businessIdsKey provee identidad estable derivada de businessIds.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, businessIdsKey]);

  useEffect(() => {
    fetchLikes();
  }, [fetchLikes]);

  const handleRealtimeChange = useCallback(
    (payload) => {
      const changedId =
        payload?.new?.business_id || payload?.old?.business_id || null;
      if (!changedId) return;
      if (businessIdsSetRef.current.has(changedId)) {
        fetchLikes();
      }
    },
    [fetchLikes],
  );

  useRealtimeRefetch({
    table: "business_likes",
    event: "*",
    enabled: businessIds.length > 0,
    debounceMs: 800,
    onChange: handleRealtimeChange,
  });

  const handleLocalLikeChange = useCallback((businessId, nextState) => {
    if (!businessId || !nextState) return;
    setLikesMap((prev) => ({
      ...prev,
      [businessId]: {
        isLiked: !!nextState.isLiked,
        count: Number(nextState.count) || 0,
      },
    }));
  }, []);

  if (!businesses || businesses.length === 0) {
    return null;
  }

  return (
    <div className="business-grid">
      {businesses.map((business) => (
        <BusinessCard
          key={business.id}
          business={business}
          onClick={onBusinessClick}
          categories={categories}
          likeState={likesMap[business.id]}
          onLikeChange={handleLocalLikeChange}
        />
      ))}
    </div>
  );
}
