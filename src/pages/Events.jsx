import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import EventCard from "../components/EventCard";

export default function Events() {
  const [items, setItems] = useState([]);
  const [past, setPast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("is_published", true)
      .order("starts_at", { ascending: true });

    if (error) {
      console.error("Events error:", error);
      setError("Unable to load events right now.");
      setItems([]);
    } else {
      setItems(data || []);
    }

    setLoading(false);
  }

  const now = new Date();

  const filtered = items.filter((item) => {
    if (!item.starts_at) {
      return false;
    }

    const eventDate = new Date(item.starts_at);

    return past ? eventDate < now : eventDate >= now;
  });

  return (
    <section className="container page">
      <div className="page-title">
        <span className="eyebrow">CAMPUS ACTIVITIES</span>

        <h1>Events</h1>

        <p>
          See what's happening and share your experience
          through a quick star rating and comment.
        </p>
      </div>

      <div className="tabs">
        <button
          type="button"
          className={!past ? "active" : ""}
          onClick={() => setPast(false)}
        >
          Upcoming
        </button>

        <button
          type="button"
          className={past ? "active" : ""}
          onClick={() => setPast(true)}
        >
          Past events
        </button>
      </div>

      <div className="card-grid">
        {loading && (
          <div className="empty">
            Loading events...
          </div>
        )}

        {!loading && error && (
          <div className="empty">
            <p>{error}</p>

            <button
              type="button"
              className="btn small"
              onClick={loadEvents}
            >
              Try Again
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          filtered.length > 0 &&
          filtered.map((item) => (
            <EventCard
              key={item.id}
              item={item}
            />
          ))}

        {!loading &&
          !error &&
          filtered.length === 0 && (
            <div className="empty">
              No events in this section.
            </div>
          )}
      </div>
    </section>
  );
}