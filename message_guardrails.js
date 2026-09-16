function isBotGeneratedMessage(message) {
  return Boolean(message && message.fromMe);
}

function normalizePhone(value = "") {
  const digits = String(value).replace(/[^0-9]/g, "").replace(/^00/, "");
  return digits.replace(/^9627/, "07");
}

function isBotReactionSender(senderPhone, botPhone) {
  const sender = normalizePhone(senderPhone);
  const bot = normalizePhone(botPhone);
  return Boolean(sender && bot && sender === bot);
}

function isBotFinancialRole(phone, botPhone, role) {
  return isBotReactionSender(phone, botPhone) && role !== "company";
}

function parseGiftCommand(body = "") {
  const text = String(body).trim();
  const match = text.match(/^هدية\s+(@[^\s]+)\s+([A-Za-z0-9_-]+)$/iu);
  if (!match) return null;
  return { recipientMention: match[1], giftId: match[2] };
}

function isGiftCommandAllowed({ message, senderPhone, botPhone, recipientPhone }) {
  if (!message || message.fromMe || !senderPhone || !recipientPhone) return false;
  if (isBotReactionSender(senderPhone, botPhone)) return false;
  if (isBotReactionSender(recipientPhone, botPhone)) return false;
  return normalizePhone(senderPhone) !== normalizePhone(recipientPhone);
}

module.exports = {
  isBotGeneratedMessage,
  isBotReactionSender,
  isBotFinancialRole,
  parseGiftCommand,
  isGiftCommandAllowed,
  normalizePhone,
};
