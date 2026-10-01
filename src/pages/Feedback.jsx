
import { useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Send,
  ShieldCheck,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  HelpCircle,
  Heart,
  MoreHorizontal,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  ArrowRight,
  ClipboardCheck,
  Search,
  RefreshCw,
} from "lucide-react";

const categories = [
  { value: "Report", label: "Report an Issue", description: "Report a problem.", icon: AlertTriangle },
  { value: "Sumbong", label: "Concern", description: "Raise a student concern.", icon: MessageSquare },
  { value: "Suggestion", label: "Suggestion", description: "Share an idea.", icon: Lightbulb },
  { value: "Question", label: "Question", description: "Ask the CSG.", icon: HelpCircle },
  { value: "Compliment", label: "Compliment", description: "Recognize good work.", icon: Heart },
  { value: "Other", label: "Other", description: "Other feedback.", icon: MoreHorizontal },
];

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const MAX_MESSAGE_LENGTH = 5000;
const MAX_SUBJECT_LENGTH = 160;

const initialForm = {
  category: "Sumbong",
  subject: "",
  message: "",
  name: "",
  contact: "",
};

function formatFileSize(bytes) {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function generateToken() {
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

async function hashToken(token) {
  const bytes = new TextEncoder().encode(token);
  const digest = await window.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

function StatusPill({ status }) {
  const safeStatus = status || "New";
  const className = String(safeStatus).toLowerCase().replace(/\s+/g, "-");

  return (
    <span className={`status-badge status-${className}`}>
      {safeStatus}
    </span>
  );
}

export default function Feedback() {
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const [trackingCode, setTrackingCode] = useState("");
  const [tracking, setTracking] = useState(false);
  const [trackingError, setTrackingError] = useState("");
  const [trackedFeedback, setTrackedFeedback] = useState(null);
  const [savingResolution, setSavingResolution] = useState(false);

  const fileInputRef = useRef(null);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    if (error) setError("");
  }

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0] || null;
    setError("");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setError("File must be 15 MB or smaller.");
      event.target.value = "";
      return;
    }

    const allowedExtensions = /\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|xls|xlsx|txt)$/i;

    if (!allowedExtensions.test(selectedFile.name)) {
      setFile(null);
      setError("Unsupported file type. Please choose an image, PDF, Word, Excel, or text file.");
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
  }

  function removeFile() {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function resetForm() {
    setForm({ ...initialForm });
    setFile(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function submit(event) {
    event.preventDefault();
    if (sending) return;

    const subject = form.subject.trim();
    const message = form.message.trim();
    const name = form.name.trim();
    const contact = form.contact.trim();

    if (!subject) {
      setError("Please enter a subject.");
      return;
    }

    if (!message || message.length < 5) {
      setError("Please enter a message of at least 5 characters.");
      return;
    }

    if (subject.length > MAX_SUBJECT_LENGTH) {
      setError(`Subject must not exceed ${MAX_SUBJECT_LENGTH} characters.`);
      return;
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      setError(`Message must not exceed ${MAX_MESSAGE_LENGTH} characters.`);
      return;
    }

    if (!window.crypto?.subtle || !window.crypto?.getRandomValues) {
      setError("Secure tracking is not supported by this browser. Please use an updated browser over HTTPS.");
      return;
    }

    setSending(true);
    setError("");

    let attachmentUrl = null;
    let attachmentName = null;

    try {
      if (file) {
        const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const uniqueId = generateToken();
        const filePath = `feedback/${uniqueId}-${safeFileName}`;

        const { error: uploadError } = await supabase.storage
          .from("csg-files")
          .upload(filePath, file);

        if (uploadError) {
          throw new Error("Attachment upload failed. Please try again.");
        }

        const { data: publicUrlData } = supabase.storage
          .from("csg-files")
          .getPublicUrl(filePath);

        attachmentUrl = publicUrlData?.publicUrl || null;
        attachmentName = file.name;

        if (!attachmentUrl) {
          throw new Error("Could not generate the attachment URL.");
        }
      }

      const token = generateToken();
      const tokenHash = await hashToken(token);

      const { data: referenceCode, error: databaseError } =
        await supabase.rpc("submit_student_feedback", {
          p_category: form.category,
          p_subject: subject,
          p_message: message,
          p_name: name || null,
          p_contact: contact || null,
          p_attachment_url: attachmentUrl,
          p_attachment_name: attachmentName,
          p_tracking_token_hash: tokenHash,
        });

      if (databaseError) {
        console.error("Feedback RPC error:", databaseError);
        throw new Error("Feedback could not be submitted. Please try again.");
      }

      if (!referenceCode) {
        throw new Error("Submission received, but no reference code was returned. Please contact the CSG.");
      }

      setResult({
        referenceCode,
        trackingCode: `${referenceCode}.${token}`,
      });
      resetForm();
    } catch (err) {
      console.error("Feedback submission error:", err);
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  async function checkTracking(event) {
    event.preventDefault();
    if (tracking) return;

    setTracking(true);
    setTrackingError("");
    setTrackedFeedback(null);

    try {
      if (!window.crypto?.subtle) {
        throw new Error("Secure tracking is not supported by this browser.");
      }

      const enteredCode = trackingCode.trim();
      const separator = enteredCode.lastIndexOf(".");
      if (separator < 0) {
        throw new Error("Enter the complete tracking code you received after submitting feedback.");
      }

      const referenceCode = enteredCode.slice(0, separator).trim().toUpperCase();
      const token = enteredCode.slice(separator + 1).trim().toLowerCase();

      if (!/^CSG-[A-F0-9]{8}$/.test(referenceCode) || !/^[a-f0-9]{64}$/.test(token)) {
        throw new Error("The tracking code format is invalid. Check the code and try again.");
      }

      const tokenHash = await hashToken(token);

      const { data, error: lookupError } = await supabase.rpc(
        "get_student_feedback",
        {
          p_reference_code: referenceCode,
          p_tracking_token_hash: tokenHash,
        }
      );

      if (lookupError) {
        console.error("Feedback lookup error:", lookupError);
        throw new Error("Unable to check feedback right now. Please try again.");
      }

      if (!data?.length) {
        throw new Error("No matching feedback was found. Check that you entered the full tracking code correctly.");
      }

      setTrackedFeedback(data[0]);
    } catch (err) {
      setTrackingError(err?.message || "Unable to find this feedback.");
    } finally {
      setTracking(false);
    }
  }

  async function updateResolution(resolution) {
    if (!trackedFeedback || savingResolution) return;

    const separator = trackingCode.trim().lastIndexOf(".");
    const referenceCode = trackingCode.trim().slice(0, separator).trim().toUpperCase();
    const token = trackingCode.trim().slice(separator + 1).trim().toLowerCase();

    setSavingResolution(true);
    setTrackingError("");

    try {
      const tokenHash = await hashToken(token);

      const { error: updateError } = await supabase.rpc(
        "set_student_feedback_resolution",
        {
          p_reference_code: referenceCode,
          p_tracking_token_hash: tokenHash,
          p_resolution: resolution,
        }
      );

      if (updateError) {
        console.error("Resolution update error:", updateError);
        throw new Error("Your response could not be saved. Please try again.");
      }

      setTrackedFeedback((current) => ({
        ...current,
        student_resolution: resolution,
      }));
    } catch (err) {
      setTrackingError(err?.message || "Unable to save your response.");
    } finally {
      setSavingResolution(false);
    }
  }

  function sendAnotherMessage() {
    setResult(null);
    resetForm();
  }

  if (result) {
    return (
      <main className="container page csg-feedback-page">
        <section className="csg-feedback-success">
          <div className="csg-feedback-success-icon">
            <CheckCircle2 size={46} />
          </div>
          <span className="csg-feedback-eyebrow">
            <ShieldCheck size={15} />
            SUBMISSION CONFIRMED
          </span>
          <h1>Thank you for your feedback!</h1>
          <p className="csg-feedback-success-description">
            Your message has been submitted to the LCC Central Student Government.
          </p>
          <div className="csg-feedback-reference">
            <span className="csg-feedback-reference-label">
              <ClipboardCheck size={17} />
              REFERENCE CODE
            </span>
            <strong>{result.referenceCode}</strong>
            <p>Keep your complete tracking code private to check your submission.</p>
            <span className="csg-feedback-reference-label">PRIVATE TRACKING CODE</span>
            <strong className="csg-feedback-tracking-code">{result.trackingCode}</strong>
            <p>Copy and save this code. It will not be shown again.</p>
            <button
              type="button"
              className="csg-feedback-secondary-button"
              onClick={() => navigator.clipboard?.writeText(result.trackingCode)}
            >
              <ClipboardCheck size={16} /> Copy tracking code
            </button>
          </div>
          <button
            type="button"
            className="csg-feedback-primary-button"
            onClick={sendAnotherMessage}
          >
            Send another message <ArrowRight size={17} />
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="container page csg-feedback-page">
      <header className="csg-feedback-header">
        <div className="csg-feedback-header-content">
          <span className="csg-feedback-eyebrow">
            <MessageSquare size={15} />
            STUDENT FEEDBACK
          </span>
          <h1>Your voice matters.</h1>
          <p>Share your concerns, ideas, and suggestions with the CSG.</p>
          <div className="csg-feedback-header-points">
            <span><ShieldCheck size={17} /> No account required</span>
          </div>
        </div>
        <div className="csg-feedback-header-visual" aria-hidden="true">
          <div className="csg-feedback-visual-circle"><MessageSquare size={48} /></div>
          <div className="csg-feedback-visual-small"><Heart size={20} /></div>
        </div>
      </header>

      <section className="csg-feedback-track">
        <div className="csg-feedback-section-heading">
          <div className="csg-feedback-step"><Search size={17} /></div>
          <div>
            <h2>Track your feedback</h2>
            <p>Enter the complete private tracking code you received after submitting.</p>
          </div>
        </div>

        <form className="csg-feedback-track-form" onSubmit={checkTracking}>
          <label className="csg-feedback-field">
            <span>Tracking code</span>
            <input
              type="text"
              value={trackingCode}
              onChange={(event) => {
                setTrackingCode(event.target.value);
                setTrackingError("");
                setTrackedFeedback(null);
              }}
              placeholder="CSG-XXXXXXXX.your-private-token"
              autoComplete="off"
              required
            />
          </label>
          <button
            type="submit"
            className="csg-feedback-primary-button"
            disabled={tracking || !trackingCode.trim()}
          >
            {tracking ? <><RefreshCw className="csg-feedback-spin" size={17} /> Checking...</> : <><Search size={17} /> Check status</>}
          </button>
        </form>

        {trackingError && (
          <div className="csg-feedback-error" role="alert">
            <AlertTriangle size={19} /><p>{trackingError}</p>
            <button type="button" onClick={() => setTrackingError("")} aria-label="Dismiss error"><X size={17} /></button>
          </div>
        )}

        {trackedFeedback && (
          <article className="csg-feedback-tracked-result">
            <div className="csg-feedback-tracked-head">
              <div>
                <span className="csg-feedback-eyebrow">FEEDBACK DETAILS</span>
                <h3>{trackedFeedback.subject}</h3>
                <p>{trackedFeedback.reference_code} · {trackedFeedback.category}</p>
              </div>
              <StatusPill status={trackedFeedback.status} />
            </div>

            <div className="csg-feedback-tracked-message">
              <strong>Your message</strong>
              <p>{trackedFeedback.message}</p>
            </div>

            <div className="csg-feedback-reply">
              <strong>Official CSG reply</strong>
              {trackedFeedback.admin_reply?.trim() ? (
                <>
                  <p>{trackedFeedback.admin_reply}</p>
                  {trackedFeedback.responded_at && (
                    <small>Response recorded: {new Date(trackedFeedback.responded_at).toLocaleString()}</small>
                  )}
                </>
              ) : (
                <p>The CSG has not posted a reply yet. Please check again later.</p>
              )}
            </div>

            <div className="csg-feedback-resolution">
              <strong>Has your concern been resolved?</strong>
              <p>Please update the CSG so they know whether further assistance is needed.</p>
              <div className="csg-feedback-resolution-actions">
                <button
                  type="button"
                  className={trackedFeedback.student_resolution === "Resolved" ? "csg-feedback-resolution-button selected" : "csg-feedback-resolution-button"}
                  disabled={savingResolution}
                  onClick={() => updateResolution("Resolved")}
                >
                  <CheckCircle2 size={17} /> Resolved
                </button>
                <button
                  type="button"
                  className={trackedFeedback.student_resolution === "Not yet resolved" ? "csg-feedback-resolution-button selected" : "csg-feedback-resolution-button"}
                  disabled={savingResolution}
                  onClick={() => updateResolution("Not yet resolved")}
                >
                  <MessageSquare size={17} /> Not yet resolved
                </button>
              </div>
              <small>
                Current response: {trackedFeedback.student_resolution || "Not yet confirmed"}
                {savingResolution ? " · Saving..." : ""}
              </small>
            </div>
          </article>
        )}
      </section>

      <div className="csg-feedback-layout">
        <div className="csg-feedback-main">
          <form className="csg-feedback-form" onSubmit={submit} noValidate>
            <section className="csg-feedback-section">
              <div className="csg-feedback-section-heading">
                <div className="csg-feedback-step">01</div>
                <div><h2>Feedback category</h2><p>Choose one category.</p></div>
              </div>
              <div className="csg-feedback-category-grid">
                {categories.map(({ value, label, description, icon: Icon }) => {
                  const selected = form.category === value;
                  return (
                    <button
                      type="button"
                      key={value}
                      className={`csg-feedback-category ${selected ? "selected" : ""}`}
                      onClick={() => updateField("category", value)}
                      aria-pressed={selected}
                    >
                      <span className="csg-feedback-category-icon"><Icon size={21} /></span>
                      <span className="csg-feedback-category-text"><strong>{label}</strong><small>{description}</small></span>
                      <span className="csg-feedback-category-check">{selected && <CheckCircle2 size={19} />}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="csg-feedback-divider" />

            <section className="csg-feedback-section">
              <div className="csg-feedback-section-heading">
                <div className="csg-feedback-step">02</div>
                <div><h2>Your message</h2><p>Fields marked * are required.</p></div>
              </div>
              <div className="csg-feedback-fields">
                <label className="csg-feedback-field">
                  <span>Subject <b>*</b></span>
                  <input type="text" required maxLength={MAX_SUBJECT_LENGTH} value={form.subject} onChange={(event) => updateField("subject", event.target.value)} placeholder="Enter a short subject" />
                  <small className="csg-feedback-field-hint"><span>{form.subject.length}/{MAX_SUBJECT_LENGTH}</span></small>
                </label>
                <label className="csg-feedback-field">
                  <span>Message <b>*</b></span>
                  <textarea required minLength={5} maxLength={MAX_MESSAGE_LENGTH} rows={6} value={form.message} onChange={(event) => updateField("message", event.target.value)} placeholder="Write your feedback here..." />
                  <small className="csg-feedback-field-hint"><span>{form.message.length}/{MAX_MESSAGE_LENGTH}</span></small>
                </label>
              </div>
            </section>

            <div className="csg-feedback-divider" />

            <section className="csg-feedback-section">
              <div className="csg-feedback-section-heading">
                <div className="csg-feedback-step">03</div>
                <div><h2>Contact details</h2><p>Optional. You may leave these blank.</p></div>
              </div>
              <div className="csg-feedback-fields csg-feedback-contact-grid">
                <label className="csg-feedback-field">
                  <span>Name <small>(Optional)</small></span>
                  <input type="text" maxLength={120} value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Your name" autoComplete="name" />
                </label>
                <label className="csg-feedback-field">
                  <span>Contact <small>(Optional)</small></span>
                  <input type="text" maxLength={200} value={form.contact} onChange={(event) => updateField("contact", event.target.value)} placeholder="Email or phone number" />
                </label>
              </div>
            </section>

            <div className="csg-feedback-divider" />

            <section className="csg-feedback-section">
              <div className="csg-feedback-section-heading">
                <div className="csg-feedback-step">04</div>
                <div><h2>Attachment</h2><p>Optional. Maximum file size: 15 MB.</p></div>
              </div>
              <div className="csg-feedback-upload">
                {!file ? (
                  <label className="csg-feedback-upload-area">
                    <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" onChange={handleFileChange} />
                    <span className="csg-feedback-upload-icon"><Paperclip size={23} /></span>
                    <strong>Choose a file</strong>
                    <span>Image, PDF, Word, Excel, or text</span>
                  </label>
                ) : (
                  <div className="csg-feedback-file-preview">
                    <span className="csg-feedback-file-icon">
                      {file.type?.startsWith("image/") ? <ImageIcon size={22} /> : <FileText size={22} />}
                    </span>
                    <div className="csg-feedback-file-info"><strong>{file.name}</strong><small>{formatFileSize(file.size)}</small></div>
                    <button type="button" className="csg-feedback-remove-file" onClick={removeFile} aria-label="Remove attachment" title="Remove attachment"><X size={18} /></button>
                  </div>
                )}
              </div>
            </section>

            {error && (
              <div className="csg-feedback-error" role="alert">
                <AlertTriangle size={19} /><p>{error}</p>
                <button type="button" onClick={() => setError("")} aria-label="Dismiss error"><X size={17} /></button>
              </div>
            )}

            <div className="csg-feedback-submit-area">
              <div className="csg-feedback-privacy">
                <ShieldCheck size={20} />
                <p><strong>Before submitting</strong><span>Avoid including passwords or sensitive personal information.</span></p>
              </div>
              <button type="submit" className="csg-feedback-primary-button" disabled={sending}>
                {sending ? <><span className="csg-feedback-spinner" /> Submitting...</> : <><Send size={18} /> Submit feedback <ArrowRight size={17} /></>}
              </button>
            </div>
          </form>
        </div>

        <aside className="csg-feedback-aside">
          <div className="csg-feedback-aside-card">
            <div className="csg-feedback-aside-icon"><MessageSquare size={24} /></div>
            <h3>Every voice counts.</h3>
            <p>Your feedback helps the CSG understand student needs and improve campus life.</p>
            <div className="csg-feedback-aside-divider" />
            <div className="csg-feedback-aside-footer"><ShieldCheck size={18} /><p>Name and contact details are optional.</p></div>
          </div>
          <div className="csg-feedback-aside-card csg-feedback-process">
            <div className="csg-feedback-aside-icon"><ClipboardCheck size={24} /></div>
            <h3>After submitting</h3>
            <ol>
              <li><span>1</span><div><strong>Save your tracking code</strong><small>Keep it private to check your submission.</small></div></li>
              <li><span>2</span><div><strong>CSG review</strong><small>Your message can be reviewed by authorized CSG personnel.</small></div></li>
              <li><span>3</span><div><strong>Check for a reply</strong><small>Return here to see updates and confirm resolution.</small></div></li>
            </ol>
          </div>
        </aside>
      </div>
    </main>
  );
}