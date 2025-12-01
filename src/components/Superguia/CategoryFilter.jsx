import "./styles/CategoryFilter.css";

export default function CategoryFilter({
  categories,
  selectedCategory,
  onCategoryChange,
}) {
  return (
    <div className="category-filter">
      <div className="category-filter__grid">
        {categories.map((category) => (
          <button
            key={category.id}
            className={`category-filter__item ${
              selectedCategory === category.nombre ? "active" : ""
            }`}
            onClick={() =>
              onCategoryChange(
                selectedCategory === category.nombre ? null : category.nombre
              )
            }>
            <span className="category-filter__icon">
              <img src="/img/P_Extro.png" alt="" />
            </span>
            <span className="category-filter__name">{category.nombre}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
