
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Users, RefreshCw } from "lucide-react";

export default function Officers() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadOfficers();
  }, []);

  async function loadOfficers() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("officers")
      .select("*")
      .eq("is_current", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Officers error:", error);
      setError("Unable to load officer profiles. Please try again.");
      setItems([]);
    } else {
      setItems(data || []);
    }

    setLoading(false);
  }

  return (
    <main className="container page officers-page">
      <header className="officers-heading">
        <span className="officers-eyebrow">STUDENT LEADERSHIP</span>
        <h1>Meet Our Officers</h1>
        <p>
          Get to know the student leaders dedicated to representing
          and serving the Central Student Government of Lipa City Colleges.
        </p>
      </header>

      {loading && (
        <div className="officers-state">
          <span className="officers-loader" />
          <p>Loading officer profiles...</p>
        </div>
      )}

      {!loading && error && (
        <div className="officers-state officers-error">
          <p>{error}</p>
          <button
            type="button"
            className="officers-retry"
            onClick={loadOfficers}
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="officers-state">
          <Users size={36} strokeWidth={1.5} />
          <h2>No Officers Listed Yet</h2>
          <p>
            Officer profiles will appear here once the administrator
            adds them.
          </p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <section className="officers-grid" aria-label="Current CSG officers">
          {items.map((item) => {
            const name = item.name || "Unnamed Officer";
            const position = item.position || "CSG Officer";
            const courseYear = item.course_year || "";
            const bio = item.bio || "";

            return (
              <article className="officer-card" key={item.id}>
                <div className="officer-photo-wrap">
                  {item.photo_url ? (
                    <img
                      src={item.photo_url}
                      alt={`Portrait of ${name}`}
                      className="officer-photo"
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                        event.currentTarget.nextElementSibling?.classList.add(
                          "is-visible"
                        );
                      }}
                    />
                  ) : null}

                  <div
                    className={`officer-placeholder ${
                      item.photo_url ? "" : "is-visible"
                    }`}
                    aria-hidden="true"
                  >
                    <Users size={42} strokeWidth={1.4} />
                  </div>
                </div>

                <div className="officer-content">
                  <span className="officer-position">{position}</span>
                  <h2>{name}</h2>

                  {courseYear && (
                    <p className="officer-course">{courseYear}</p>
                  )}

                  {bio && <p className="officer-bio">{bio}</p>}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}