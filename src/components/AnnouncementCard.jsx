import { Link } from "react-router-dom";
import {
  ArrowRight,
  Paperclip,
} from "lucide-react";

import { formatDate } from "../lib/helpers";

export default function AnnouncementCard({ item }) {
  if (!item) {
    return null;
  }

  const title =
    item.title || "Untitled announcement";

  const body =
    item.body || "";

  const excerpt =
    item.excerpt ||
    (body.length > 150
      ? `${body.slice(0, 150)}…`
      : body);

  return (
    <article className="card announcement-card">

      {item.image_url && (
        <img
          src={item.image_url}
          alt={title}
          className="card-image"
          loading="lazy"
        />
      )}

      <div className="card-body">

        <span className="eyebrow">
          Announcement
          {item.published_at
            ? ` · ${formatDate(
                item.published_at
              )}`
            : ""}
        </span>

        <h3>{title}</h3>

        {excerpt && (
          <p>{excerpt}</p>
        )}

        <div className="card-actions">

          {item.id && (
            <Link
              className="text-link"
              to={`/announcements/${item.id}`}
            >
              Read announcement
              <ArrowRight size={16} />
            </Link>
          )}

          {item.attachment_url && (
            <a
              className="file-chip"
              href={item.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Paperclip size={14} />

              <span>
                {item.attachment_name ||
                  "File"}
              </span>
            </a>
          )}

        </div>
      </div>
    </article>
  );
}