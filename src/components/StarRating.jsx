import { Star } from "lucide-react";

export default function StarRating({
  value = 0,
  onChange,
  size = 20,
}) {
  const rating = Math.max(
    0,
    Math.min(5, Number(value) || 0)
  );

  return (
    <div
      className="stars"
      role="group"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= rating;

        return (
          <button
            key={star}
            type="button"
            className={
              active
                ? "star active"
                : "star"
            }
            onClick={() =>
              onChange?.(star)
            }
            disabled={!onChange}
            aria-label={`${star} ${
              star === 1
                ? "star"
                : "stars"
            }`}
            aria-pressed={active}
          >
            <Star
              size={size}
              strokeWidth={2.2}
              fill={
                active
                  ? "currentColor"
                  : "none"
              }
            />
          </button>
        );
      })}
    </div>
  );
}