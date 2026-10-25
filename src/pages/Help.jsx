import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Headset,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

const icons = {
  mail: Mail,
  phone: Phone,
  map: MapPin,
  info: MessageCircle,
};

function getContactHref(item) {
  const value = String(item.value || "").trim();

  if (!value) return null;

  const icon = String(item.icon || "").toLowerCase();

  if (icon === "mail") {
    return `mailto:${value}`;
  }

  if (icon === "phone") {
    return `tel:${value.replace(/[^\d+]/g, "")}`;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return null;
}

export default function Help() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadContacts();
  }, []);

  async function loadContacts() {
    setLoading(true);
    setError("");

    try {
      const { data, error: queryError } = await supabase
        .from("contacts")
        .select("*")
        .eq("is_published", true)
        .order("sort_order", { ascending: true });

      if (queryError) {
        console.error("Contacts error:", queryError);
        throw queryError;
      }

      setItems(data || []);
    } catch (err) {
      console.error("Unable to load contacts:", err);
      setError("Unable to load contact information right now.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container page csg-help-page">
      {/* Hero */}
      <header className="csg-help-hero">
        <div className="csg-help-hero-content">
          <span className="csg-help-eyebrow">
            <Headset size={15} />
            STUDENT SUPPORT
          </span>

          <h1>
            Student Help
            <span> Desk</span>
          </h1>

          <p>
            Need assistance? Find the right contact or office for your
            concern. The LCC Central Student Government is here to help
            you find the information you need.
          </p>

          <a
            className="csg-help-hero-link"
            href="#help-contacts"
          >
            Find contact information
            <ArrowRight size={17} />
          </a>

          <div className="csg-help-trust">
            <ShieldCheck size={17} />
            Official student assistance resources
          </div>
        </div>

        <div className="csg-help-hero-art" aria-hidden="true">
          <div className="csg-help-art-circle csg-help-art-circle-one" />
          <div className="csg-help-art-circle csg-help-art-circle-two" />

          <div className="csg-help-art-card">
            <div className="csg-help-art-icon">
              <MessageCircle size={38} />
            </div>

            <div className="csg-help-art-lines">
              <span />
              <span />
              <span />
            </div>

            <div className="csg-help-art-badge">
              <CheckMark />
              Here to help
            </div>
          </div>

          <div className="csg-help-floating-icon csg-help-floating-mail">
            <Mail size={22} />
          </div>

          <div className="csg-help-floating-icon csg-help-floating-phone">
            <Phone size={22} />
          </div>
        </div>
      </header>

      {/* Contact information */}
      <section
        className="csg-help-contacts-section"
        id="help-contacts"
      >
        <div className="csg-help-section-heading">
          <div>
            <span className="csg-help-section-label">
              GET IN TOUCH
            </span>

            <h2>How can we help you?</h2>

            <p>
              Browse the available contact details and choose the
              appropriate channel for your concern.
            </p>
          </div>

          <button
            type="button"
            className="csg-help-refresh"
            onClick={loadContacts}
            disabled={loading}
            aria-label="Refresh contact information"
            title="Refresh contact information"
          >
            <RefreshCw
              size={17}
              className={loading ? "csg-help-spinning" : ""}
            />
            Refresh
          </button>
        </div>

        <div className="csg-help-grid">
          {loading && (
            <div className="csg-help-state csg-help-state-loading">
              <span className="csg-help-loader" />
              <div>
                <strong>Loading contact information</strong>
                <p>Please wait while we retrieve the latest details.</p>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="csg-help-state csg-help-state-error">
              <div className="csg-help-state-icon">
                <AlertCircle size={23} />
              </div>

              <div className="csg-help-state-content">
                <h3>Unable to load contacts</h3>
                <p>{error}</p>

                <button
                  type="button"
                  className="csg-help-action-button"
                  onClick={loadContacts}
                >
                  <RefreshCw size={16} />
                  Try again
                </button>
              </div>
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="csg-help-state csg-help-state-empty">
              <div className="csg-help-state-icon">
                <MessageCircle size={25} />
              </div>

              <div className="csg-help-state-content">
                <h3>No contacts published yet</h3>
                <p>
                  Contact information will appear here once it has been
                  published through the CSG admin dashboard.
                </p>
              </div>
            </div>
          )}

          {!loading &&
            !error &&
            items.map((item) => {
              const Icon = icons[item.icon] || MessageCircle;
              const href = getContactHref(item);
              const isExternal =
                href && /^https?:\/\//i.test(href);

              return (
                <article
                  className="csg-help-card"
                  key={item.id}
                >
                  <div className="csg-help-card-top">
                    <div className="csg-help-card-icon">
                      <Icon size={24} />
                    </div>

                    {item.label && (
                      <span className="csg-help-card-label">
                        {item.label}
                      </span>
                    )}
                  </div>

                  <div className="csg-help-card-content">
                    <h3>{item.value}</h3>

                    {item.description && (
                      <p>{item.description}</p>
                    )}
                  </div>

                  {href && (
                    <a
                      className="csg-help-card-link"
                      href={href}
                      target={isExternal ? "_blank" : undefined}
                      rel={
                        isExternal
                          ? "noopener noreferrer"
                          : undefined
                      }
                    >
                      {item.icon === "mail"
                        ? "Send an email"
                        : item.icon === "phone"
                          ? "Call this number"
                          : "Open resource"}

                      <ArrowRight size={16} />
                    </a>
                  )}
                </article>
              );
            })}
        </div>
      </section>

      {/* Feedback callout */}
      <section className="csg-help-feedback">
        <div className="csg-help-feedback-icon">
          <MessageCircle size={27} />
        </div>

        <div className="csg-help-feedback-content">
          <span className="csg-help-section-label">
            YOUR VOICE MATTERS
          </span>

          <h2>Have a suggestion or concern?</h2>

          <p>
            Help us improve the student experience. Share your
            suggestions, report concerns, or send feedback directly
            through the CSG portal.
          </p>
        </div>

        <a
          href="/feedback"
          className="csg-help-feedback-button"
        >
          Go to Student Feedback
          <ArrowRight size={17} />
        </a>
      </section>

      {/* Footer note */}
      <footer className="csg-help-footer-note">
        <ShieldCheck size={18} />

        <p>
          Contact information displayed on this page is managed by the
          CSG. For official assistance, use the contact details provided
          above or submit your concern through Student Feedback.
        </p>
      </footer>
    </main>
  );
}

function CheckMark() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}