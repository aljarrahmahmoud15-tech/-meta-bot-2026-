const assert = require("node:assert/strict");
const { SUBSCRIPTION_PLANS, getSubscriptionPlan, subscriptionExpiresAt, isSubscriptionActive } = require("./subscription");

assert.equal(SUBSCRIPTION_PLANS.monthly.priceCents, 500);
assert.equal(SUBSCRIPTION_PLANS.yearly.priceCents, 5000);
assert.equal(getSubscriptionPlan("monthly").durationMonths, 1);
assert.equal(getSubscriptionPlan("yearly").durationMonths, 12);
assert.equal(getSubscriptionPlan("invalid"), null);
const start = new Date("2026-01-15T00:00:00.000Z");
const expiry = subscriptionExpiresAt(start, 1);
assert.equal(expiry, "2026-02-15T00:00:00.000Z");
assert.equal(isSubscriptionActive({ status: "active", expires_at: expiry }, new Date("2026-02-01T00:00:00.000Z")), true);
assert.equal(isSubscriptionActive({ status: "active", expires_at: expiry }, new Date("2026-02-15T00:00:00.000Z")), false);
assert.equal(isSubscriptionActive({ status: "expired", expires_at: expiry }, new Date("2026-02-01T00:00:00.000Z")), false);
console.log("subscription tests passed");
