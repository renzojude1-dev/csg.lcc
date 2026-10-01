import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Brand from "../components/Brand";
import { LockKeyhole, AlertCircle, Loader2 } from "lucide-react";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (!mounted) return;

      if (sessionError) {
        console.error("Session check error:", sessionError);
        setLoading(false);
        return;
      }

      if (data?.session) {
        navigate("/admin", { replace: true });
        return;
      }

      setLoading(false);
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) return;

    setError("");
    setSubmitting(true);

    const cleanEmail = email.trim();

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (signInError) {
        console.error("Admin login error:", signInError);
        setError(signInError.message || "Unable to sign in.");
        setSubmitting(false);
        return;
      }

      if (!data?.session) {
        setError("Login succeeded, but no active session was created.");
        setSubmitting(false);
        return;
      }

      navigate("/admin", { replace: true });
    } catch (err) {
      console.error("Unexpected login error:", err);
      setError("Something went wrong while signing in.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <section className="auth-page">
        <div className="auth-card">
          <Brand />

          <div className="auth-icon">
            <LockKeyhole size={28} />
          </div>

          <h1>Administrator Login</h1>

          <p>Checking your administrator session...</p>

          <div className="empty">
            <Loader2 size={18} className="spin" />
            Checking access...
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <Brand />

        <div className="auth-icon">
          <LockKeyhole size={28} />
        </div>

        <h1>Administrator Login</h1>

        <p>
          This area is for authorized CSG administrators only.
        </p>

        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              autoComplete="email"
              required
              disabled={submitting}
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              disabled={submitting}
            />
          </label>

          {error && (
            <div className="error">
              <AlertCircle size={17} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn primary full"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 size={17} className="spin" />
                Signing in...
              </>
            ) : (
              <>
                <LockKeyhole size={17} />
                Sign in
              </>
            )}
          </button>
        </form>
      </div>
    </section>
  );
}