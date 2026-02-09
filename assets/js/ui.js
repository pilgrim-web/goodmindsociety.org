let activeModal = null;
let lastFocused = null;

function getFocusable(container) {
  return Array.from(
    container.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
  );
}

export function openModal(modal) {
  if (!modal) return;
  lastFocused = document.activeElement;
  activeModal = modal;
  modal.setAttribute("data-open", "true");
  modal.setAttribute("aria-hidden", "false");
  const focusable = getFocusable(modal);
  if (focusable.length) {
    focusable[0].focus();
  }
}

export function closeModal(modal) {
  if (!modal) return;
  modal.setAttribute("data-open", "false");
  modal.setAttribute("aria-hidden", "true");
  if (lastFocused) {
    lastFocused.focus();
  }
  activeModal = null;
}

function initModal() {
  document.addEventListener("click", (event) => {
    const closeButton = event.target.closest("[data-modal-close]");
    if (closeButton) {
      const modal = closeButton.closest(".modal");
      closeModal(modal);
      return;
    }

    if (event.target.classList.contains("modal")) {
      closeModal(event.target);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activeModal) {
      closeModal(activeModal);
    }

    if (event.key === "Tab" && activeModal) {
      const focusable = getFocusable(activeModal);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
}

function initAccordion() {
  document.querySelectorAll(".accordion-item").forEach((item) => {
    const trigger = item.querySelector(".accordion-trigger");
    if (!trigger) return;
    trigger.addEventListener("click", () => {
      const isOpen = item.getAttribute("data-open") === "true";
      item.setAttribute("data-open", isOpen ? "false" : "true");
      trigger.setAttribute("aria-expanded", isOpen ? "false" : "true");
    });
  });
}

function initMenuToggle() {
  const menu = document.querySelector("[data-menu]");
  const toggle = document.querySelector("[data-menu-toggle]");
  if (!menu || !toggle) return;
  toggle.addEventListener("click", () => {
    const isOpen = menu.getAttribute("data-open") === "true";
    menu.setAttribute("data-open", isOpen ? "false" : "true");
    toggle.setAttribute("aria-expanded", isOpen ? "false" : "true");
  });
}

function initFormSuccess() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("success") === "true") {
    document.querySelectorAll("[data-form-success]").forEach((node) => {
      node.removeAttribute("hidden");
    });
  }
}

export function initUI() {
  initAccordion();
  initModal();
  initMenuToggle();
  initFormSuccess();
}
