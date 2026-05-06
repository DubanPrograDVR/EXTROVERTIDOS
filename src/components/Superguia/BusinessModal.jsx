import { lazy, Suspense } from "react";

const BusinessModalContent = lazy(
  () => import("./BusinessModal/BusinessModalContent"),
);

function BusinessModalFallback({ isOpen }) {
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
        background: "rgba(0, 0, 0, 0.74)",
        color: "#fff",
        fontWeight: 700,
      }}>
      Cargando negocio...
    </div>
  );
}

export default function BusinessModal(props) {
  if (!props.isOpen) return null;

  return (
    <Suspense fallback={<BusinessModalFallback isOpen={props.isOpen} />}>
      <BusinessModalContent {...props} />
    </Suspense>
  );
}
