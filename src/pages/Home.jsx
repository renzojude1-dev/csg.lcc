
import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  CalendarDays,
  Bell,
  Users,
  FileText,
  Search,
  MessageCircle,
  ChevronRight,
  Megaphone,
  ShieldCheck,
  Clock3,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import AnnouncementCard from "../components/AnnouncementCard";
import EventCard from "../components/EventCard";

const quickLinks = [
  {
    title: "Announcements",
    description: "Official updates, notices, and important information.",
    path: "/announcements",
    icon: Bell,
  },
  {
    title: "Events",
    description: "Discover campus activities and student events.",
    path: "/events",
    icon: CalendarDays,
  },
  {
    title: "Officers",
    description: "Meet your student leaders and representatives.",
    path: "/officers",
    icon: Users,
  },
  {
    title: "Resources",
    description: "Find forms, guides, and useful documents.",
    path: "/resources",
    icon: FileText,
  },
];

export default function Home() {
  const navigate = useNavigate();

  const [featured, setFeatured] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const touchStartX = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function loadHomeData() {
      setLoading(true);
      setError("");

      try {
        const [featuredResult, announcementResult, eventResult] =
          await Promise.all([
            supabase
              .from("announcements")
              .select("*")
              .eq("is_published", true)
              .eq("is_featured", true)
              .order("published_at", { ascending: false })
              .limit(5),

            supabase
              .from("announcements")
              .select("*")
              .eq("is_published", true)
              .order("published_at", { ascending: false })
              .limit(3),

            supabase
              .from("events")
              .select("*")
              .eq("is_published", true)
              .gte("starts_at", new Date().toISOString())
              .order("starts_at", { ascending: true })
              .limit(3),
          ]);

        if (featuredResult.error) throw featuredResult.error;
        if (announcementResult.error) throw announcementResult.error;
        if (eventResult.error) throw eventResult.error;

        if (!mounted) return;

        setFeatured(featuredResult.data || []);
        setAnnouncements(announcementResult.data || []);
        setEvents(eventResult.data || []);
        setActiveSlide(0);
      } catch (err) {
        console.error("Homepage loading error:", err);
        if (!mounted) return;

        setError("Some homepage content could not be loaded.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadHomeData();

    return () => {
      mounted = false;
    };
  }, []);

  // Automatically change featured announcement every 3 seconds.
  useEffect(() => {
    if (featured.length <= 1) return;

    const timer = setInterval(() => {
      setActiveSlide((current) => (current + 1) % featured.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [featured.length]);

  function showPrevious() {
    if (featured.length <= 1) return;

    setActiveSlide((current) =>
      current === 0 ? featured.length - 1 : current - 1
    );
  }

  function showNext() {
    if (featured.length <= 1) return;

    setActiveSlide((current) => (current + 1) % featured.length);
  }

  function handleTouchStart(event) {
    touchStartX.current = event.changedTouches[0].clientX;
  }

  function handleTouchEnd(event) {
    if (touchStartX.current === null || featured.length <= 1) return;

    const touchEndX = event.changedTouches[0].clientX;
    const difference = touchStartX.current - touchEndX;

    if (Math.abs(difference) > 50) {
      if (difference > 0) {
        showNext();
      } else {
        showPrevious();
      }
    }

    touchStartX.current = null;
  }

  function handleSearch(event) {
    event.preventDefault();
    const term = query.trim();
    navigate(term ? `/search?q=${encodeURIComponent(term)}` : "/search");
  }

  const currentSlide = featured[activeSlide];

  return (
    <div
      className="csg-home"
      style={{
        backgroundColor: "#f4f8ff",
        color: "#172b4d",
        minHeight: "100vh",
      }}
    >
      {/* FEATURED ANNOUNCEMENT CAROUSEL */}
      <section
        className="csg-featured"
        style={{
          backgroundColor: "#102d59",
          position: "relative",
        }}
      >
        {currentSlide ? (
          <div
            className="csg-featured-slide"
            key={currentSlide.id}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{
              backgroundImage: currentSlide.image_url
                ? `linear-gradient(90deg, rgba(8, 28, 62, .96) 0%, rgba(12, 46, 94, .82) 48%, rgba(13, 54, 108, .28) 100%), url("${currentSlide.image_url}")`
                : "linear-gradient(115deg, #102d59, #245ba4)",
              backgroundColor: "#102d59",
              backgroundPosition: "center",
              backgroundSize: "cover",
              touchAction: "pan-y",
              color: "#ffffff",
            }}
          >
            <div className="container csg-featured-inner">
              <div className="csg-featured-content">
                <div
                  className="csg-featured-label"
                  style={{ color: "#dbeafe" }}
                >
                  <Megaphone size={15} />
                  FEATURED ANNOUNCEMENT
                </div>

                <h1 style={{ color: "#ffffff" }}>
                  {currentSlide.title || "Campus Announcement"}
                </h1>

                <p style={{ color: "#eaf2ff" }}>
                  {currentSlide.excerpt ||
                    currentSlide.summary ||
                    currentSlide.body?.replace(/<[^>]*>/g, "").slice(0, 220) ||
                    "Stay informed with the latest updates from the Central Student Government."}
                </p>

                <div
                  className="csg-featured-meta"
                  style={{ color: "#dbeafe" }}
                >
                  <span>
                    <ShieldCheck size={15} />
                    LCC Central Student Government
                  </span>

                  {currentSlide.published_at && (
                    <span>
                      <Clock3 size={15} />
                      {new Date(currentSlide.published_at).toLocaleDateString(
                        "en-PH",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </span>
                  )}
                </div>

                <Link
                  to={`/announcements/${currentSlide.id}`}
                  className="csg-featured-button"
                  style={{
                    backgroundColor: "#ffffff",
                    color: "#164a8a",
                    border: "1px solid #ffffff",
                  }}
                >
                  Read announcement
                  <ArrowRight size={17} />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="csg-featured-slide csg-featured-placeholder"
            style={{
              background: "linear-gradient(115deg, #102d59, #245ba4)",
              color: "#ffffff",
            }}
          >
            <div className="container csg-featured-inner">
              <div className="csg-featured-content">
                <div
                  className="csg-featured-label"
                  style={{ color: "#dbeafe" }}
                >
                  <Megaphone size={15} />
                  CENTRAL STUDENT GOVERNMENT
                </div>

                <h1 style={{ color: "#ffffff" }}>
                  Stay informed. Stay involved.
                </h1>

                <p style={{ color: "#eaf2ff" }}>
                  Official announcements, student activities, and important
                  updates from Lipa City Colleges.
                </p>

                <Link
                  to="/announcements"
                  className="csg-featured-button"
                  style={{
                    backgroundColor: "#ffffff",
                    color: "#164a8a",
                    border: "1px solid #ffffff",
                  }}
                >
                  View announcements
                  <ArrowRight size={17} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* CAROUSEL DOTS AND ARROWS */}
        {featured.length > 0 && (
          <div
            className="container csg-carousel-controls"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: "12px",
              paddingBottom: "16px",
            }}
          >
            <div
              className="csg-carousel-dots"
              aria-label={`Announcement ${activeSlide + 1} of ${featured.length}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "9px",
              }}
            >
              {featured.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className={
                    index === activeSlide
                      ? "csg-carousel-dot active"
                      : "csg-carousel-dot"
                  }
                  onClick={() => setActiveSlide(index)}
                  aria-label={`Show announcement ${index + 1} of ${featured.length}`}
                  aria-current={index === activeSlide ? "true" : undefined}
                  disabled={featured.length <= 1}
                  style={{
                    width: index === activeSlide ? "24px" : "9px",
                    height: "9px",
                    padding: 0,
                    border: "none",
                    borderRadius: "20px",
                    backgroundColor:
                      index === activeSlide ? "#ffffff" : "#8caedb",
                    opacity: index === activeSlide ? 1 : 0.7,
                    cursor: featured.length > 1 ? "pointer" : "default",
                    transition: "all 0.25s ease",
                  }}
                />
              ))}
            </div>

            {featured.length > 1 && (
              <div
                className="csg-carousel-arrows"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <button
                  type="button"
                  onClick={showPrevious}
                  aria-label="Previous announcement"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    border: "1px solid rgba(255,255,255,.5)",
                    backgroundColor: "rgba(255,255,255,.12)",
                    color: "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  <ArrowLeft size={18} />
                </button>

                <button
                  type="button"
                  onClick={showNext}
                  aria-label="Next announcement"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    border: "1px solid rgba(255,255,255,.5)",
                    backgroundColor: "rgba(255,255,255,.12)",
                    color: "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* SEARCH BAR */}
      <section
        className="container csg-home-search-section"
        style={{ backgroundColor: "transparent" }}
      >
        <form
          className="csg-home-search"
          onSubmit={handleSearch}
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #d8e5f5",
            borderRadius: "12px",
          }}
        >
          <Search size={20} color="#3268a8" />

          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search announcements, events, resources..."
            aria-label="Search website"
            style={{
              color: "#172b4d",
              backgroundColor: "transparent",
            }}
          />

          <button
            type="submit"
            style={{
              backgroundColor: "#174b89",
              color: "#ffffff",
              borderRadius: "8px",
            }}
          >
            Search <ArrowRight size={16} />
          </button>
        </form>
      </section>

      {/* QUICK LINKS */}
      <section
        className="container csg-home-quick"
        style={{ color: "#172b4d" }}
      >
        <div className="csg-home-heading">
          <div>
            <span
              className="csg-home-eyebrow"
              style={{ color: "#3268a8" }}
            >
              EXPLORE THE PORTAL
            </span>
            <h2 style={{ color: "#15365f" }}>How can we help you?</h2>
            <p style={{ color: "#60748f" }}>
              Quick access to the CSG's important pages and services.
            </p>
          </div>
        </div>

        <div className="csg-home-quick-grid">
          {quickLinks.map(({ title, description, path, icon: Icon }) => (
            <Link
              to={path}
              className="csg-home-quick-card"
              key={title}
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #dce8f7",
                color: "#17375f",
                borderRadius: "14px",
              }}
            >
              <span
                className="csg-home-quick-icon"
                style={{
                  backgroundColor: "#eaf3ff",
                  color: "#205a9c",
                }}
              >
                <Icon size={23} />
              </span>

              <h3 style={{ color: "#17375f" }}>{title}</h3>
              <p style={{ color: "#60748f" }}>{description}</p>

              <span
                className="csg-home-quick-open"
                style={{ color: "#205a9c" }}
              >
                Explore <ChevronRight size={16} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* LATEST ANNOUNCEMENTS */}
      <section
        className="csg-home-announcements"
        style={{
          backgroundColor: "#ffffff",
          color: "#172b4d",
        }}
      >
        <div className="container">
          <div className="csg-home-heading csg-home-heading-row">
            <div>
              <span
                className="csg-home-eyebrow"
                style={{ color: "#3268a8" }}
              >
                CAMPUS UPDATES
              </span>
              <h2 style={{ color: "#15365f" }}>Latest announcements</h2>
              <p style={{ color: "#60748f" }}>
                Stay up to date with recent notices from the CSG.
              </p>
            </div>

            <Link
              to="/announcements"
              className="csg-home-view-all"
              style={{ color: "#205a9c" }}
            >
              View all <ArrowRight size={16} />
            </Link>
          </div>

          {error && <div className="csg-home-error">{error}</div>}

          <div className="csg-home-data-grid">
            {loading ? (
              <HomeLoading />
            ) : announcements.length ? (
              announcements.map((item) => (
                <AnnouncementCard key={item.id} item={item} />
              ))
            ) : (
              <div className="csg-home-empty">
                No announcements have been published yet.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* EVENTS */}
      <section
        className="container csg-home-events"
        style={{ color: "#172b4d" }}
      >
        <div className="csg-home-heading csg-home-heading-row">
          <div>
            <span
              className="csg-home-eyebrow"
              style={{ color: "#3268a8" }}
            >
              CAMPUS ACTIVITIES
            </span>
            <h2 style={{ color: "#15365f" }}>Upcoming events</h2>
            <p style={{ color: "#60748f" }}>
              Explore activities and opportunities to participate.
            </p>
          </div>

          <Link
            to="/events"
            className="csg-home-view-all"
            style={{ color: "#205a9c" }}
          >
            View all <ArrowRight size={16} />
          </Link>
        </div>

        <div className="csg-home-data-grid">
          {loading ? (
            <HomeLoading />
          ) : events.length ? (
            events.map((item) => <EventCard key={item.id} item={item} />)
          ) : (
            <div className="csg-home-empty">
              There are no upcoming events at the moment.
            </div>
          )}
        </div>
      </section>

      {/* FEEDBACK BANNER */}
      <section
        className="container csg-home-feedback-wrap"
        style={{ color: "#172b4d" }}
      >
        <div
          className="csg-home-feedback"
          style={{
            backgroundColor: "#eaf3ff",
            border: "1px solid #d2e4fb",
            borderRadius: "16px",
          }}
        >
          <div
            className="csg-home-feedback-icon"
            style={{
              backgroundColor: "#d5e8ff",
              color: "#205a9c",
            }}
          >
            <MessageCircle size={27} />
          </div>

          <div className="csg-home-feedback-text">
            <span
              className="csg-home-eyebrow"
              style={{ color: "#3268a8" }}
            >
              YOUR VOICE MATTERS
            </span>
            <h2 style={{ color: "#15365f" }}>Help shape student life</h2>
            <p style={{ color: "#526b89" }}>
              Share your feedback and suggestions with the Central Student
              Government. Your perspective helps us understand student needs.
            </p>
          </div>

          <Link
            to="/feedback"
            className="csg-home-feedback-button"
            style={{
              backgroundColor: "#174b89",
              color: "#ffffff",
              borderRadius: "8px",
            }}
          >
            Send feedback <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}

function HomeLoading() {
  return (
    <>
      {[1, 2, 3].map((item) => (
        <div className="csg-home-skeleton" key={item}>
          <div />
          <span />
          <span />
          <span />
        </div>
      ))}
    </>
  );
}