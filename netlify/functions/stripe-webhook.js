exports.handler = async () => {
  return {
    statusCode: 200,
    body: "Stripe webhook is not enabled. See docs/SETUP_STRIPE.md to activate."
  };
};
