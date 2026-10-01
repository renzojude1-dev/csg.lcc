import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { formatDate } from "../lib/helpers";
import {
  ArrowLeft,
  Download,
  AlertCircle,
} from "lucide-react";

export default function AnnouncementDetail() {
  const { id } = useParams();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAnnouncement();
  }, [id]);

  async function loadAnnouncement() {
    if (!id) {
      setError("Announcement not found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .eq("id", id)
      .eq("is_published", true)
      .single();

    if (error) {
      console.error(
        "Announcement detail error:",
        error
      );

      setItem(null);
      setError(
        "This announcement could not be found."
      );
    } else {
      setItem(data);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <section className="container page">
        <div className="empty">
          Loading announcement...
        </div>
      </section>
    );
  }

  if (!item) {
    return (
      <section className="container page">
        <Link
          className="back-link"
          to="/announcements"
        >
          <ArrowLeft size={16} />
          Back to announcements
        </Link>

        <div className="empty">
          <AlertCircle size={20} />

          <p>
            {error ||
              "This announcement could not be found."}
          </p>
        </div>
      </section>
    );
  }

  const body = item.body || "";

  return (
    <section className="container page narrow">
      <Link
        className="back-link"
        to="/announcements"
      >
        <ArrowLeft size={16} />
        Back to announcements
      </Link>

      {item.image_url && (
        <img
          className="detail-image"
          src={item.image_url}
          alt={item.title || "Announcement"}
        />
      )}

      <span className="eyebrow">
        ANNOUNCEMENT
        {item.published_at
          ? ` · ${formatDate(item.published_at)}`
          : ""}
      </span>

      <h1>{item.title}</h1>

      <div className="prose">
        {body.split("\n").map((paragraph, index) => {
          if (!paragraph.trim()) {
            return (
              <div
                key={index}
                style={{ height: "10px" }}
              />
            );
          }

          return (
            <p key={index}>
              {paragraph}
            </p>
          );
        })}
      </div>

      {item.attachment_url && (
        <a
          className="btn primary"
          href={item.attachment_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Download size={17} />

          Download{" "}
          {item.attachment_name ||
            "attachment"}
        </a>
      )}
    </section>
  );
}