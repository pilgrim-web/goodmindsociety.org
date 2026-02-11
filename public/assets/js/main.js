(() => {
  "use strict";

  const SUPPORTED_LANGS = ["en", "ko", "es", "zh"];
  const DEFAULT_LANG = "en";
  const I18N_PATH = "/i18n/strings.json";

  const state = {
    lang: DEFAULT_LANG,
    strings: null,
    stringsPromise: null,
  };

  const isExternalHref = (href) => {
    return /^(https?:)?\/\//i.test(href);
  };

  const hasProtocol = (href) => {
    return /^(mailto:|tel:|sms:|javascript:|#)/i.test(href);
  };

  const stripLangPrefix = (pathname) => {
    const match = pathname.match(/^\/(en|ko|es|zh)(?=\/|$)/);
    if (!match) return pathname || "/";

    const stripped = pathname.slice(match[0].length);
    if (!stripped) return "/";
    return stripped.startsWith("/") ? stripped : `/${stripped}`;
  };

  const normalizePath = (pathname) => {
    if (!pathname) return "/";
    let out = pathname.replace(/\/{2,}/g, "/");
    if (!out.startsWith("/")) out = `/${out}`;
    return out;
  };

  const detectLangFromPath = () => {
    const first = window.location.pathname.split("/").filter(Boolean)[0];
    return SUPPORTED_LANGS.includes(first) ? first : null;
  };

  const getStoredLang = () => {
    try {
      const value = localStorage.getItem("gms_lang");
      return SUPPORTED_LANGS.includes(value) ? value : null;
    } catch (error) {
      return null;
    }
  };

  const setStoredLang = (lang) => {
    try {
      localStorage.setItem("gms_lang", lang);
    } catch (error) {
      // Ignore storage errors.
    }
  };

  const ensureLang = (value) => {
    return SUPPORTED_LANGS.includes(value) ? value : DEFAULT_LANG;
  };

  const getLang = () => {
    const fromPath = detectLangFromPath();
    if (fromPath) return fromPath;
    return ensureLang(getStoredLang() || DEFAULT_LANG);
  };

  const loadStrings = async () => {
    if (state.strings) return state.strings;
    if (!state.stringsPromise) {
      state.stringsPromise = fetch(I18N_PATH, { cache: "no-store" })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`i18n load failed: ${response.status}`);
          }
          return response.json();
        })
        .then((json) => {
          state.strings = json;
          return json;
        });
    }
    return state.stringsPromise;
  };

  const getDictionary = (lang) => {
    if (!state.strings) return {};
    return state.strings[lang] || state.strings[DEFAULT_LANG] || {};
  };

  const t = (key, lang = state.lang) => {
    const dict = getDictionary(lang);
    const fallback = getDictionary(DEFAULT_LANG);
    return dict[key] ?? fallback[key] ?? key;
  };

  const withLang = (url, langOverride) => {
    const activeLang = ensureLang(langOverride || state.lang);
    if (!url) return `/${activeLang}/`;
    if (hasProtocol(url) || isExternalHref(url)) return url;

    const parsed = new URL(url, window.location.origin);
    if (parsed.origin !== window.location.origin) return url;

    const pathNoLang = normalizePath(stripLangPrefix(parsed.pathname));
    const finalPath = pathNoLang === "/" ? `/${activeLang}/` : `/${activeLang}${pathNoLang}`;

    return `${finalPath}${parsed.search}${parsed.hash}`;
  };

  const applyTranslations = () => {
    document.documentElement.lang = state.lang;

    const nodes = document.querySelectorAll("[data-i18n]");
    nodes.forEach((node) => {
      const key = node.getAttribute("data-i18n");
      if (!key) return;
      const translated = t(key);
      const attrSpec = node.getAttribute("data-i18n-attr");

      if (attrSpec) {
        attrSpec
          .split("|")
          .map((item) => item.trim())
          .filter(Boolean)
          .forEach((attrName) => node.setAttribute(attrName, translated));
      } else {
        node.textContent = translated;
      }
    });
  };

  const rewriteInternalLinks = () => {
    const links = document.querySelectorAll("a[data-lang-link]");
    links.forEach((link) => {
      const original = link.getAttribute("data-original-href") || link.getAttribute("href") || "";
      if (!link.hasAttribute("data-original-href")) {
        link.setAttribute("data-original-href", original);
      }
      link.setAttribute("href", withLang(original));
    });
  };

  const initLanguageSelect = () => {
    const select = document.querySelector("[data-language-select]");
    if (!select) return;

    select.value = state.lang;

    select.addEventListener("change", (event) => {
      const nextLang = ensureLang(event.target.value);
      setStoredLang(nextLang);

      const pathNoLang = normalizePath(stripLangPrefix(window.location.pathname));
      const targetPath = pathNoLang === "/" ? `/${nextLang}/` : `/${nextLang}${pathNoLang}`;
      window.location.assign(`${targetPath}${window.location.search}${window.location.hash}`);
    });
  };

  const initMobileNav = () => {
    const toggle = document.querySelector("[data-nav-toggle]");
    if (!toggle) return;

    const controlsId = toggle.getAttribute("aria-controls");
    if (!controlsId) return;

    const nav = document.getElementById(controlsId);
    if (!nav) return;

    const closeNav = () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    };

    toggle.addEventListener("click", () => {
      const next = !nav.classList.contains("is-open");
      nav.classList.toggle("is-open", next);
      toggle.setAttribute("aria-expanded", String(next));
    });

    document.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (nav.contains(target) || toggle.contains(target)) return;
      closeNav();
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeNav);
    });
  };

  const initReveal = () => {
    const nodes = document.querySelectorAll(".reveal");
    if (!nodes.length) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      nodes.forEach((node) => node.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.16 }
    );

    nodes.forEach((node) => observer.observe(node));
  };

  const getLocalizedValue = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value[state.lang] || value[DEFAULT_LANG] || Object.values(value)[0] || "";
  };

  const renderSafeParagraphs = (container, text) => {
    if (!container) return;
    container.innerHTML = "";

    const normalized = String(text || "").replace(/\r\n/g, "\n");
    const chunks = normalized
      .split(/\n\s*\n/g)
      .map((part) => part.trim())
      .filter(Boolean);

    chunks.forEach((chunk) => {
      const p = document.createElement("p");
      p.textContent = chunk;
      container.appendChild(p);
    });
  };

  const loadBlogIndex = async () => {
    const response = await fetch("/blog/index.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`blog index load failed: ${response.status}`);
    }
    const payload = await response.json();
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.posts)) return payload.posts;
    return [];
  };

  const initBlogIndex = async () => {
    const list = document.querySelector("[data-blog-list]");
    if (!list) return;

    try {
      const posts = await loadBlogIndex();
      list.innerHTML = "";

      posts.forEach((post) => {
        const item = document.createElement("article");
        item.className = "card reveal";

        const titleEl = document.createElement("h3");
        titleEl.textContent = getLocalizedValue(post.title);

        const dateEl = document.createElement("p");
        dateEl.className = "form-note";
        dateEl.textContent = post.date || "";

        const excerptEl = document.createElement("p");
        excerptEl.textContent = getLocalizedValue(post.excerpt);

        const link = document.createElement("a");
        link.className = "btn btn-secondary";
        link.textContent = t("blog.read_more");
        link.href = withLang(`/blog/post/?slug=${encodeURIComponent(post.slug || "")}`);

        item.appendChild(titleEl);
        item.appendChild(dateEl);
        item.appendChild(excerptEl);
        item.appendChild(link);
        list.appendChild(item);
      });

      initReveal();
    } catch (error) {
      list.innerHTML = "";
      const empty = document.createElement("p");
      empty.textContent = t("blog.empty");
      list.appendChild(empty);
    }
  };

  const initBlogPost = async () => {
    const root = document.querySelector("[data-blog-post]");
    if (!root) return;

    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");

    const titleEl = root.querySelector("[data-post-title]");
    const dateEl = root.querySelector("[data-post-date]");
    const excerptEl = root.querySelector("[data-post-excerpt]");
    const bodyEl = root.querySelector("[data-post-body]");

    if (!slug) {
      if (titleEl) titleEl.textContent = t("blog.post.not_found");
      return;
    }

    try {
      const posts = await loadBlogIndex();
      const post = posts.find((entry) => entry.slug === slug);

      if (!post) {
        if (titleEl) titleEl.textContent = t("blog.post.not_found");
        return;
      }

      const localizedTitle = getLocalizedValue(post.title);
      const localizedExcerpt = getLocalizedValue(post.excerpt);
      const localizedBody = getLocalizedValue(post.body);

      if (titleEl) titleEl.textContent = localizedTitle;
      if (dateEl) dateEl.textContent = post.date || "";
      if (excerptEl) excerptEl.textContent = localizedExcerpt;
      renderSafeParagraphs(bodyEl, localizedBody);

      document.title = `${localizedTitle} | ${t("site.name")}`;
    } catch (error) {
      if (titleEl) titleEl.textContent = t("blog.post.not_found");
    }
  };

  const init = async () => {
    state.lang = getLang();
    setStoredLang(state.lang);

    await loadStrings();
    window.gms = {
      get lang() {
        return state.lang;
      },
      t,
      withLang,
    };

    applyTranslations();
    rewriteInternalLinks();
    initLanguageSelect();
    initMobileNav();
    initReveal();
    await initBlogIndex();
    await initBlogPost();
  };

  document.addEventListener("DOMContentLoaded", () => {
    init().catch(() => {
      window.gms = {
        get lang() {
          return state.lang;
        },
        t: (key) => key,
        withLang,
      };
      rewriteInternalLinks();
      initLanguageSelect();
      initMobileNav();
      initReveal();
    });
  });
})();
