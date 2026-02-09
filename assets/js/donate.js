import { getSite } from "./content.js";
import { t } from "./i18n.js";

export function initDonate() {
  const site = getSite();
  if (!site || !site.donate) return;

  const applyDonateLink = (key, url) => {
    document.querySelectorAll(`[data-donate-link="${key}"]`).forEach((link) => {
      if (url) {
        link.setAttribute("href", url);
        link.setAttribute("aria-disabled", "false");
        link.classList.remove("is-disabled");
        link.textContent = t("site.cta.donate");
      } else {
        link.setAttribute("href", "#");
        link.setAttribute("aria-disabled", "true");
        link.classList.add("is-disabled");
        link.textContent = t("misc.comingSoon");
      }
    });
  };

  applyDonateLink("oneTime", site.donate.paymentLinkOneTime);
  applyDonateLink("monthly", site.donate.paymentLinkMonthly);

  const form = document.querySelector("[data-donate-custom]");
  if (!form) return;

  const message = form.querySelector("[data-donate-message]");
  const button = form.querySelector("button[type=\"submit\"]");

  if (site.donate.checkoutMode !== "checkout_session") {
    form.classList.add("disabled");
    if (button) button.setAttribute("disabled", "disabled");
    if (message) message.textContent = t("donate.custom.comingSoon");
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!button) return;
    button.setAttribute("disabled", "disabled");
    if (message) message.textContent = t("donate.custom.processing");

    const amountField = form.querySelector("input[name=\"amount\"]");
    const intervalField = form.querySelector("select[name=\"interval\"]");
    const amountValue = amountField ? Number(amountField.value) : 0;
    const intervalValue = intervalField ? intervalField.value : "one_time";

    if (!amountValue || amountValue < 5) {
      if (message) message.textContent = t("donate.custom.minimum");
      button.removeAttribute("disabled");
      return;
    }

    try {
      const response = await fetch("/.netlify/functions/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountValue, interval: intervalValue }),
      });

      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Checkout error");
      }
      window.location.assign(data.url);
    } catch (error) {
      if (message) message.textContent = t("donate.custom.error");
      button.removeAttribute("disabled");
    }
  });
}
