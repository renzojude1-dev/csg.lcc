
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Brand from "../components/Brand";

import {
  LockKeyhole,
  AlertCircle,
  Loader2,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowLeft,
  Fingerprint,
} from "lucide-react";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [checkingSession, setCheckingSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const { data, error: sessionError } =
          await supabase.auth.getSession();

        if (!mounted) return;

        if (sessionError) {
          console.error("Session check error:", sessionError);
          setError("Unable to check your session. Please try again.");
          setCheckingSession(false);
          return;
        }

        if (data?.session) {
          navigate("/admin", { replace: true });
          return;
        }

        setCheckingSession(false);
      } catch (err) {
        console.error("Unexpected session error:", err);

        if (mounted) {
          setError("Something went wrong while checking your session.");
          setCheckingSession(false);
        }
      }
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) return;

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (signInError) {
        console.error("Admin login error:", signInError);

        setError(
          signInError.message === "Invalid login credentials"
            ? "Incorrect email or password. Please try again."
            : signInError.message || "Unable to sign in."
        );
        return;
      }

      if (!data?.session) {
        setError(
          "Login succeeded, but no active session was created. Please try again."
        );
        return;
      }

      navigate("/admin", { replace: true });
    } catch (err) {
      console.error("Unexpected login error:", err);
      setError("Something went wrong while signing in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingSession) {
    return (
      <section className="admin-login-page">
        <div className="admin-login-card admin-login-loading">
          <Brand />

          <div className="admin-login-loader">
            <div className="admin-login-icon">
              <Loader2 size={27} className="spin" />
            </div>

            <span className="admin-login-eyebrow">
              SECURE ACCESS
            </span>

            <h1>Checking access</h1>
            <p>Verifying your existing administrator session.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-login-page">
      <div className="admin-login-glow admin-login-glow-one" />
      <div className="admin-login-glow admin-login-glow-two" />

      <div className="admin-login-layout">
        {/* Left introduction panel */}
        <aside className="admin-login-intro">
          <div className="admin-login-brand">
            <Brand />
          </div>

          <div className="admin-login-intro-content">
            <span className="admin-login-eyebrow">
              CENTRAL STUDENT GOVERNMENT
            </span>

            <h1>
              Leadership begins
              <br />
              <span>with responsibility.</span>
            </h1>

            <p>
              Manage student announcements, campus events, assistance
              resources, and other CSG website content in one place.
            </p>

            <div className="admin-login-feature">
              <div className="admin-login-feature-icon">
                <ShieldCheck size={20} />
              </div>
              <div>
                <strong>Protected administration</strong>
                <span>Access reserved for authorized administrators.</span>
              </div>
            </div>

            <div className="admin-login-feature">
              <div className="admin-login-feature-icon">
                <Fingerprint size={20} />
              </div>
              <div>
                <strong>Secure authentication</strong>
                <span>Your credentials are verified through Supabase.</span>
              </div>
            </div>
          </div>

          <div className="admin-login-intro-footer">
            <span className="admin-login-status-dot" />
            Lipa City Colleges · Official CSG Portal
          </div>
        </aside>

        {/* Login panel */}
        <main className="admin-login-card">
          <button
            type="button"
            className="admin-login-back"
            onClick={() => navigate("/", { replace: true })}
            disabled={submitting}
          >
            <ArrowLeft size={16} />
            Back to website
          </button>

          <div className="admin-login-mobile-brand">
            <Brand />
          </div>

          <div className="admin-login-form-header">
            <div className="admin-login-icon">
              <LockKeyhole size={25} />
            </div>

            <span className="admin-login-eyebrow">
              ADMINISTRATOR ACCESS
            </span>

            <h2>Welcome back</h2>

            <p>
              Sign in with your administrator credentials to continue.
            </p>
          </div>

          <div className="admin-login-security">
            <ShieldCheck size={18} />
            <span>
              This area is restricted to authorized CSG administrators.
            </span>
          </div>

          <form className="admin-login-form" onSubmit={handleSubmit}>
            <label className="admin-login-field">
              <span>Email address</span>

              <div className="admin-login-input-wrap">
                <Mail size={18} />

                <input
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (error) setError("");
                  }}
                  placeholder="admin@example.com"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  disabled={submitting}
                />
              </div>
            </label>

            <label className="admin-login-field">
              <span>Password</span>

              <div className="admin-login-input-wrap">
                <LockKeyhole size={18} />

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  disabled={submitting}
                />

                <button
                  type="button"
                  className="admin-login-password-toggle"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  disabled={submitting}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>

            {error && (
              <div className="admin-login-error" role="alert">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="admin-login-submit"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LockKeyhole size={17} />
                  Sign in to dashboard
                </>
              )}
            </button>
          </form>

          <div className="admin-login-divider">
            <span />
            <ShieldCheck size={15} />
            <span />
          </div>

          <p className="admin-login-bottom-note">
            Your account credentials should never be shared with others.
          </p>

          <footer className="admin-login-footer">
            Central Student Government
            <span>·</span>
            Lipa City Colleges
          </footer>
        </main>
      </div>
    </section>
  );
}
