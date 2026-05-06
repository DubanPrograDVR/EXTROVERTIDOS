import { useCallback, useEffect, useState } from "react";
import { useRealtimeRefetch } from "../../../../hooks/useRealtimeRefetch";
import {
  getLikesCount,
  hasUserLiked,
  isFavorite,
  toggleFavorite,
  toggleLike,
} from "../../../../lib/database";

export default function usePublicationInteractions({
  publicationId,
  user,
  isOpen,
  showToast,
}) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isTogglingLike, setIsTogglingLike] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isTogglingSave, setIsTogglingSave] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const loadLikeState = useCallback(async () => {
    if (!publicationId) return;
    try {
      const count = await getLikesCount(publicationId);
      setLikeCount(count);
      if (user) {
        const [liked, saved] = await Promise.all([
          hasUserLiked(user.id, publicationId),
          isFavorite(user.id, publicationId),
        ]);
        setIsLiked(liked);
        setIsSaved(saved);
      }
    } catch (error) {
      console.error("Error cargando likes:", error);
    }
  }, [publicationId, user]);

  useEffect(() => {
    if (isOpen) loadLikeState();
  }, [loadLikeState, isOpen]);

  useRealtimeRefetch({
    table: "event_likes",
    event: "*",
    filter: publicationId ? `event_id=eq.${publicationId}` : undefined,
    enabled: Boolean(isOpen && publicationId),
    onChange: () => loadLikeState(),
  });

  const handleLikeClick = useCallback(async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (isTogglingLike || !publicationId) return;

    setIsTogglingLike(true);
    try {
      const result = await toggleLike(user.id, publicationId);
      setIsLiked(result.isLiked);
      setLikeCount(result.count);
    } catch (error) {
      console.error("Error al cambiar like:", error);
      showToast("Error al procesar tu reacción", "error");
    } finally {
      setIsTogglingLike(false);
    }
  }, [isTogglingLike, publicationId, showToast, user]);

  const handleSaveClick = useCallback(async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (isTogglingSave || !publicationId) return;

    setIsTogglingSave(true);
    try {
      const result = await toggleFavorite(user.id, publicationId);
      setIsSaved(result.isFavorite);
      showToast(
        result.isFavorite ? "Guardado en favoritos" : "Eliminado de favoritos",
        "success",
      );
    } catch (error) {
      console.error("Error al guardar:", error);
      showToast("Error al guardar", "error");
    } finally {
      setIsTogglingSave(false);
    }
  }, [isTogglingSave, publicationId, showToast, user]);

  return {
    isLiked,
    likeCount,
    isTogglingLike,
    isSaved,
    isTogglingSave,
    showAuthModal,
    setShowAuthModal,
    handleLikeClick,
    handleSaveClick,
  };
}