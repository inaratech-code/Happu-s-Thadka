export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "happus-theme";
export const THEME_COOKIE_KEY = "happus-theme";
export const THEME_CHANGE_EVENT = "happus-theme-change";

export function parseTheme(value: string | null | undefined): Theme {
  return value === "light" ? "light" : "dark";
}

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return parseTheme(localStorage.getItem(THEME_STORAGE_KEY));
}

export function themeColorFor(theme: Theme) {
  return theme === "light" ? "#f8fafc" : "#0a0a0b";
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  document.cookie = `${THEME_COOKIE_KEY}=${theme};path=/;max-age=31536000;SameSite=Lax`;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", themeColorFor(theme));
  }

  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export function subscribeTheme(onChange: () => void) {
  const handler = () => onChange();
  window.addEventListener(THEME_CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
