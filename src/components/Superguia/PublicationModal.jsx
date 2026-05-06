import { lazy, Suspense } from "react";

const PublicationModalContent = lazy(
  () => import("./PublicationModal/PublicationModalContent"),
);

function PublicationModalFallback({ isOpen }) {
  if (!isOpen) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "grid",
        placeItems: "center",
        background: "rgba(0, 0, 0, 0.72)",
        color: "#fff",
        fontFamily: "inherit",
      }}>
      Cargando publicación...
    </div>
  );
}

export default function PublicationModal(props) {
  if (!props.isOpen) return null;

  return (
    <Suspense fallback={<PublicationModalFallback isOpen={props.isOpen} />}>
      <PublicationModalContent {...props} />
    </Suspense>
  );
}
