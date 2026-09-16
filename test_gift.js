const assert = require("node:assert/strict");
const { gifts, getGiftById, formatGiftMessage, handleGiftCommand } = require("./gift");
const { calculateGiftDebit } = require("./finance");
const { parseGiftCommand, isGiftCommandAllowed } = require("./message_guardrails");

assert.ok(gifts.length >= 4);
assert.deepEqual(Object.keys(gifts[0]).sort(), ["desc", "emoji", "id", "name", "price"]);
assert.equal(getGiftById("rose").emoji, "🌹");
assert.equal(calculateGiftDebit({ price: 2.5 }).priceCents, 250);
assert.deepEqual(parseGiftCommand("هدية @0791234567 rose"), { recipientMention: "@0791234567", giftId: "rose" });
assert.equal(parseGiftCommand("هدية rose"), null);
assert.equal(isGiftCommandAllowed({ message: { fromMe: false }, senderPhone: "962791111111", botPhone: "962775969880", recipientPhone: "962792222222" }), true);
assert.equal(isGiftCommandAllowed({ message: { fromMe: true }, senderPhone: "962791111111", botPhone: "962775969880", recipientPhone: "962792222222" }), false);

(async () => {
  const sent = [];
  const result = await handleGiftCommand({
    sock: { sendMessage: async (to, payload) => sent.push({ to, payload }) },
    sender: { name: "مرسل" },
    recipient: { phone: "962792222222", name: "مستلم" },
    giftId: "rose",
    senderChatId: "962791111111@c.us",
    debit: async () => ({ ok: false, reason: "insufficient_balance" }),
  });
  assert.equal(result.ok, false);
  assert.match(sent[0].payload.text, /رصيد غير كاف/);
  const successful = [];
  const successResult = await handleGiftCommand({
    sock: { sendMessage: async (to, payload) => successful.push({ to, payload }) },
    sender: { name: "مرسل" },
    recipient: { phone: "962792222222", name: "مستلم" },
    giftId: "rose",
    senderChatId: "962791111111@c.us",
    debit: async () => ({ ok: true, remainingBalanceCents: 850 }),
  });
  assert.equal(successResult.ok, true);
  assert.equal(successful.length, 2);
  assert.equal(successful[0].to, "962792222222@c.us");
  assert.match(successful[1].payload.text, /تم إرسال الهدية بنجاح/);
  console.log("gift tests passed");
})();
