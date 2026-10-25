
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
        const [
          featuredResult,
          announcementResult,
          eventResult,
        ] = await Promise.all([
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

  // Automatically rotate featured announcements.
  useEffect(() => {
    if (featured.length <= 1) return;

    const timer = setInterval(() => {
      setActiveSlide((current) => (current + 1) % featured.length);
    }, 5000);

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

    navigate(
      term ? `/search?q=${encodeURIComponent(term)}` : "/search"
    );
  }

  const currentSlide = featured[activeSlide];

  return (
    <main className="csg-home">
      {/* FEATURED ANNOUNCEMENTS */}

      <section className="csg-featured">
        {currentSlide ? (
          <div
            className="csg-featured-slide"
            key={currentSlide.id}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {currentSlide.image_url && (
              <div
                className="csg-featured-image"
                style={{
                  backgroundImage: `url("${currentSlide.image_url}")`,
                }}
                aria-hidden="true"
              />
            )}

            <div className="csg-featured-overlay" />

            <div className="container csg-featured-inner">
              <div className="csg-featured-content">
                <div className="csg-featured-label">
                  <Megaphone size={15} />
                  <span>FEATURED ANNOUNCEMENT</span>
                </div>

                <h1>
                  {currentSlide.title || "Campus Announcement"}
                </h1>

                <p className="csg-featured-description">
                  {currentSlide.excerpt ||
                    currentSlide.summary ||
                    currentSlide.body
                      ?.replace(/<[^>]*>/g, "")
                      .slice(0, 220) ||
                    "Stay informed with the latest updates from the Central Student Government."}
                </p>

                <div className="csg-featured-meta">
                  <span>
                    <ShieldCheck size={15} />
                    LCC Central Student Government
                  </span>

                  {currentSlide.published_at && (
                    <span>
                      <Clock3 size={15} />
                      {new Date(
                        currentSlide.published_at
                      ).toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>

                <Link
                  to={`/announcements/${currentSlide.id}`}
                  className="csg-featured-button"
                >
                  Read announcement
                  <ArrowRight size={17} />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="csg-featured-slide csg-featured-placeholder">
            <div className="csg-featured-overlay" />

            <div className="container csg-featured-inner">
              <div className="csg-featured-content">
                <div className="csg-featured-label">
                  <Megaphone size={15} />
                  <span>CENTRAL STUDENT GOVERNMENT</span>
                </div>

                <h1>Stay informed. Stay involved.</h1>

                <p className="csg-featured-description">
                  Official announcements, student activities, and
                  important updates from Lipa City Colleges.
                </p>

                <Link
                  to="/announcements"
                  className="csg-featured-button"
                >
                  View announcements
                  <ArrowRight size={17} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* CAROUSEL CONTROLS */}

        {featured.length > 0 && (
          <div className="container csg-carousel-controls">
            <div
              className="csg-carousel-dots"
              aria-label={`Announcement ${activeSlide + 1} of ${featured.length}`}
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
                  aria-current={
                    index === activeSlide ? "true" : undefined
                  }
                  disabled={featured.length <= 1}
                />
              ))}
            </div>

            {featured.length > 1 && (
              <div className="csg-carousel-arrows">
                <button
                  type="button"
                  onClick={showPrevious}
                  aria-label="Previous announcement"
                  className="csg-carousel-arrow"
                >
                  <ArrowLeft size={18} />
                </button>

                <button
                  type="button"
                  onClick={showNext}
                  aria-label="Next announcement"
                  className="csg-carousel-arrow"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* SEARCH BAR */}

      <section className="container csg-home-search-section">
        <form className="csg-home-search" onSubmit={handleSearch}>
          <Search size={20} className="csg-search-icon" />

          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search announcements, events, resources..."
            aria-label="Search website"
          />

          <button type="submit" className="csg-search-button">
            Search
            <ArrowRight size={16} />
          </button>
        </form>
      </section>

      {/* QUICK LINKS */}

      <section className="container csg-home-quick">
        <div className="csg-home-heading">
          <span className="csg-home-eyebrow">
            EXPLORE THE PORTAL
          </span>

          <h2>How can we help you?</h2>

          <p>
            Quick access to the CSG's important pages and services.
          </p>
        </div>

        <div className="csg-home-quick-grid">
          {quickLinks.map(
            ({ title, description, path, icon: Icon }) => (
              <Link
                to={path}
                className="csg-home-quick-card"
                key={title}
              >
                <span className="csg-home-quick-icon">
                  <Icon size={23} />
                </span>

                <h3>{title}</h3>

                <p>{description}</p>

                <span className="csg-home-quick-open">
                  Explore
                  <ChevronRight size={16} />
                </span>
              </Link>
            )
          )}
        </div>
      </section>

      {/* LATEST ANNOUNCEMENTS */}

      <section className="csg-home-announcements">
        <div className="container">
          <div className="csg-home-heading csg-home-heading-row">
            <div>
              <span className="csg-home-eyebrow">
                CAMPUS UPDATES
              </span>

              <h2>Latest announcements</h2>

              <p>
                Stay up to date with recent notices from the CSG.
              </p>
            </div>

            <Link
              to="/announcements"
              className="csg-home-view-all"
            >
              View all
              <ArrowRight size={16} />
            </Link>
          </div>

          {error && (
            <div className="csg-home-error" role="alert">
              {error}
            </div>
          )}

          <div className="csg-home-data-grid">
            {loading ? (
              <HomeLoading />
            ) : announcements.length > 0 ? (
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

      {/* UPCOMING EVENTS */}

      <section className="container csg-home-events">
        <div className="csg-home-heading csg-home-heading-row">
          <div>
            <span className="csg-home-eyebrow">
              CAMPUS ACTIVITIES
            </span>

            <h2>Upcoming events</h2>

            <p>
              Explore activities and opportunities to participate.
            </p>
          </div>

          <Link to="/events" className="csg-home-view-all">
            View all
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="csg-home-data-grid">
          {loading ? (
            <HomeLoading />
          ) : events.length > 0 ? (
            events.map((item) => (
              <EventCard key={item.id} item={item} />
            ))
          ) : (
            <div className="csg-home-empty">
              There are no upcoming events at the moment.
            </div>
          )}
        </div>
      </section>

      {/* STUDENT FEEDBACK */}

      <section className="container csg-home-feedback-wrap">
        <div className="csg-home-feedback">
          <div className="csg-home-feedback-icon">
            <MessageCircle size={27} />
          </div>

          <div className="csg-home-feedback-text">
            <span className="csg-home-eyebrow">
              YOUR VOICE MATTERS
            </span>

            <h2>Help shape student life</h2>

            <p>
              Share your feedback and suggestions with the Central
              Student Government. Your perspective helps us understand
              student needs.
            </p>
          </div>

          <Link
            to="/feedback"
            className="csg-home-feedback-button"
          >
            Send feedback
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
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
