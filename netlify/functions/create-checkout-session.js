const STRIPE_API_URL = "https://api.stripe.com/v1/checkout/sessions";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  const SUCCESS_URL = process.env.STRIPE_SUCCESS_URL || "https://goodmindsociety.org/donate/?success=true";
  const CANCEL_URL = process.env.STRIPE_CANCEL_URL || "https://goodmindsociety.org/donate/?canceled=true";

  if (!STRIPE_SECRET_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Stripe secret key is not configured." })
    };
  }

  let payload = {};
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (error) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body." }) };
  }

  const amount = Number(payload.amount);
  const interval = payload.interval === "monthly" ? "monthly" : "one_time";

  if (!amount || amount < 5) {
    return { statusCode: 400, body: JSON.stringify({ error: "Minimum amount is $5." }) };
  }

  const amountInCents = Math.round(amount * 100);

  const params = new URLSearchParams();
  params.append("success_url", SUCCESS_URL);
  params.append("cancel_url", CANCEL_URL);
  params.append("mode", interval === "monthly" ? "subscription" : "payment");
  params.append("line_items[0][price_data][currency]", "usd");
  params.append("line_items[0][price_data][product_data][name]", "Good Mind Society Donation");
  params.append("line_items[0][price_data][unit_amount]", String(amountInCents));
  params.append("line_items[0][quantity]", "1");

  if (interval === "monthly") {
    params.append("line_items[0][price_data][recurring][interval]", "month");
  }

  try {
    const response = await fetch(STRIPE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params
    });

    const data = await response.json();

    if (!response.ok) {
      return { statusCode: 500, body: JSON.stringify({ error: data.error?.message || "Stripe error" }) };
    }

    return { statusCode: 200, body: JSON.stringify({ url: data.url }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: "Unexpected server error." }) };
  }
};
