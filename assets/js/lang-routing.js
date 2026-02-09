const SUPPORTED_LANGS = ["en", "ko", "es"];

let currentLang = "en";

function extractLang(pathname) {
  const match = pathname.match(/^\/(en|ko|es)(\/|$)/);
  return match ? match[1] : "en";
}

function stripLang(pathname) {
  const match = pathname.match(/^\/(en|ko|es)(\/|$)/);
  if (!match) {
    return pathname || "/";
  }
  const stripped = pathname.replace(/^\/(en|ko|es)/, "");
  return stripped.startsWith("/") ? stripped : `/${stripped}`;
}

export function getLang() {
  currentLang = extractLang(window.location.pathname);
  return currentLang;
}

export function setLang(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  const basePath = stripLang(window.location.pathname);
  const normalizedBase = basePath === "" ? "/" : basePath;
  const newPath = `/${lang}${normalizedBase === "/" ? "/" : normalizedBase}`;
  window.location.assign(`${newPath}${window.location.search}${window.location.hash}`);
}

export function withLang(url, lang = currentLang) {
  if (!url || typeof url !== "string") return url;
  if (url.startsWith("http") || url.startsWith("mailto:") || url.startsWith("tel:") || url.startsWith("#")) {
    return url;
  }
  if (url.startsWith("/admin") || url.startsWith("/assets") || url.startsWith("/content") || url.startsWith("/.netlify")) {
    return url;
  }
  if (url.match(/^\/(en|ko|es)(\/|$)/)) {
    return url;
  }
  if (url.startsWith("/")) {
    const normalized = url === "/" ? "/" : url;
    return `/${lang}${normalized === "/" ? "/" : normalized}`;
  }
  return url;
}

export function rewriteInternalLinks() {
  document.querySelectorAll("a[href]").forEach((link) => {
    if (link.hasAttribute("data-no-lang")) return;
    const href = link.getAttribute("href");
    if (!href) return;
    link.setAttribute("href", withLang(href));
  });
}

export function buildHreflangLinks() {
  const head = document.head;
  const basePath = stripLang(window.location.pathname);
  const normalizedBase = basePath === "" ? "/" : basePath;
  const baseWithSlash = normalizedBase === "/" ? "/" : normalizedBase;
  const origin = window.location.origin === "null" ? "" : window.location.origin;

  const canonical = head.querySelector('link[rel="canonical"]');
  if (canonical) {
    canonical.setAttribute("href", `${origin}${withLang(baseWithSlash)}`);
  }

  head.querySelectorAll('link[rel="alternate"][data-generated="true"]').forEach((node) => node.remove());

  SUPPORTED_LANGS.forEach((lang) => {
    const link = document.createElement("link");
    link.setAttribute("rel", "alternate");
    link.setAttribute("hreflang", lang);
    link.setAttribute("href", `${origin}/${lang}${baseWithSlash === "/" ? "/" : baseWithSlash}`);
    link.dataset.generated = "true";
    head.appendChild(link);
  });

  const defaultLink = document.createElement("link");
  defaultLink.setAttribute("rel", "alternate");
  defaultLink.setAttribute("hreflang", "x-default");
  defaultLink.setAttribute("href", `${origin}/en${baseWithSlash === "/" ? "/" : baseWithSlash}`);
  defaultLink.dataset.generated = "true";
  head.appendChild(defaultLink);
}

export function initLangSwitcher() {
  const lang = getLang();
  document.querySelectorAll("[data-lang-switch]").forEach((button) => {
    const buttonLang = button.getAttribute("data-lang-switch");
    button.setAttribute("aria-pressed", buttonLang === lang ? "true" : "false");
    button.addEventListener("click", () => setLang(buttonLang));
  });
}

export function getSupportedLangs() {
  return [...SUPPORTED_LANGS];
}

export function getCurrentBasePath() {
  return stripLang(window.location.pathname);
}
