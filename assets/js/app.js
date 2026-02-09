import { getLang, initLangSwitcher, rewriteInternalLinks, buildHreflangLinks, getCurrentBasePath } from "./lang-routing.js";
import { loadI18n, applyI18n } from "./i18n.js";
import { loadContent, renderContent } from "./content.js";
import { initDonate } from "./donate.js";
import { initUI } from "./ui.js";

async function injectHeadPartial() {
  try {
    const response = await fetch("/partials/head.html");
    if (!response.ok) return;
    const html = await response.text();
    document.head.insertAdjacentHTML("beforeend", html);
  } catch (error) {
    console.warn("Failed to load head partial", error);
  }
}

async function injectBodyPartials() {
  const targets = Array.from(document.querySelectorAll("[data-partial]"));
  await Promise.all(
    targets.map(async (target) => {
      const name = target.getAttribute("data-partial");
      if (!name) return;
      try {
        const response = await fetch(`/partials/${name}.html`);
        if (!response.ok) return;
        const html = await response.text();
        target.innerHTML = html;
      } catch (error) {
        console.warn(`Failed to load partial ${name}`, error);
      }
    })
  );
}

function setActiveNav() {
  const base = getCurrentBasePath();
  const cleaned = base.endsWith("/") ? base : `${base}/`;
  document.querySelectorAll("[data-nav]").forEach((link) => {
    const target = link.getAttribute("href");
    if (!target) return;
    const stripped = target.replace(/^\/(en|ko|es)(\/|$)/, "/");
    const normalized = stripped.endsWith("/") ? stripped : `${stripped}/`;
    if (cleaned === normalized || (cleaned === "/" && normalized === "/")) {
      link.setAttribute("aria-current", "page");
    }
  });
}

async function boot() {
  const lang = getLang();
  await injectHeadPartial();
  await injectBodyPartials();
  buildHreflangLinks();

  await loadI18n(lang);
  applyI18n();

  await loadContent();
  renderContent();

  initLangSwitcher();
  rewriteInternalLinks();
  setActiveNav();
  initDonate();
  initUI();
}

boot();
