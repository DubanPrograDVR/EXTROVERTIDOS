import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./styles/PublicationGrid.css";
import PublicationCard from "./PublicationCard";
import { useAuth } from "../../context/AuthContext";
import { useRealtimeRefetch } from "../../hooks/useRealtimeRefetch";
import { getLikesState } from "../../lib/database";

/**
 * Grid de publicaciones.
 *
 * Optimización: hace UNA sola consulta batched a `event_likes` para todos los
 * eventos visibles (en lugar de 2 consultas por card) y mantiene UNA sola
 * suscripción Realtime para refrescar el lote, en vez de una por tarjeta.
 */
export default function PublicationGrid({ publications, onPublicationClick }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  // Lista estable de IDs para dependencias (evita re-fetch innecesarios).
  const eventIds = useMemo(
    () => (publications || []).map((p) => p.id).filter(Boolean),
    [publications],
  );
  const eventIdsKey = eventIds.join(",");
  const eventIdsSetRef = useRef(new Set());
  useEffect(() => {
    eventIdsSetRef.current = new Set(eventIds);
  }, [eventIds]);

  const [likesMap, setLikesMap] = useState({});

  const fetchLikes = useCallback(async () => {
    if (!eventIds.length) {
      setLikesMap({});
      return;
    }
    try {
      const state = await getLikesState(userId, eventIds);
      setLikesMap(state || {});
    } catch (error) {
      console.error("Error cargando estado de likes batched:", error);
    }
    // eventIdsKey provee identidad estable derivada de eventIds.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, eventIdsKey]);

  useEffect(() => {
    fetchLikes();
  }, [fetchLikes]);

  // Refetch del lote cuando cambia cualquier like que afecte a un evento visible.
  const handleRealtimeChange = useCallback(
    (payload) => {
      const changedId =
        payload?.new?.event_id || payload?.old?.event_id || null;
      if (!changedId) return;
      if (eventIdsSetRef.current.has(changedId)) {
        fetchLikes();
      }
    },
    [fetchLikes],
  );

  useRealtimeRefetch({
    table: "event_likes",
    event: "*",
    enabled: eventIds.length > 0,
    debounceMs: 800,
    onChange: handleRealtimeChange,
  });

  // Callback usado por la card para actualización optimista local.
  const handleLocalLikeChange = useCallback((eventId, nextState) => {
    if (!eventId || !nextState) return;
    setLikesMap((prev) => ({
      ...prev,
      [eventId]: {
        isLiked: !!nextState.isLiked,
        count: Number(nextState.count) || 0,
      },
    }));
  }, []);

  if (!publications || publications.length === 0) {
    return null;
  }

  return (
    <div className="publication-grid">
      {publications.map((publication) => (
        <PublicationCard
          key={publication.id}
          publication={publication}
          onClick={onPublicationClick}
          likeState={likesMap[publication.id]}
          onLikeChange={handleLocalLikeChange}
        />
      ))}
    </div>
  );
}
