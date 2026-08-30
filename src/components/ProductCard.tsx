type ProductCardProps = {
  /* ===== Home ===== */
  title?: string;
  description?: string;
  count?: number;

  /* ===== Approve ===== */
  name?: string;
  type?: string;
  size?: string;
  user?: string;
  date?: string;

  /* ===== Common ===== */
  selected?: boolean;
  onClick?: () => void;
};

export default function ProductCard({
  title,
  description,
  count,
  name,
  type,
  size,
  user,
  date,
  selected = false,
  onClick,
}: ProductCardProps) {
  // -----------------------------------------
  // HOME DATA
  // -----------------------------------------

  if (title !== undefined) {
    return (
      <button
        type="button"
        className={`product-card ${
          selected ? "selected" : ""
        }`}
        onClick={onClick}
      >
        <div className="file-list-icon">
          <span className="user-head" />
          <span className="user-body" />
        </div>

        <div className="product-card-content">
          <strong>{title}</strong>

          {description && (
            <span>{description}</span>
          )}
        </div>

        {count !== undefined && (
          <span className="product-card-count">
            {count}
          </span>
        )}
      </button>
    );
  }

  // -----------------------------------------
  // APPROVE DATA
  // -----------------------------------------

  return (
    <button
      type="button"
      className={`product-card ${
        selected ? "selected" : ""
      }`}
      onClick={onClick}
    >
      <div className="file-list-icon">
        <span className="user-head" />
        <span className="user-body" />
      </div>

      <div className="product-card-content">
        <strong>
          {user ?? "User"}
        </strong>

        <span>
          {type ?? ""}
          {size
            ? ` • ${size}`
            : ""}
        </span>

        {name && (
          <span>{name}</span>
        )}
      </div>

      {date && (
        <time>{date}</time>
      )}
    </button>
  );
}