import { useState } from "react";
import {
  NavLink,
  Outlet,
  Link,
} from "react-router-dom";

import {
  Bell,
  CalendarDays,
  Users,
  FileText,
  HelpCircle,
  MessageSquare,
  Menu,
  X,
  LayoutDashboard,
} from "lucide-react";

import Brand from "./Brand";

const nav = [
  ["/", "Home"],
  ["/announcements", "Announcements", Bell],
  ["/events", "Events", CalendarDays],
  ["/officers", "Officers", Users],
  ["/resources", "Resources", FileText],
  ["/help", "Student Help", HelpCircle],
  ["/feedback", "Send to CSG", MessageSquare],
];

export default function Layout() {
  const [open, setOpen] = useState(false);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <>
      <header className="site-header">
        <div className="container nav-wrap">
          <Link
            to="/"
            onClick={closeMenu}
            className="brand-link"
            aria-label="Central Student Government home"
          >
            <Brand />
          </Link>

          <button
            type="button"
            className="menu-btn"
            onClick={() => setOpen((current) => !current)}
            aria-label={
              open
                ? "Close navigation menu"
                : "Open navigation menu"
            }
            aria-expanded={open}
          >
            {open ? (
              <X size={23} />
            ) : (
              <Menu size={23} />
            )}
          </button>

          <nav
            className={
              open
                ? "nav open"
                : "nav"
            }
            aria-label="Main navigation"
          >
            {nav.map(
              ([to, label, Icon]) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  onClick={closeMenu}
                >
                  {Icon && (
                    <Icon size={17} />
                  )}
                  <span>{label}</span>
                </NavLink>
              )
            )}

            <NavLink
              to="/admin/login"
              onClick={closeMenu}
              className="admin-link"
            >
              <LayoutDashboard
                size={17}
              />
              <span>Admin</span>
            </NavLink>
          </nav>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container footer-grid">

          <div>
            <Link
              to="/"
              className="brand-link"
              aria-label="Central Student Government home"
            >
              <Brand />
            </Link>
          </div>

          <div>
            <strong>
              Central Student Government
            </strong>

            <p>
              Created by: Jude Renzo Oseña
            </p>
          </div>

          <div>
            <strong>
              QUICK LINKS
            </strong>

            <p>
              <Link to="/events">
                Events
              </Link>
              {" · "}
              <Link to="/announcements">
                Announcements
              </Link>
              {" · "}
              <Link to="/resources">
                Resources
              </Link>
            </p>
          </div>

        </div>

        <div className="container footer-bottom">
          © {new Date().getFullYear()}{" "}
          Central Student Government ·
          Lipa City Colleges
        </div>
      </footer>
    </>
  );
}