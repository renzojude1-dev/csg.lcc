import { Link } from "react-router-dom";

import {
  CalendarDays,
  MapPin,
  ArrowRight,
} from "lucide-react";

import { formatDateTime } from "../lib/helpers";

export default function EventCard({ item }) {
  if (!item) {
    return null;
  }

  const title =
    item.title || "Untitled event";

  const description =
    item.description || "";

  const descriptionPreview =
    description.length > 125
      ? `${description.slice(0, 125)}…`
      : description;

  return (
    <article className="card event-card">

      {item.poster_url ? (
        <img
          src={item.poster_url}
          alt={title}
          className="card-image poster"
          loading="lazy"
        />
      ) : (
        <div
          className="poster-placeholder"
          aria-hidden="true"
        >
          <CalendarDays size={40} />
        </div>
      )}

      <div className="card-body">

        <span className="eyebrow">
          Event
        </span>

        <h3>{title}</h3>

        {item.starts_at && (
          <p className="event-meta">
            <CalendarDays size={16} />
            <span>
              {formatDateTime(
                item.starts_at
              )}
            </span>
          </p>
        )}

        {item.location && (
          <p className="event-meta">
            <MapPin size={16} />
            <span>
              {item.location}
            </span>
          </p>
        )}

        {descriptionPreview && (
          <p>
            {descriptionPreview}
          </p>
        )}

        {item.id && (
          <Link
            className="text-link"
            to={`/events/${item.id}`}
          >
            View event &amp; reviews
            <ArrowRight size={16} />
          </Link>
        )}

      </div>
    </article>
  );
}