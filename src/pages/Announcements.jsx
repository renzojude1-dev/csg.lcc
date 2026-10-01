
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  AlertCircle,
  Megaphone,
  RefreshCw,
  X,
  FileText,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import AnnouncementCard from "../components/AnnouncementCard";

export default function Announcements() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadAnnouncements = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setItems(data || []);
    } catch (err) {
      console.error("Announcements error:", err);
      setError("Unable to load announcements right now.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const searchTerm = query.trim().toLowerCase();

  const filteredAnnouncements = useMemo(() => {
    if (!searchTerm) return items;

    return items.filter((item) => {
      const searchableText = [
        item.title,
        item.excerpt,
        item.body,
      ]
        .filter(Boolean)
        .join(" ")
        .replace(/<[^>]*>/g, " ")
        .toLowerCase();

      return searchableText.includes(searchTerm);
    });
  }, [items, searchTerm]);

  function clearSearch() {
    setQuery("");
  }

  return (
    <main className="container page csg-announcements-page">
      {/* PAGE HEADER */}
      <header className="page-title csg-announcements-header">
        <span className="eyebrow">
          <Megaphone size={15} />
          CAMPUS UPDATES
        </span>

        <h1>Announcements</h1>

        <p>
          Official notices, important updates, and information
          from the Central Student Government of Lipa City Colleges.
        </p>
      </header>

      {/* SEARCH AND RESULTS TOOLBAR */}
      <section className="csg-announcements-toolbar">
        <div className="wide-input-wrap csg-announcements-search">
          <Search size={20} />

          <input
            className="wide-input"
            type="search"
            placeholder="Search announcements..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search announcements"
          />

          {query && (
            <button
              type="button"
              className="csg-search-clear"
              onClick={clearSearch}
              aria-label="Clear search"
              title="Clear search"
            >
              <X size={17} />
            </button>
          )}
        </div>

        <button
          type="button"
          className="btn small csg-announcements-refresh"
          onClick={() => loadAnnouncements(true)}
          disabled={loading || refreshing}
          aria-label="Refresh announcements"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "csg-spin" : ""}
          />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </section>

      {/* RESULTS SUMMARY */}
      {!loading && !error && (
        <div className="csg-announcements-summary">
          <div className="csg-announcements-count">
            <FileText size={17} />
            <span>
              {searchTerm
                ? `${filteredAnnouncements.length} ${
                    filteredAnnouncements.length === 1
                      ? "result"
                      : "results"
                  } found`
                : `${items.length} ${
                    items.length === 1
                      ? "announcement"
                      : "announcements"
                  }`}
            </span>
          </div>

          {searchTerm && (
            <span className="csg-announcements-search-label">
              Searching for: <strong>"{query.trim()}"</strong>
            </span>
          )}
        </div>
      )}

      {/* ANNOUNCEMENT CONTENT */}
      <section
        className="card-grid csg-announcements-grid"
        aria-live="polite"
      >
        {/* LOADING */}
        {loading && (
          <div className="empty csg-announcements-state">
            <RefreshCw size={24} className="csg-spin" />
            <h3>Loading announcements</h3>
            <p>Please wait while we fetch the latest updates.</p>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="empty csg-announcements-state csg-announcements-error">
            <AlertCircle size={28} />
            <h3>Unable to load announcements</h3>
            <p>{error}</p>

            <button
              type="button"
              className="btn small"
              onClick={() => loadAnnouncements()}
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        )}

        {/* ANNOUNCEMENT CARDS */}
        {!loading &&
          !error &&
          filteredAnnouncements.length > 0 &&
          filteredAnnouncements.map((item) => (
            <AnnouncementCard
              key={item.id}
              item={item}
            />
          ))}

        {/* EMPTY SEARCH RESULTS */}
        {!loading &&
          !error &&
          searchTerm &&
          filteredAnnouncements.length === 0 && (
            <div className="empty csg-announcements-state">
              <Search size={28} />
              <h3>No matching announcements</h3>
              <p>
                We couldn't find any announcements matching
                "{query.trim()}". Try another keyword.
              </p>

              <button
                type="button"
                className="btn small"
                onClick={clearSearch}
              >
                <X size={16} />
                Clear Search
              </button>
            </div>
          )}

        {/* NO ANNOUNCEMENTS */}
        {!loading &&
          !error &&
          !searchTerm &&
          items.length === 0 && (
            <div className="empty csg-announcements-state">
              <Megaphone size={28} />
              <h3>No announcements yet</h3>
              <p>
                There are no published announcements at the moment.
                Please check back later for updates.
              </p>
            </div>
          )}
      </section>
    </main>
  );
}