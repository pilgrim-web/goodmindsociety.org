# Stripe Setup

## Default (Payment Links)
1. Create Stripe Payment Links for one-time and monthly donations.
2. Update `/content/data/site.json`:
   - `donate.paymentLinkOneTime`
   - `donate.paymentLinkMonthly`
   - `donate.checkoutMode` = `payment_link`
3. Deploy and test the Donate page.

## Optional Upgrade (Checkout Sessions)
1. Set environment variables in Netlify:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_SUCCESS_URL`
   - `STRIPE_CANCEL_URL`
2. Update `/content/data/site.json`:
   - `donate.checkoutMode` = `checkout_session`
3. Test the custom amount form on `/donate/`.

## Webhook (Optional)
The file `/netlify/functions/stripe-webhook.js` is a safe placeholder and does nothing by default.
To enable webhooks:
1. Replace the placeholder function with real Stripe webhook verification.
2. Add `STRIPE_WEBHOOK_SECRET` to Netlify.
3. Configure the webhook endpoint in Stripe.
