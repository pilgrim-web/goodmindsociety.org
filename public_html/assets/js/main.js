(() => {
  const supportedLangs = ["en", "ko", "es", "zh"];
  const defaultLang = "en";

  const getQueryLang = () => {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get("lang");
    return lang ? lang.toLowerCase() : null;
  };

  const normalizeLang = (lang) => (supportedLangs.includes(lang) ? lang : null);

  const loadDictionary = async (lang) => {
    const response = await fetch(`/assets/i18n/${lang}.json`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("i18n load failed");
    }
    return response.json();
  };

  const applyTranslations = (dict) => {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (dict[key]) {
        el.setAttribute("placeholder", dict[key]);
      }
    });

    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      const key = el.getAttribute("data-i18n-aria");
      if (dict[key]) {
        el.setAttribute("aria-label", dict[key]);
      }
    });

    const titleEl = document.querySelector("title[data-i18n]");
    if (titleEl) {
      const key = titleEl.getAttribute("data-i18n");
      if (dict[key]) {
        document.title = dict[key];
      }
    }
  };

  const setLanguage = async (lang, persist = true) => {
    const normalized = normalizeLang(lang) || defaultLang;
    const dict = await loadDictionary(normalized);
    window.GMS_I18N = dict;
    window.GMS_LANG = normalized;
    applyTranslations(dict);
    document.documentElement.lang = normalized;

    const select = document.querySelector("#langSelect");
    if (select) {
      select.value = normalized;
    }

    if (persist) {
      localStorage.setItem("gms_lang", normalized);
    }

    document.dispatchEvent(new CustomEvent("gms:lang", { detail: { lang: normalized, dict } }));
  };

  const initLanguage = async () => {
    const queryLang = normalizeLang(getQueryLang());
    const storedLang = normalizeLang(localStorage.getItem("gms_lang"));
    const initial = queryLang || storedLang || defaultLang;
    await setLanguage(initial, true);
  };

  const initLanguageSelector = () => {
    const select = document.querySelector("#langSelect");
    if (!select) return;
    select.addEventListener("change", (event) => {
      const newLang = event.target.value;
      setLanguage(newLang, true).catch(() => {});
    });
  };

  const initNav = () => {
    const toggle = document.querySelector("[data-nav-toggle]");
    const nav = document.querySelector("[data-nav]");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", (event) => {
      if (!nav.classList.contains("is-open")) return;
      if (nav.contains(event.target) || toggle.contains(event.target)) return;
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  };

  const initReveal = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.GMS_REVEAL = (elements) => {
        elements.forEach((el) => el.classList.add("is-visible"));
      };
      window.GMS_REVEAL(document.querySelectorAll(".reveal"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    window.GMS_REVEAL = (elements) => {
      elements.forEach((el) => observer.observe(el));
    };
    window.GMS_REVEAL(document.querySelectorAll(".reveal"));
  };

  const initForms = () => {
    const forms = document.querySelectorAll("form[data-endpoint]");
    if (!forms.length) return;

    const t = (key) => (window.GMS_I18N && window.GMS_I18N[key]) || key;

    forms.forEach((form) => {
      const statusEl = form.querySelector("[data-form-status]");

      const setStatus = (key, isError = false) => {
        if (!statusEl) return;
        statusEl.textContent = t(key);
        statusEl.hidden = false;
        statusEl.style.color = isError ? "#8b2d2d" : "inherit";
      };

      form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const name = String(formData.get("name") || "").trim();
        const email = String(formData.get("email") || "").trim();
        const message = String(formData.get("message") || "").trim();

        if (!name || !email || !message) {
          setStatus("form_missing", true);
          return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          setStatus("form_invalid", true);
          return;
        }

        setStatus("form_sending", false);

        try {
          const response = await fetch(form.dataset.endpoint, {
            method: "POST",
            body: formData,
            headers: { Accept: "application/json" },
          });
          const data = await response.json();
          if (response.ok && data.ok) {
            setStatus("form_success", false);
            form.reset();
            return;
          }
          const errorKey = data && data.error === "rate_limited" ? "form_rate_limited" : "form_error";
          setStatus(errorKey, true);
        } catch (err) {
          setStatus("form_error", true);
        }
      });
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    initNav();
    initReveal();
    initLanguageSelector();
    initLanguage().catch(() => {});
    initForms();
  });
})();
