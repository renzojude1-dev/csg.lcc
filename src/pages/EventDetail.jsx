import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  avgRating,
  browserToken,
  formatDateTime,
} from "../lib/helpers";
import StarRating from "../components/StarRating";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Send,
  CheckCircle2,
  Star,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

export default function EventDetail() {
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");

  const [sent, setSent] = useState(false);
  const [interested, setInterested] = useState(false);
  const [interestCount, setInterestCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [interestLoading, setInterestLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadEvent() {
    if (!id) {
      setError("Event not found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = browserToken();

      const [
        eventResult,
        reviewsResult,
        interestCountResult,
        userInterestResult,
      ] = await Promise.all([
        supabase
          .from("events")
          .select("*")
          .eq("id", id)
          .eq("is_published", true)
          .single(),

        supabase
          .from("event_reviews")
          .select("*")
          .eq("event_id", id)
          .eq("is_visible", true)
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("event_interest")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("event_id", id),

        supabase
          .from("event_interest")
          .select("id")
          .eq("event_id", id)
          .eq("browser_token", token)
          .maybeSingle(),
      ]);

      if (eventResult.error) {
        throw new Error(
          eventResult.error.message ||
            "Unable to load this event."
        );
      }

      if (reviewsResult.error) {
        console.error(
          "Reviews error:",
          reviewsResult.error
        );
      }

      if (interestCountResult.error) {
        console.error(
          "Interest count error:",
          interestCountResult.error
        );
      }

      if (userInterestResult.error) {
        console.error(
          "User interest error:",
          userInterestResult.error
        );
      }

      setEvent(eventResult.data);
      setReviews(reviewsResult.data || []);
      setInterestCount(
        interestCountResult.count || 0
      );
      setInterested(!!userInterestResult.data);
    } catch (err) {
      console.error("Event detail error:", err);

      setEvent(null);
      setReviews([]);
      setError(
        err?.message ||
          "Unable to load this event right now."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvent();
  }, [id]);

  const average = useMemo(() => {
    return avgRating(reviews);
  }, [reviews]);

  async function submitReview(eventObject) {
    eventObject.preventDefault();

    if (submitting) {
      return;
    }

    const trimmedComment = comment.trim();
    const trimmedName = name.trim();

    if (!trimmedComment) {
      return;
    }

    setSubmitting(true);
    setSent(false);
    setError("");

    try {
      const token = browserToken();

      const { data: existingReview, error: existingError } =
        await supabase
          .from("event_reviews")
          .select("id")
          .eq("event_id", id)
          .eq("browser_token", token)
          .maybeSingle();

      if (existingError) {
        throw new Error(existingError.message);
      }

      if (existingReview) {
        setSent(true);
        setError(
          "You have already submitted a review for this event."
        );
        return;
      }

      const { error: insertError } = await supabase
        .from("event_reviews")
        .insert({
          event_id: id,
          display_name:
            trimmedName || "Anonymous Student",
          rating,
          comment: trimmedComment,
          browser_token: token,
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      setSent(true);
      setComment("");
      setName("");

      await loadEvent();
    } catch (err) {
      console.error(
        "Review submission error:",
        err
      );

      setError(
        err?.message ||
          "Unable to submit your review right now."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function markInterested() {
    if (interested || interestLoading) {
      return;
    }

    setInterestLoading(true);
    setError("");

    try {
      const token = browserToken();

      const { data: existingInterest, error: checkError } =
        await supabase
          .from("event_interest")
          .select("id")
          .eq("event_id", id)
          .eq("browser_token", token)
          .maybeSingle();

      if (checkError) {
        throw new Error(checkError.message);
      }

      if (existingInterest) {
        setInterested(true);
        return;
      }

      const { error: insertError } = await supabase
        .from("event_interest")
        .insert({
          event_id: id,
          browser_token: token,
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      setInterested(true);
      setInterestCount((current) => current + 1);
    } catch (err) {
      console.error(
        "Event interest error:",
        err
      );

      setError(
        err?.message ||
          "Unable to mark your interest right now."
      );
    } finally {
      setInterestLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="container page">
        <div className="empty">
          Loading event...
        </div>
      </section>
    );
  }

  if (!event) {
    return (
      <section className="container page">
        <Link
          className="back-link"
          to="/events"
        >
          <ArrowLeft size={16} />
          Back to events
        </Link>

        <div className="empty">
          <AlertCircle size={20} />

          <p>
            {error || "This event could not be found."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="container page narrow">
      <Link
        className="back-link"
        to="/events"
      >
        <ArrowLeft size={16} />
        Back to events
      </Link>

      {event.poster_url && (
        <img
          className="detail-image poster-detail"
          src={event.poster_url}
          alt={`${event.title} poster`}
        />
      )}

      <span className="eyebrow">
        EVENT
      </span>

      <h1>{event.title}</h1>

      <div className="event-detail-meta">
        {event.starts_at && (
          <span>
            <CalendarDays size={17} />

            {formatDateTime(event.starts_at)}

            {event.ends_at
              ? ` — ${formatDateTime(event.ends_at)}`
              : ""}
          </span>
        )}

        {event.location && (
          <span>
            <MapPin size={17} />
            {event.location}
          </span>
        )}

        {event.organizer && (
          <span>
            Organized by {event.organizer}
          </span>
        )}
      </div>

      {event.description && (
        <div className="prose">
          {event.description
            .split("\n")
            .map((paragraph, index) => (
              <p key={index}>
                {paragraph}
              </p>
            ))}
        </div>
      )}

      {event.registration_url && (
        <a
          className="btn secondary"
          href={event.registration_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink size={16} />
          Event information / registration
        </a>
      )}

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <div className="interest-box">
        <div>
          <strong>
            Are you interested in this event?
          </strong>

          <small>
            {interestCount} student
            {interestCount === 1 ? "" : "s"} marked
            interest.
          </small>
        </div>

        <button
          type="button"
          className="btn primary"
          onClick={markInterested}
          disabled={
            interested || interestLoading
          }
        >
          {interested ? (
            <>
              <CheckCircle2 size={17} />
              Interested
            </>
          ) : interestLoading ? (
            "Saving..."
          ) : (
            "I'm Interested"
          )}
        </button>
      </div>

      <section className="review-section">
        <div className="review-summary">
          <div>
            <span className="big-rating">
              {average
                ? average.toFixed(1)
                : "—"}
            </span>

            <div className="gold-stars">
              <span
                className="rating-stars"
                aria-label={`${average.toFixed(
                  1
                )} out of 5`}
              >
                {[1, 2, 3, 4, 5].map(
                  (star) => (
                    <Star
                      key={star}
                      size={17}
                      fill={
                        star <=
                        Math.round(average)
                          ? "currentColor"
                          : "none"
                      }
                    />
                  )
                )}
              </span>
            </div>

            <small>
              {reviews.length} review
              {reviews.length === 1
                ? ""
                : "s"}
            </small>
          </div>

          <div>
            <h2>
              Student feedback
            </h2>

            <p>
              Share how the event went for you.
            </p>
          </div>
        </div>

        <form
          className="review-form"
          onSubmit={submitReview}
        >
          <label>
            Your rating

            <StarRating
              value={rating}
              onChange={setRating}
            />
          </label>

          <label>
            Name (optional)

            <input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Anonymous Student"
            />
          </label>

          <label>
            Comment

            <textarea
              value={comment}
              onChange={(event) =>
                setComment(event.target.value)
              }
              required
              maxLength={2000}
              placeholder="Tell other students about your experience..."
            />
          </label>

          <button
            className="btn primary"
            type="submit"
            disabled={submitting}
          >
            <Send size={16} />

            {submitting
              ? "Submitting..."
              : "Submit review"}
          </button>

          {sent && (
            <span className="success">
              Thanks! Your feedback was submitted.
            </span>
          )}
        </form>

        <div className="reviews">
          {reviews.length === 0 && (
            <div className="empty">
              No reviews yet. Be the first student
              to share your experience.
            </div>
          )}

          {reviews.map((review) => (
            <article
              className="review"
              key={review.id}
            >
              <div className="review-top">
                <strong>
                  {review.display_name ||
                    "Anonymous Student"}
                </strong>

                <span className="gold-stars">
                  <span
                    className="rating-stars"
                    aria-label={`${review.rating} out of 5`}
                  >
                    {[1, 2, 3, 4, 5].map(
                      (star) => (
                        <Star
                          key={star}
                          size={15}
                          fill={
                            star <=
                            review.rating
                              ? "currentColor"
                              : "none"
                          }
                        />
                      )
                    )}
                  </span>
                </span>
              </div>

              <p>{review.comment}</p>

              <small>
                {review.created_at
                  ? new Date(
                      review.created_at
                    ).toLocaleDateString(
                      "en-PH",
                      {
                        dateStyle: "medium",
                      }
                    )
                  : ""}
              </small>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}