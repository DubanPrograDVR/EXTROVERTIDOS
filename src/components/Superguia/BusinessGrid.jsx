import BusinessCard from "./BusinessCard";
import "./styles/BusinessGrid.css";

export default function BusinessGrid({ businesses, onBusinessClick }) {
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
        />
      ))}
    </div>
  );
}
