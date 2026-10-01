import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  AlertCircle,
} from "lucide-react";

const icons = {
  mail: Mail,
  phone: Phone,
  map: MapPin,
  info: MessageCircle,
};

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

    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Contacts error:", error);
      setError("Unable to load contact information right now.");
      setItems([]);
    } else {
      setItems(data || []);
    }

    setLoading(false);
  }

  return (
    <section className="container page">
      <div className="page-title">
        <span className="eyebrow">NEED ASSISTANCE?</span>

        <h1>Student Help Desk</h1>

        <p>
          Find the right contact or office for your concern. Official CSG
          contact details can be added through the admin dashboard.
        </p>
      </div>

      <div className="help-grid">
        {loading && (
          <div className="empty">
            Loading contact information...
          </div>
        )}

        {!loading && error && (
          <div className="empty">
            <AlertCircle size={20} />
            <p>{error}</p>

            <button
              type="button"
              className="btn small"
              onClick={loadContacts}
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="empty">
            No contact information has been published yet.
          </div>
        )}

        {!loading &&
          !error &&
          items.map((item) => {
            const Icon = icons[item.icon] || MessageCircle;

            return (
              <article className="help-card" key={item.id}>
                <Icon size={25} />

                {item.label && (
                  <span>{item.label}</span>
                )}

                <h3>{item.value}</h3>

                {item.description && (
                  <p>{item.description}</p>
                )}
              </article>
            );
          })}
      </div>

      <div className="callout">
        <MessageCircle size={24} />

        <div>
          <h3>Suggestion box</h3>

          <p>
            Want the CSG portal to include another student service?
            You can send a suggestion through the Student Feedback
            page or ask the CSG to add another resource.
          </p>
        </div>
      </div>
    </section>
  );
}