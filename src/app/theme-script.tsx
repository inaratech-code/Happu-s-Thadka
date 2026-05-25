import { THEME_COOKIE_KEY, THEME_STORAGE_KEY } from "@/lib/theme";

export function ThemeScript() {
  const script = `
(function () {
  try {
    var key = ${JSON.stringify(THEME_STORAGE_KEY)};
    var cookieKey = ${JSON.stringify(THEME_COOKIE_KEY)};
    function readCookie(name) {
      var m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
      return m ? decodeURIComponent(m[1]) : "";
    }
    var ls = localStorage.getItem(key);
    var cookie = readCookie(cookieKey);
    var theme =
      ls === "light" || ls === "dark"
        ? ls
        : cookie === "light" || cookie === "dark"
          ? cookie
          : "dark";
    var root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem(key, theme);
    document.cookie =
      cookieKey + "=" + theme + ";path=/;max-age=31536000;SameSite=Lax";
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#f8fafc" : "#0a0a0b");
  } catch (e) {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add("dark");
  }
})();
`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
