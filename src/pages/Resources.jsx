import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Download,
  ExternalLink,
  FileText,
  AlertCircle,
} from "lucide-react";

export default function Resources() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadResources();
  }, []);

  async function loadResources() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Resources error:", error);
      setError("Unable to load resources right now.");
      setItems([]);
    } else {
      setItems(data || []);
    }

    setLoading(false);
  }

  return (
    <section className="container page">
      <div className="page-title">
        <span className="eyebrow">STUDENT TOOLKIT</span>

        <h1>Resources</h1>

        <p>
          Useful forms, guides, documents and links collected for students.
        </p>
      </div>

      <div className="resource-list">
        {loading && (
          <div className="empty">
            Loading resources...
          </div>
        )}

        {!loading && error && (
          <div className="empty">
            <AlertCircle size={20} />
            <p>{error}</p>

            <button
              className="btn small"
              onClick={loadResources}
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="empty">
            No resources have been published yet.
          </div>
        )}

        {!loading &&
          !error &&
          items.map((item) => (
            <article
              className="resource"
              key={item.id}
            >
              <div className="resource-icon">
                <FileText size={24} />
              </div>

              <div className="resource-content">
                {item.category && (
                  <span className="eyebrow">
                    {item.category}
                  </span>
                )}

                <h3>{item.title}</h3>

                {item.description && (
                  <p>{item.description}</p>
                )}
              </div>

              <div className="resource-action">
                {item.file_url && (
                  <a
                    className="btn small"
                    href={item.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download size={15} />
                    Download
                  </a>
                )}

                {!item.file_url && item.link_url && (
                  <a
                    className="btn small"
                    href={item.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink size={15} />
                    Open
                  </a>
                )}
              </div>
            </article>
          ))}
      </div>
    </section>
  );
}