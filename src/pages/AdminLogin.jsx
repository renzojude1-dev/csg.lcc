
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
} from "lucide-react";

export default function AdminLogin() {
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Authentication state
  const [checkingSession, setCheckingSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  /*
   * Check whether a user already has an active session.
   * Existing sessions are redirected to the admin dashboard.
   */
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

  /*
   * Sign in using Supabase Auth.
   */
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

  /*
   * Session checking screen.
   */
  if (checkingSession) {
    return (
      <section className="auth-page">
        <div className="auth-card">
          <Brand />

          <div className="auth-loading">
            <div className="auth-icon">
              <Loader2 size={26} className="spin" />
            </div>

            <h1>Checking access</h1>

            <p>
              Please wait while we verify your session.
            </p>
          </div>
        </div>
      </section>
    );
  }

  /*
   * Administrator login screen.
   */
  return (
    <section className="auth-page">
      <div className="auth-card">
        {/* Branding */}
        <div className="auth-brand">
          <Brand />
        </div>

        {/* Header */}
        <div className="auth-header">
          <div className="auth-icon">
            <LockKeyhole size={27} />
          </div>

          <span className="auth-eyebrow">
            SECURE ADMINISTRATION
          </span>

          <h1>Welcome back</h1>

          <p>
            Sign in to access the Central Student Government
            control center.
          </p>
        </div>

        {/* Security information */}
        <div className="auth-notice">
          <ShieldCheck size={18} />
          <span>
            Restricted to authorized CSG administrators only.
          </span>
        </div>

        {/* Login form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Email */}
          <label className="auth-field">
            <span>Email address</span>

            <div className="auth-input-wrap">
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

          {/* Password */}
          <label className="auth-field">
            <span>Password</span>

            <div className="auth-input-wrap">
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
                className="password-toggle"
                onClick={() =>
                  setShowPassword((current) => !current)
                }
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
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

          {/* Error message */}
          {error && (
            <div className="error auth-error" role="alert">
              <AlertCircle size={17} />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="btn primary full auth-submit"
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

        {/* Back link */}
        <button
          type="button"
          className="auth-back"
          onClick={() => navigate("/", { replace: true })}
          disabled={submitting}
        >
          <ArrowLeft size={16} />
          Back to website
        </button>

        {/* Footer */}
        <div className="auth-footer">
          <ShieldCheck size={14} />
          <span>Central Student Government · Lipa City Colleges</span>
        </div>
      </div>
    </section>
  );
}