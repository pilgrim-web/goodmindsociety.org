import { t } from "./i18n.js";
import { openModal } from "./ui.js";

let siteData = null;
let projects = [];
let updates = [];
let impactMetrics = [];

function normalizeList(data, keys = []) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  for (const key of keys) {
    if (data && Array.isArray(data[key])) return data[key];
  }
  return [];
}



export async function loadContent() {
  const [siteRes, projectsRes, updatesRes, impactRes] = await Promise.all([
    fetch("/content/data/site.json").then((res) => res.json()),
    fetch("/content/data/projects.json").then((res) => res.json()),
    fetch("/content/data/updates.json").then((res) => res.json()),
    fetch("/content/data/impact-metrics.json").then((res) => res.json()),
  ]);

  siteData = siteRes;
  projects = normalizeList(projectsRes, ["projects", "items"]);
  updates = normalizeList(updatesRes, ["updates", "items"]);
  impactMetrics = normalizeList(impactRes, ["metrics", "items"]);
}

export function getSite() {
  return siteData;
}

function renderSiteGlobals() {
  if (!siteData) return;
  document.querySelectorAll("[data-site]").forEach((node) => {
    const key = node.getAttribute("data-site");
    if (!key || !siteData[key]) return;
    const value = siteData[key];
    node.textContent = value.includes(".") ? t(value) : value;
  });

  const emailLinks = document.querySelectorAll("[data-site-email]");
  if (emailLinks.length && siteData.email) {
    emailLinks.forEach((emailLink) => {
      emailLink.textContent = siteData.email;
      emailLink.setAttribute("href", `mailto:${siteData.email}`);
    });
  }
}

function renderSocialLinks() {
  if (!siteData || !Array.isArray(siteData.socialLinks)) return;
  const container = document.querySelector("[data-social-links]");
  if (!container) return;
  container.innerHTML = "";
  siteData.socialLinks.forEach((link) => {
    const anchor = document.createElement("a");
    anchor.href = link.url;
    anchor.target = "_blank";
    anchor.rel = "noopener";
    const label = link.labelKey ? t(link.labelKey) : link.label || link.url;
    anchor.textContent = label;
    anchor.setAttribute("aria-label", label);
    container.appendChild(anchor);
  });
}

function renderProjects() {
  const container = document.querySelector("[data-projects-list]");
  if (!container || !projects.length) return;
  const filter = container.getAttribute("data-projects-filter");
  const list = filter == "secondary" ? projects.filter((project) => !project.featured) : projects;
  container.innerHTML = "";
  list.forEach((project) => {
    const card = document.createElement("article");
    card.className = "card";
    const statusLabel = project.status ? t(project.status) : "";

    card.innerHTML = `
      <div class="card__meta">${statusLabel}</div>
      <h3 class="card__title">${t(project.titleKey)}</h3>
      <p>${t(project.summaryKey)}</p>
    `;

    if (project.link) {
      const actions = document.createElement("div");
      actions.className = "card__actions";
      const link = document.createElement("a");
      link.className = "btn btn-secondary";
      link.href = project.link;
      link.textContent = t("misc.learnMore");
      if (project.link.startsWith("http")) {
        link.setAttribute("data-no-lang", "true");
      }
      actions.appendChild(link);
      card.appendChild(actions);
    }

    container.appendChild(card);
  });
}

function renderUpdates() {
  const container = document.querySelector("[data-updates-list]");
  if (!container || !updates.length) return;

  const limitAttr = container.getAttribute("data-updates-limit");
  const limit = limitAttr ? Number(limitAttr) : updates.length;
  const hasModal = Boolean(document.querySelector("#update-modal"));

  const sorted = [...updates].sort((a, b) => new Date(b.dateISO) - new Date(a.dateISO));
  const sliced = sorted.slice(0, limit);

  container.innerHTML = "";
  sliced.forEach((update) => {
    const card = document.createElement("article");
    card.className = "card update-card";
    card.innerHTML = `
      <div class="update-card__date">${new Date(update.dateISO).toLocaleDateString()}</div>
      <h3 class="card__title">${t(update.titleKey)}</h3>
      <p>${t(update.excerptKey)}</p>
    `;

    const actions = document.createElement("div");
    actions.className = "card__actions";
    if (hasModal) {
      const button = document.createElement("button");
      button.className = "btn btn-secondary";
      button.type = "button";
      button.textContent = t("updates.readMore");
      button.setAttribute("data-update-open", update.id);
      actions.appendChild(button);
    } else {
      const link = document.createElement("a");
      link.className = "btn btn-secondary";
      link.href = `/updates/?id=${update.id}`;
      link.textContent = t("updates.readMore");
      actions.appendChild(link);
    }
    card.appendChild(actions);
    container.appendChild(card);
  });
}

function renderImpactMetrics() {
  const container = document.querySelector("[data-impact-metrics]");
  if (!container || !impactMetrics.length) return;
  container.innerHTML = "";
  impactMetrics.forEach((metric) => {
    const item = document.createElement("div");
    item.className = "metric";
    item.innerHTML = `
      <div class="metric__value">${metric.value}</div>
      <div>${t(metric.labelKey)}</div>
      <div class="text-muted">${t(metric.noteKey)}</div>
    `;
    container.appendChild(item);
  });
}

function renderUpdateModal() {
  const modal = document.querySelector("#update-modal");
  if (!modal) return;

  const openButtons = document.querySelectorAll("[data-update-open]");
  openButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.getAttribute("data-update-open");
      const update = updates.find((item) => item.id === id);
      if (!update) return;
      fillUpdateModal(modal, update);
      openModal(modal);
    });
  });

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (id) {
    const update = updates.find((item) => item.id === id);
    if (update) {
      fillUpdateModal(modal, update);
      openModal(modal);
    }
  }
}

function fillUpdateModal(modal, update) {
  const title = modal.querySelector("[data-update-title]");
  const date = modal.querySelector("[data-update-date]");
  const body = modal.querySelector("[data-update-body]");
  const tags = modal.querySelector("[data-update-tags]");

  if (title) title.textContent = t(update.titleKey);
  if (date) date.textContent = new Date(update.dateISO).toLocaleDateString();
  if (body) body.textContent = t(update.bodyKey);
  if (tags && Array.isArray(update.tags)) {
    tags.innerHTML = "";
    update.tags.forEach((tag) => {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = t(tag);
      tags.appendChild(span);
    });
  }
}

export function renderContent() {
  renderSiteGlobals();
  renderSocialLinks();
  renderProjects();
  renderUpdates();
  renderImpactMetrics();
  renderUpdateModal();
}
