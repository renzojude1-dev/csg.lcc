
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import Brand from "../components/Brand";

import {
  LogOut,
  Plus,
  Trash2,
  Pencil,
  LayoutDashboard,
  Bell,
  CalendarDays,
  Users,
  FileText,
  Phone,
  MessageSquare,
  BarChart3,
  CheckCircle2,
  Paperclip,
  AlertCircle,
  Loader2,
} from "lucide-react";

const tabs = [
  ["dashboard", "Dashboard", LayoutDashboard],
  ["announcements", "Announcements", Bell],
  ["events", "Events", CalendarDays],
  ["officers", "Officers", Users],
  ["resources", "Resources", FileText],
  ["contacts", "Contacts", Phone],
  ["feedback", "Student Messages", MessageSquare],
];

const blankAnnouncement = {
  title: "",
  excerpt: "",
  body: "",
  image_url: "",
  is_featured: false,
  attachment_url: "",
  attachment_name: "",
  published_at: new Date().toISOString(),
  is_published: true,
};

const blankEvent = {
  title: "",
  description: "",
  poster_url: "",
  starts_at: "",
  ends_at: "",
  location: "",
  organizer: "",
  registration_url: "",
  is_published: true,
};

const blankOfficer = {
  name: "",
  position: "",
  course_year: "",
  photo_url: "",
  bio: "",
  sort_order: 0,
  is_current: true,
};

const blankResource = {
  title: "",
  description: "",
  category: "Student Resource",
  file_url: "",
  file_name: "",
  link_url: "",
  sort_order: 0,
  is_published: true,
};

const blankContact = {
  label: "",
  value: "",
  description: "",
  icon: "info",
  sort_order: 0,
  is_published: true,
};

const blankFeedback = {
  category: "Sumbong",
  subject: "",
  message: "",
  name: "",
  contact: "",
  attachment_url: "",
  attachment_name: "",
  status: "New",
  admin_notes: "",
  admin_reply: "",
  student_resolution: "Not yet confirmed",
};

function tableFor(tab) {
  return {
    announcements: "announcements",
    events: "events",
    officers: "officers",
    resources: "resources",
    contacts: "contacts",
    feedback: "student_feedback",
  }[tab];
}

function blankFor(tab) {
  const values = {
    announcements: blankAnnouncement,
    events: blankEvent,
    officers: blankOfficer,
    resources: blankResource,
    contacts: blankContact,
    feedback: blankFeedback,
  };

  return values[tab] ? { ...values[tab] } : {};
}

function singular(tab) {
  return {
    announcements: "announcement",
    events: "event",
    officers: "officer",
    resources: "resource",
    contacts: "contact",
    feedback: "message",
  }[tab] || tab;
}

export default function Admin() {
  const [session, setSession] = useState(null);
  const [authorized, setAuthorized] = useState(false);

  const [tab, setTab] = useState("dashboard");

  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);

  const [editing, setEditing] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(false);

  /*
   * Check the current Supabase session.
   */
  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        const { data, error: sessionError } =
          await supabase.auth.getSession();

        if (!mounted) return;

        if (sessionError) {
          console.error("Session error:", sessionError);
          setError(sessionError.message);
          setCheckingAuth(false);
          return;
        }

        const currentSession = data?.session || null;

        setSession(currentSession);

        if (!currentSession) {
          setAuthorized(false);
          setCheckingAuth(false);
          return;
        }

        await verifyAdmin(currentSession);
      } catch (err) {
        console.error("Admin initialization error:", err);

        if (mounted) {
          setSession(null);
          setAuthorized(false);
          setError("Unable to verify administrator access.");
          setCheckingAuth(false);
        }
      }
    }

    initialize();

    const {
      data: authListener,
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return;

      setSession(nextSession || null);

      if (!nextSession) {
        setAuthorized(false);
        setCheckingAuth(false);
        return;
      }

      await verifyAdmin(nextSession);
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  /*
   * Verify that the signed-in Supabase user
   * is actually a CSG administrator.
   */
  async function verifyAdmin(currentSession) {
    if (!currentSession) {
      setAuthorized(false);
      setCheckingAuth(false);
      return false;
    }

    setCheckingAuth(true);
    setError("");

    try {
      const { data, error: adminError } =
        await supabase.rpc("is_admin");

      if (adminError) {
        console.error("Admin verification error:", adminError);

        setAuthorized(false);
        setError(
          "Unable to verify administrator access. Please check the is_admin database function."
        );

        setCheckingAuth(false);
        return false;
      }

      if (!data) {
        setAuthorized(false);

        setError(
          "This account is signed in but is not authorized as a CSG administrator."
        );

        await supabase.auth.signOut();

        setCheckingAuth(false);
        return false;
      }

      setAuthorized(true);
      setError("");
      setCheckingAuth(false);

      return true;
    } catch (err) {
      console.error("Unexpected admin verification error:", err);

      setAuthorized(false);
      setError("Unable to verify administrator access.");
      setCheckingAuth(false);

      return false;
    }
  }

  /*
   * Load the selected admin section.
   */
  useEffect(() => {
    if (!authorized) return;

    loadData();
  }, [authorized, tab]);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      /*
       * Dashboard
       */
      if (tab === "dashboard") {
        const [
          announcements,
          events,
          officers,
          resources,
          contacts,
          feedback,
        ] = await Promise.all([
          supabase
            .from("announcements")
            .select("id,is_published", { count: "exact" }),

          supabase
            .from("events")
            .select("id,is_published,starts_at", { count: "exact" }),

          supabase
            .from("officers")
            .select("id,is_current", { count: "exact" }),

          supabase
            .from("resources")
            .select("id,is_published", { count: "exact" }),

          supabase
            .from("contacts")
            .select("id,is_published", { count: "exact" }),

          supabase
            .from("student_feedback")
            .select(
              "id,status,subject,category,created_at",
              { count: "exact" }
            )
            .order("created_at", { ascending: false })
            .limit(50),
        ]);

        const firstError = [
          announcements,
          events,
          officers,
          resources,
          contacts,
          feedback,
        ].find((result) => result.error);

        if (firstError?.error) {
          throw firstError.error;
        }

        setStats({
          announcements: announcements.count || 0,
          events: events.count || 0,
          officers: officers.count || 0,
          resources: resources.count || 0,
          contacts: contacts.count || 0,
          feedback: feedback.data || [],
          feedbackCount: feedback.count || 0,
        });

        setLoading(false);
        return;
      }

      /*
       * Other admin sections
       */
      const table = tableFor(tab);

      if (!table) {
        setItems([]);
        setLoading(false);
        return;
      }

      let query = supabase.from(table).select("*");

      /*
       * Some tables may not have created_at.
       * Feedback and the main content tables normally do.
       */
      if (tab === "officers" || tab === "resources" || tab === "contacts") {
        query = query.order("sort_order", { ascending: true });
      } else if (tab === "events") {
        query = query.order("starts_at", { ascending: true });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data, error: loadError } = await query;

      if (loadError) {
        throw loadError;
      }

      setItems(data || []);
    } catch (err) {
      console.error("Admin load error:", err);

      setItems([]);

      setError(
        err?.message ||
          "Unable to load this section."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * Save an item.
   */
  async function save(event) {
    event.preventDefault();

    if (!editing) return;

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const table = tableFor(tab);

      if (!table) {
        throw new Error("Invalid admin section.");
      }

      const payload = { ...editing };

      delete payload.id;
      delete payload.created_at;
      delete payload.updated_at;

      /*
       * These fields are controlled by the database
       * or by the student's tracking page.
       * Admins must not overwrite them here.
       */
      if (tab === "feedback") {
        delete payload.reference_code;
        delete payload.responded_at;
        delete payload.tracking_token_hash;
        delete payload.student_resolution;
      }

      /*
       * Convert event dates to ISO format.
       */
      if (tab === "events") {
        if (payload.starts_at) {
          payload.starts_at = new Date(
            payload.starts_at
          ).toISOString();
        }

        if (payload.ends_at) {
          payload.ends_at = new Date(
            payload.ends_at
          ).toISOString();
        }
      }

      let result;

      if (editing.id) {
        result = await supabase
          .from(table)
          .update(payload)
          .eq("id", editing.id);
      } else {
        result = await supabase
          .from(table)
          .insert(payload);
      }

      if (result.error) {
        throw result.error;
      }

      setMessage(
        editing.id
          ? "Changes saved successfully."
          : `${singular(tab)} created successfully.`
      );

      setEditing(null);

      await loadData();
    } catch (err) {
      console.error("Admin save error:", err);

      setError(
        err?.message ||
          "Unable to save this item."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * Delete an item.
   */
  async function remove(id) {
    if (!id) return;

    const confirmed = window.confirm(
      "Delete this item? This cannot be undone."
    );

    if (!confirmed) return;

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const table = tableFor(tab);

      const { error: deleteError } =
        await supabase
          .from(table)
          .delete()
          .eq("id", id);

      if (deleteError) {
        throw deleteError;
      }

      setMessage("Deleted successfully.");

      await loadData();
    } catch (err) {
      console.error("Admin delete error:", err);

      setError(
        err?.message ||
          "Unable to delete this item."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * Upload image/file to Supabase Storage.
   */
  async function upload(event, field, bucket) {
    const file = event.target.files?.[0];

    if (!file) return;

    setMessage("");
    setError("");

    const maxSizeMB =
      bucket === "csg-images" ? 8 : 15;

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(
        `File is too large. Maximum size is ${maxSizeMB} MB.`
      );

      event.target.value = "";
      return;
    }

    try {
      /*
       * crypto.randomUUID is preferred,
       * but we provide a fallback for older browsers.
       */
      const randomId =
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()
              .toString(36)
              .slice(2)}`;

      const safeName = file.name
        .replace(/[^a-zA-Z0-9._-]/g, "-")
        .replace(/-+/g, "-");

      const path = `${randomId}-${safeName}`;

      const { error: uploadError } =
        await supabase.storage
          .from(bucket)
          .upload(path, file, {
            upsert: false,
          });

      if (uploadError) {
        throw uploadError;
      }

      const { data } =
        supabase.storage
          .from(bucket)
          .getPublicUrl(path);

      if (!data?.publicUrl) {
        throw new Error(
          "The file uploaded, but no public URL was returned."
        );
      }

      setEditing((current) => {
        if (!current) return current;

        const updated = {
          ...current,
          [field]: data.publicUrl,
        };

        if (field === "attachment_url") {
          updated.attachment_name = file.name;
        }

        if (field === "file_url") {
          updated.file_name = file.name;
        }

        return updated;
      });

      setMessage("File uploaded successfully.");
    } catch (err) {
      console.error("Upload error:", err);

      setError(
        err?.message ||
          "Unable to upload this file."
      );
    } finally {
      event.target.value = "";
    }
  }

  /*
   * Sign out.
   */
  async function logout() {
    setMessage("");
    setError("");

    const { error: logoutError } =
      await supabase.auth.signOut();

    if (logoutError) {
      setError(logoutError.message);
    }
  }

  /*
   * Authentication loading screen.
   */
  if (checkingAuth) {
    return (
      <section className="container page">
        <div className="empty">
          <Loader2 size={20} className="spin" />
          Checking administrator access...
        </div>
      </section>
    );
  }

  /*
   * Not signed in.
   */
  if (!session) {
    return (
      <section className="container page">
        <div className="empty">
          <AlertCircle size={20} />

          <p>
            Please sign in through the administrator login.
          </p>
        </div>
      </section>
    );
  }

  /*
   * Signed in but not authorized.
   */
  if (!authorized) {
    return (
      <section className="container page">
        <div className="empty">
          <AlertCircle size={20} />

          <p>
            {error ||
              "This account is not authorized as a CSG administrator."}
          </p>
        </div>
      </section>
    );
  }

  const currentTab = tabs.find(
    (item) => item[0] === tab
  );

  const canAdd = tab !== "dashboard";

  return (
    <section className="admin-page">
      <div className="container admin-wrap">

        {/* SIDEBAR */}
        <aside className="admin-side">
          <div>
            <Brand />

            <div className="admin-label">
              CSG CONTROL CENTER
            </div>

            <nav>
              {tabs.map(
                ([key, label, Icon]) => (
                  <button
                    key={key}
                    type="button"
                    className={
                      tab === key
                        ? "side-item active"
                        : "side-item"
                    }
                    onClick={() => {
                      setTab(key);
                      setEditing(null);
                      setMessage("");
                      setError("");
                    }}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                )
              )}
            </nav>
          </div>

          <button
            type="button"
            className="side-item logout"
            onClick={logout}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </aside>

        {/* MAIN */}
        <main className="admin-main">

          <div className="admin-top">
            <div>
              <span className="eyebrow">
                ADMINISTRATION
              </span>

              <h1>
                {currentTab?.[1] ||
                  "Dashboard"}
              </h1>
            </div>

            {canAdd && (
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  setEditing(
                    blankFor(tab)
                  );
                  setMessage("");
                  setError("");
                }}
              >
                <Plus size={17} />
                Add {singular(tab)}
              </button>
            )}
          </div>

          {message && (
            <div className="success admin-message">
              <CheckCircle2 size={16} />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="error admin-message">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="empty">
              <Loader2
                size={20}
                className="spin"
              />
              Loading...
            </div>
          ) : tab === "dashboard" ? (
            <Dashboard
              stats={stats}
              onOpen={setTab}
            />
          ) : editing ? (
            <Editor
              tab={tab}
              value={editing}
              setValue={setEditing}
              onSave={save}
              onCancel={() => {
                setEditing(null);
                setMessage("");
                setError("");
              }}
              upload={upload}
            />
          ) : (
            <List
              tab={tab}
              items={items}
              onEdit={setEditing}
              onDelete={remove}
            />
          )}
        </main>
      </div>
    </section>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard({ stats, onOpen }) {
  const cards = [
    [
      "Announcements",
      stats?.announcements,
      Bell,
      "announcements",
    ],
    [
      "Events",
      stats?.events,
      CalendarDays,
      "events",
    ],
    [
      "Officers",
      stats?.officers,
      Users,
      "officers",
    ],
    [
      "Resources",
      stats?.resources,
      FileText,
      "resources",
    ],
    [
      "Contacts",
      stats?.contacts,
      Phone,
      "contacts",
    ],
    [
      "Messages",
      stats?.feedbackCount || 0,
      MessageSquare,
      "feedback",
    ],
  ];

  const counts = useMemo(() => {
    return (stats?.feedback || []).reduce(
      (result, item) => {
        const status = item.status || "New";

        result[status] =
          (result[status] || 0) + 1;

        return result;
      },
      {}
    );
  }, [stats]);

  return (
    <div className="dashboard">

      <div className="stat-grid">
        {cards.map(
          ([
            label,
            count,
            Icon,
            target,
          ]) => (
            <button
              type="button"
              className="stat-card"
              key={label}
              onClick={() =>
                onOpen(target)
              }
            >
              <span className="stat-icon">
                <Icon size={19} />
              </span>

              <strong>
                {count ?? 0}
              </strong>

              <span>{label}</span>
            </button>
          )
        )}
      </div>

      <div className="dashboard-grid">

        <section className="dashboard-panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">
                STUDENT MESSAGES
              </span>

              <h2>
                Recent submissions
              </h2>
            </div>

            <button
              type="button"
              className="text-link"
              onClick={() =>
                onOpen("feedback")
              }
            >
              View all
            </button>
          </div>

          {stats?.feedback?.length ? (
            <div className="mini-list">
              {stats.feedback.map(
                (item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() =>
                      onOpen("feedback")
                    }
                  >
                    <span>
                      <strong>
                        {item.subject ||
                          "No subject"}
                      </strong>

                      <small>
                        {item.category ||
                          "Message"}
                      </small>
                    </span>

                    <StatusBadge
                      status={
                        item.status
                      }
                    />
                  </button>
                )
              )}
            </div>
          ) : (
            <div className="empty">
              No student messages yet.
            </div>
          )}
        </section>

        <section className="dashboard-panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">
                STATUS
              </span>

              <h2>
                Message overview
              </h2>
            </div>

            <BarChart3 size={20} />
          </div>

          <div className="status-overview">
            <div>
              <strong>
                {counts.New || 0}
              </strong>
              <span>New</span>
            </div>

            <div>
              <strong>
                {counts["In Review"] || 0}
              </strong>
              <span>In review</span>
            </div>

            <div>
              <strong>
                {counts.Resolved || 0}
              </strong>
              <span>Resolved</span>
            </div>

            <div>
              <strong>
                {counts.Closed || 0}
              </strong>
              <span>Closed</span>
            </div>
          </div>

          <p className="admin-hint">
            Use Student Messages to
            review concerns, add notes,
            and update their status.
          </p>
        </section>

      </div>
    </div>
  );
}

/* =========================================================
   LIST
========================================================= */

function List({
  tab,
  items,
  onEdit,
  onDelete,
}) {
  return (
    <div className="admin-list">

      {items.map((item) => (
        <article
          className="admin-row"
          key={item.id}
        >
          <div>
            <span className="eyebrow">
              {singular(tab)}
            </span>

            <h3>
              {item.title ||
                item.name ||
                item.label ||
                item.subject ||
                "Untitled"}
            </h3>

            <p>
              {item.position ||
                item.category ||
                item.value ||
                item.excerpt ||
                item.description ||
                item.status ||
                "—"}
            </p>

            {tab === "feedback" && (
              <>
                <StatusBadge
                  status={item.status}
                />

                <p className="admin-hint">
                  Student confirmation:{" "}
                  {item.student_resolution ||
                    "Not yet confirmed"}
                </p>
              </>
            )}
          </div>

          <div className="row-actions">
            <button
              type="button"
              title="Edit"
              onClick={() =>
                onEdit({
                  ...item,
                })
              }
            >
              <Pencil size={16} />
            </button>

            <button
              type="button"
              title="Delete"
              onClick={() =>
                onDelete(item.id)
              }
            >
              <Trash2 size={16} />
            </button>
          </div>
        </article>
      ))}

      {!items.length && (
        <div className="empty">
          Nothing here yet. Click
          “Add” to create the first
          item.
        </div>
      )}
    </div>
  );
}

/* =========================================================
   EDITOR
========================================================= */

function Editor({
  tab,
  value,
  setValue,
  onSave,
  onCancel,
  upload,
}) {
  const getValue = (key) =>
    value?.[key] ?? "";

  const set = (key, nextValue) => {
    setValue((current) => ({
      ...current,
      [key]: nextValue,
    }));
  };

  const heading = `${
    value?.id ? "Edit" : "New"
  } ${singular(tab)}`;

  return (
    <form
      className="editor"
      onSubmit={onSave}
    >
      <div className="editor-head">
        <h2>{heading}</h2>

        <div>
          <button
            type="button"
            className="btn secondary"
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="btn primary"
          >
            Save changes
          </button>
        </div>
      </div>

      {/* ANNOUNCEMENTS */}
      {tab === "announcements" && (
        <>
          <Field
            label="Title"
            value={getValue("title")}
            set={(value) =>
              set("title", value)
            }
            required
          />

          <Field
            label="Short excerpt"
            value={getValue(
              "excerpt"
            )}
            set={(value) =>
              set("excerpt", value)
            }
          />

          <Text
            label="Announcement body"
            value={getValue("body")}
            set={(value) =>
              set("body", value)
            }
            required
          />

          <Upload
            label="Cover image"
            field="image_url"
            value={getValue(
              "image_url"
            )}
            upload={upload}
          />

          <Toggle
            label="Feature this announcement in the homepage carousel"
            value={getValue("is_featured")}
            set={(value) =>
              set("is_featured", value)
            }
          />

          <Upload
            label="Attachment / PDF / document"
            field="attachment_url"
            value={getValue(
              "attachment_url"
            )}
            upload={upload}
            bucket="csg-files"
          />

          <Toggle
            label="Published on the public site"
            value={getValue(
              "is_published"
            )}
            set={(value) =>
              set(
                "is_published",
                value
              )
            }
          />
        </>
      )}

      {/* EVENTS */}
      {tab === "events" && (
        <>
          <Field
            label="Event title"
            value={getValue("title")}
            set={(value) =>
              set("title", value)
            }
            required
          />

          <Text
            label="Description"
            value={getValue(
              "description"
            )}
            set={(value) =>
              set(
                "description",
                value
              )
            }
            required
          />

          <div className="form-grid">
            <Field
              label="Starts"
              type="datetime-local"
              value={
                getValue(
                  "starts_at"
                )
                  ? String(
                      getValue(
                        "starts_at"
                      )
                    ).slice(0, 16)
                  : ""
              }
              set={(value) =>
                set(
                  "starts_at",
                  value
                )
              }
              required
            />

            <Field
              label="Ends"
              type="datetime-local"
              value={
                getValue(
                  "ends_at"
                )
                  ? String(
                      getValue(
                        "ends_at"
                      )
                    ).slice(0, 16)
                  : ""
              }
              set={(value) =>
                set(
                  "ends_at",
                  value
                )
              }
            />

            <Field
              label="Location"
              value={getValue(
                "location"
              )}
              set={(value) =>
                set(
                  "location",
                  value
                )
              }
            />

            <Field
              label="Organizer"
              value={getValue(
                "organizer"
              )}
              set={(value) =>
                set(
                  "organizer",
                  value
                )
              }
            />
          </div>

          <Upload
            label="Event poster"
            field="poster_url"
            value={getValue(
              "poster_url"
            )}
            upload={upload}
          />

          <Field
            label="Optional external registration / info link"
            value={getValue(
              "registration_url"
            )}
            set={(value) =>
              set(
                "registration_url",
                value
              )
            }
            placeholder="https://..."
          />

          <Toggle
            label="Published on the public site"
            value={getValue(
              "is_published"
            )}
            set={(value) =>
              set(
                "is_published",
                value
              )
            }
          />
        </>
      )}

      {/* OFFICERS */}
      {tab === "officers" && (
        <>
          <Field
            label="Full name"
            value={getValue("name")}
            set={(value) =>
              set("name", value)
            }
            required
          />

          <Field
            label="Position"
            value={getValue(
              "position"
            )}
            set={(value) =>
              set(
                "position",
                value
              )
            }
            required
          />

          <Field
            label="Course / Year"
            value={getValue(
              "course_year"
            )}
            set={(value) =>
              set(
                "course_year",
                value
              )
            }
          />

          <Text
            label="Short bio"
            value={getValue("bio")}
            set={(value) =>
              set("bio", value)
            }
          />

          <Field
            label="Display order"
            type="number"
            value={getValue(
              "sort_order"
            )}
            set={(value) =>
              set(
                "sort_order",
                Number(value)
              )
            }
          />

          <Upload
            label="Officer photo"
            field="photo_url"
            value={getValue(
              "photo_url"
            )}
            upload={upload}
          />

          <Toggle
            label="Current officer"
            value={getValue(
              "is_current"
            )}
            set={(value) =>
              set(
                "is_current",
                value
              )
            }
          />
        </>
      )}

      {/* RESOURCES */}
      {tab === "resources" && (
        <>
          <Field
            label="Title"
            value={getValue("title")}
            set={(value) =>
              set("title", value)
            }
            required
          />

          <Field
            label="Category"
            value={getValue(
              "category"
            )}
            set={(value) =>
              set(
                "category",
                value
              )
            }
          />

          <Text
            label="Description"
            value={getValue(
              "description"
            )}
            set={(value) =>
              set(
                "description",
                value
              )
            }
          />

          <Upload
            label="File"
            field="file_url"
            value={getValue(
              "file_url"
            )}
            upload={upload}
            bucket="csg-files"
          />

          <Field
            label="External link (optional)"
            value={getValue(
              "link_url"
            )}
            set={(value) =>
              set(
                "link_url",
                value
              )
            }
            placeholder="https://..."
          />

          <Field
            label="Display order"
            type="number"
            value={getValue(
              "sort_order"
            )}
            set={(value) =>
              set(
                "sort_order",
                Number(value)
              )
            }
          />

          <Toggle
            label="Published on the public site"
            value={getValue(
              "is_published"
            )}
            set={(value) =>
              set(
                "is_published",
                value
              )
            }
          />
        </>
      )}

      {/* FEEDBACK */}
      {tab === "feedback" && (
        <>
          <div className="feedback-reference-info">
            <strong>Reference code</strong>
            <p>
              {getValue("reference_code") ||
                "Not available"}
            </p>
          </div>

          <div className="feedback-reference-info">
            <strong>Student resolution confirmation</strong>
            <p>
              {getValue("student_resolution") ||
                "Not yet confirmed"}
            </p>
            <small className="admin-hint">
              This is submitted by the student through the feedback tracking page.
              It is read-only here.
            </small>
          </div>

          <Field
            label="Category"
            value={getValue("category")}
            set={(next) => set("category", next)}
            required
          />

          <Field
            label="Subject"
            value={getValue("subject")}
            set={(next) => set("subject", next)}
            required
          />

          <Text
            label="Student message"
            value={getValue("message")}
            set={(next) => set("message", next)}
            required
          />

          <div className="form-grid">
            <Field
              label="Student name"
              value={getValue("name")}
              set={(next) => set("name", next)}
            />

            <Field
              label="Contact details"
              value={getValue("contact")}
              set={(next) => set("contact", next)}
            />
          </div>

          {getValue("attachment_url") && (
            <a
              href={getValue("attachment_url")}
              target="_blank"
              rel="noreferrer"
              className="text-link"
            >
              <Paperclip size={15} />
              {getValue("attachment_name") ||
                "View attachment"}
            </a>
          )}

          <label>
            Status
            <select
              value={getValue("status") || "New"}
              onChange={(event) =>
                set("status", event.target.value)
              }
              required
            >
              <option value="New">New</option>
              <option value="In Review">In Review</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </label>

          <Text
            label="Internal admin notes (not shown to students)"
            value={getValue("admin_notes")}
            set={(next) => set("admin_notes", next)}
          />

          <Text
            label="Official reply to the student"
            value={getValue("admin_reply")}
            set={(next) => set("admin_reply", next)}
          />

          <p className="admin-hint">
            The official reply is visible to the student through the feedback tracking page.
          </p>

          {getValue("responded_at") && (
            <p className="admin-hint">
              Last response recorded:{" "}
              {new Date(
                getValue("responded_at")
              ).toLocaleString()}
            </p>
          )}
        </>
      )}

      {/* CONTACTS */}
      {tab === "contacts" && (
        <>
          <Field
            label="Label"
            value={getValue("label")}
            set={(value) =>
              set("label", value)
            }
            required
          />

          <Field
            label="Value"
            value={getValue("value")}
            set={(value) =>
              set("value", value)
            }
            required
          />

          <Text
            label="Description"
            value={getValue(
              "description"
            )}
            set={(value) =>
              set(
                "description",
                value
              )
            }
          />

          <Field
            label="Icon (mail, phone, map, info)"
            value={getValue("icon")}
            set={(value) =>
              set("icon", value)
            }
          />

          <Field
            label="Display order"
            type="number"
            value={getValue(
              "sort_order"
            )}
            set={(value) =>
              set(
                "sort_order",
                Number(value)
              )
            }
          />

          <Toggle
            label="Published on the public site"
            value={getValue(
              "is_published"
            )}
            set={(value) =>
              set(
                "is_published",
                value
              )
            }
          />
        </>
      )}
    </form>
  );
}

/* =========================================================
   FORM COMPONENTS
========================================================= */

function Field({
  label,
  value,
  set,
  type = "text",
  required = false,
  placeholder,
}) {
  return (
    <label>
      {label}

      <input
        type={type}
        value={value ?? ""}
        onChange={(event) =>
          set(event.target.value)
        }
        required={required}
        placeholder={placeholder}
      />
    </label>
  );
}

function Text({
  label,
  value,
  set,
  required = false,
}) {
  return (
    <label>
      {label}

      <textarea
        value={value ?? ""}
        onChange={(event) =>
          set(event.target.value)
        }
        required={required}
      />
    </label>
  );
}

function Toggle({
  label,
  value,
  set,
}) {
  return (
    <label className="toggle">
      <input
        type="checkbox"
        checked={!!value}
        onChange={(event) =>
          set(event.target.checked)
        }
      />

      <span>{label}</span>
    </label>
  );
}

function Upload({
  label,
  field,
  value,
  upload,
  bucket = "csg-images",
}) {
  return (
    <div className="upload-field">
      <label>
        {label}

        <input
          type="file"
          accept={
            bucket === "csg-images"
              ? "image/*"
              : undefined
          }
          onChange={(event) =>
            upload(
              event,
              field,
              bucket
            )
          }
        />
      </label>

      {value && (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
        >
          View current file
        </a>
      )}
    </div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ status }) {
  const safeStatus =
    status || "New";

  const className = String(
    safeStatus
  )
    .toLowerCase()
    .replace(/\s+/g, "-");

  return (
    <span
      className={`status-badge status-${className}`}
    >
      {safeStatus}
    </span>
  );
}