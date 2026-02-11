(() => {
  const listEl = document.querySelector("#blogList");
  if (!listEl) return;

  let posts = [];

  const t = (key) => (window.GMS_I18N && window.GMS_I18N[key]) || key;

  const getLang = () => {
    return window.GMS_LANG || localStorage.getItem("gms_lang") || "en";
  };

  const renderPosts = () => {
    const lang = getLang();
    const filtered = posts.filter((post) => !post.lang || post.lang === lang);

    listEl.innerHTML = "";

    if (!filtered.length) {
      const empty = document.createElement("p");
      empty.textContent = t("blog_list_empty");
      listEl.appendChild(empty);
      return;
    }

    filtered.forEach((post) => {
      const card = document.createElement("article");
      card.className = "card blog-card reveal";

      const title = document.createElement("h3");
      title.textContent = post.title;

      const meta = document.createElement("div");
      meta.className = "blog-meta";
      meta.textContent = `${t("blog_published_label")} ${post.date}`;

      const excerpt = document.createElement("p");
      excerpt.textContent = post.excerpt;

      const link = document.createElement("a");
      link.href = post.url;
      link.className = "btn btn-secondary";
      link.textContent = t("blog_read_more");

      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(excerpt);
      card.appendChild(link);
      listEl.appendChild(card);
    });

    if (window.GMS_REVEAL) {
      window.GMS_REVEAL(listEl.querySelectorAll(".reveal"));
    }
  };

  const loadPosts = async () => {
    try {
      const response = await fetch("/content/blog/index.json", { cache: "no-store" });
      if (!response.ok) throw new Error("blog fetch failed");
      const data = await response.json();
      posts = Array.isArray(data.posts) ? data.posts : [];
      renderPosts();
    } catch (err) {
      listEl.innerHTML = "";
      const empty = document.createElement("p");
      empty.textContent = t("blog_list_empty");
      listEl.appendChild(empty);
    }
  };

  document.addEventListener("gms:lang", renderPosts);

  loadPosts();
})();
