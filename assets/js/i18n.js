let translations = {};
let fallback = {};
let activeLang = "en";

function normalizeI18n(data) {
  if (data && typeof data === "object" && data.translations) {
    if (typeof data.translations === "string") {
      try {
        return JSON.parse(data.translations);
      } catch (error) {
        return {};
      }
    }
    if (typeof data.translations === "object") {
      return data.translations;
    }
  }
  return data || {};
}


function getValue(obj, path) {
  return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

export function t(key) {
  if (!key) return "";
  return getValue(translations, key) ?? getValue(fallback, key) ?? key;
}

export async function loadI18n(lang) {
  activeLang = lang || "en";
  document.documentElement.classList.add("lang-loading");

  const fallbackPromise = fetch("/assets/i18n/en.json").then((res) => res.json());
  const langPromise = activeLang === "en"
    ? fallbackPromise
    : fetch(`/assets/i18n/${activeLang}.json`).then((res) => res.json()).catch(() => ({}));

  [fallback, translations] = await Promise.all([fallbackPromise, langPromise]);
  fallback = normalizeI18n(fallback);
  translations = normalizeI18n(translations);
}

export function applyI18n(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.getAttribute("data-i18n");
    node.textContent = t(key);
  });

  root.querySelectorAll("[data-i18n-attr]").forEach((node) => {
    const mappings = node.getAttribute("data-i18n-attr");
    if (!mappings) return;
    mappings.split(";").forEach((pair) => {
      const [attr, key] = pair.split(":");
      if (!attr || !key) return;
      node.setAttribute(attr.trim(), t(key.trim()));
    });
  });

  document.documentElement.lang = activeLang;
  document.documentElement.classList.remove("lang-loading");
}

export function getActiveLang() {
  return activeLang;
}
