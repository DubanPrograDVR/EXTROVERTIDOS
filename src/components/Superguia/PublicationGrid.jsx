import "./styles/PublicationGrid.css";
import PublicationCard from "./PublicationCard";

export default function PublicationGrid({ publications, onPublicationClick }) {
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
        />
      ))}
    </div>
  );
}
