const SUBSCRIPTION_PLANS = Object.freeze({
  monthly: Object.freeze({ id: "monthly", priceCents: 500, durationMonths: 1 }),
  yearly: Object.freeze({ id: "yearly", priceCents: 5000, durationMonths: 12 }),
});

function getSubscriptionPlan(plan) {
  return SUBSCRIPTION_PLANS[String(plan || "").trim().toLowerCase()] || null;
}

function subscriptionExpiresAt(start = new Date(), durationMonths = 1) {
  const expires = new Date(start);
  expires.setUTCMonth(expires.getUTCMonth() + Number(durationMonths));
  return expires.toISOString();
}

function isSubscriptionActive(subscription, at = new Date()) {
  return Boolean(subscription && subscription.status === "active" && Date.parse(subscription.expires_at) > new Date(at).getTime());
}

module.exports = { SUBSCRIPTION_PLANS, getSubscriptionPlan, subscriptionExpiresAt, isSubscriptionActive };
