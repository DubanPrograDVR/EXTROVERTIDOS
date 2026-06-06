import { SPONSOR_SLOTS } from "./sponsorData";
import "./styles/SponsorCarousel.css";

const SponsorImage = ({ sponsor }) => {
  const inner = (
    <>
      <span className="sponsor-carousel__halo" aria-hidden="true" />
      <img
        src={sponsor.imageUrl}
        alt={sponsor.alt || "Auspiciador Extrovertidos"}
        className="sponsor-carousel__image"
        loading="lazy"
        decoding="async"
      />
    </>
  );

  if (sponsor.href) {
    return (
      <a
        className="sponsor-carousel__item"
        href={sponsor.href}
        target="_blank"
        rel="noopener noreferrer">
        {inner}
      </a>
    );
  }

  return <div className="sponsor-carousel__item">{inner}</div>;
};

export default function SponsorCarousel() {
  const sponsors = SPONSOR_SLOTS.filter((sponsor) => sponsor.imageUrl);

  if (sponsors.length === 0) return null;

  const isSingle = sponsors.length === 1;

  return (
    <section
      className={`sponsor-carousel${isSingle ? " sponsor-carousel--single" : ""}`}
      aria-label="Auspiciadores">
      <div className="sponsor-carousel__header">
        <span className="sponsor-carousel__eyebrow">
          <span className="sponsor-carousel__dot" aria-hidden="true" />
          Auspiciadores
        </span>
      </div>
      <div className="sponsor-carousel__viewport">
        <div className="sponsor-carousel__track">
          {sponsors.map((sponsor) => (
            <SponsorImage key={sponsor.id} sponsor={sponsor} />
          ))}
        </div>
      </div>
    </section>
  );
}
