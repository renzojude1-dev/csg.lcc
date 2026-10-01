import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Search as SearchIcon, ArrowRight } from "lucide-react";

export default function Search() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runSearch = async (term) => {
    const searchTerm = term.trim().toLowerCase();

    if (!searchTerm) {
      setResults([]);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [announcements, events, officers, resources] =
        await Promise.all([
          supabase
            .from("announcements")
            .select("id, title, excerpt")
            .eq("is_published", true),

          supabase
            .from("events")
            .select("id, title, description, starts_at")
            .eq("is_published", true),

          supabase
            .from("officers")
            .select("id, name, position")
            .eq("is_current", true),

          supabase
            .from("resources")
            .select("id, title, description")
            .eq("is_published", true),
        ]);

      const errors = [
        announcements.error,
        events.error,
        officers.error,
        resources.error,
      ].filter(Boolean);

      if (errors.length > 0) {
        console.error("Search error:", errors);
        throw new Error("Unable to search the student portal.");
      }

      const output = [];

      // Announcements
      (announcements.data || []).forEach((item) => {
        const searchableText = `${item.title || ""} ${
          item.excerpt || ""
        }`.toLowerCase();

        if (searchableText.includes(searchTerm)) {
          output.push({
            type: "Announcement",
            title: item.title || "Untitled announcement",
            desc: item.excerpt || "No description available.",
            url: `/announcements/${item.id}`,
          });
        }
      });

      // Events
      (events.data || []).forEach((item) => {
        const searchableText = `${item.title || ""} ${
          item.description || ""
        }`.toLowerCase();

        if (searchableText.includes(searchTerm)) {
          output.push({
            type: "Event",
            title: item.title || "Untitled event",
            desc: item.description || "No description available.",
            url: `/events/${item.id}`,
          });
        }
      });

      // Officers
      (officers.data || []).forEach((item) => {
        const searchableText = `${item.name || ""} ${
          item.position || ""
        }`.toLowerCase();

        if (searchableText.includes(searchTerm)) {
          output.push({
            type: "Officer",
            title: item.name || "Unnamed officer",
            desc: item.position || "Student Government Officer",
            url: "/officers",
          });
        }
      });

      // Resources
      (resources.data || []).forEach((item) => {
        const searchableText = `${item.title || ""} ${
          item.description || ""
        }`.toLowerCase();

        if (searchableText.includes(searchTerm)) {
          output.push({
            type: "Resource",
            title: item.title || "Untitled resource",
            desc: item.description || "No description available.",
            url: "/resources",
          });
        }
      });

      setResults(output);
    } catch (err) {
      console.error(err);
      setResults([]);
      setError(
        err?.message || "Something went wrong while searching."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialQuery = params.get("q") || "";
    setQ(initialQuery);

    if (initialQuery.trim()) {
      runSearch(initialQuery);
    } else {
      setResults([]);
    }
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmed = q.trim();

    if (trimmed) {
      setParams({ q: trimmed });
      runSearch(trimmed);
    } else {
      setParams({});
      setResults([]);
      setError("");
    }
  };

  return (
    <section className="container page">
      <div className="page-title">
        <span className="eyebrow">FIND INFORMATION</span>
        <h1>Search</h1>
        <p>
          Search announcements, events, officers, and student resources
          across the Central Student Government portal.
        </p>
      </div>

      <form className="search-large" onSubmit={handleSubmit}>
        <SearchIcon size={22} />

        <input
          type="text"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search the student portal..."
          aria-label="Search the student portal"
        />

        <button
          type="submit"
          className="btn primary"
          disabled={loading}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && (
        <div className="empty" style={{ marginTop: "20px" }}>
          {error}
        </div>
      )}

      {!loading && !error && q.trim() && results.length > 0 && (
        <div className="search-summary">
          {results.length}{" "}
          {results.length === 1 ? "result" : "results"} found for{" "}
          <strong>“{q.trim()}”</strong>
        </div>
      )}

      <div className="search-results">
        {loading && (
          <>
            <div className="search-result">
              <span>SEARCH</span>
              <h3>Searching...</h3>
              <p>
                Looking through announcements, events, officers, and
                resources.
              </p>
            </div>
          </>
        )}

        {!loading &&
          !error &&
          results.map((item, index) => (
            <Link
              className="search-result"
              to={item.url}
              key={`${item.type}-${item.title}-${index}`}
            >
              <span>{item.type}</span>

              <h3>{item.title}</h3>

              <p>{item.desc}</p>

              <strong className="search-result-link">
                View details <ArrowRight size={15} />
              </strong>
            </Link>
          ))}

        {!loading &&
          !error &&
          q.trim() &&
          results.length === 0 && (
            <div className="empty">
              No results found for “{q.trim()}”.
            </div>
          )}

        {!loading && !error && !q.trim() && (
          <div className="empty">
            Enter a keyword above to search the student portal.
          </div>
        )}
      </div>
    </section>
  );
}