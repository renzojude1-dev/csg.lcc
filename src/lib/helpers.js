export const LOGO_PATH = "/csg-logo.png";

export function browserToken() {
  const key = "csg_lcc_browser_token";
  let token = localStorage.getItem(key);
  if (!token) {
    token = crypto.randomUUID() + crypto.randomUUID();
    localStorage.setItem(key, token);
  }
  return token;
}

export function formatDate(value, options = {}) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    ...options
  }).format(new Date(value));
}

export function formatDateTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function avgRating(reviews = []) {
  if (!reviews.length) return 0;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}

