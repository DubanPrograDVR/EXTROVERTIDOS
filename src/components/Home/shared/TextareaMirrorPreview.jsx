const normalizeText = (value) =>
  typeof value === "string" ? value.replace(/\r\n/g, "\n") : "";

const getParagraphs = (text) => {
  const normalized = normalizeText(text);

  if (!normalized.trim()) {
    return [];
  }

  return normalized
    .split(/\n\s*\n/)
    .map((block) => block.replace(/^\s+|\s+$/g, ""))
    .filter(Boolean);
};

const getLayoutStyle = (layout) => {
  if (!layout || typeof layout !== "object" || Array.isArray(layout)) {
    return undefined;
  }

  const style = {};

  if (typeof layout.width === "number") {
    style.maxWidth = `${layout.width}px`;
  } else if (typeof layout.width === "string") {
    style.maxWidth = layout.width;
  }

  if (typeof layout.fontSize === "number") {
    style.fontSize = `${layout.fontSize}px`;
  } else if (typeof layout.fontSize === "string") {
    style.fontSize = layout.fontSize;
  }

  if (typeof layout.lineHeight === "number") {
    style.lineHeight = String(layout.lineHeight);
  } else if (typeof layout.lineHeight === "string") {
    style.lineHeight = layout.lineHeight;
  }

  if (typeof layout.letterSpacing === "number") {
    style.letterSpacing = `${layout.letterSpacing}px`;
  } else if (typeof layout.letterSpacing === "string") {
    style.letterSpacing = layout.letterSpacing;
  }

  if (typeof layout.fontFamily === "string") {
    style.fontFamily = layout.fontFamily;
  }

  if (
    typeof layout.fontWeight === "number" ||
    typeof layout.fontWeight === "string"
  ) {
    style.fontWeight = layout.fontWeight;
  }

  if (typeof layout.whiteSpace === "string") {
    style.whiteSpace = layout.whiteSpace;
  }

  return Object.keys(style).length > 0 ? style : undefined;
};

export function MirroredTextareaPreview({ text = "", layout, className = "" }) {
  const paragraphs = getParagraphs(text);
  const style = getLayoutStyle(layout);

  if (paragraphs.length === 0) {
    return null;
  }

  return (
    <div
      className={className}
      style={{
        whiteSpace: "pre-wrap",
        overflowWrap: "anywhere",
        ...style,
      }}>
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  );
}

export default MirroredTextareaPreview;
