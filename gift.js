const gifts = require("./gifts.json");
const { calculateGiftDebit } = require("./finance");

const giftCatalog = new Map(gifts.map((gift) => [String(gift.id).trim().toLowerCase(), gift]));

function getGiftById(id) {
  return giftCatalog.get(String(id || "").trim().toLowerCase()) || null;
}

function formatGiftMessage(gift, { senderName = "", recipientName = "" } = {}) {
  const lines = [
    "🎁 *وصلتك هدية جديدة!*",
    `${gift.emoji} *${gift.name}*`,
    gift.desc || gift.description,
    `القيمة: ${Number(gift.price).toFixed(2)} د.أ`,
  ];
  if (recipientName) lines.push(`إلى: ${recipientName}`);
  if (senderName) lines.push(`من: ${senderName}`);
  return lines.join("\n");
}

function formatGiftConfirmation(gift, recipient, remainingBalanceCents) {
  return [
    "✅ *تم إرسال الهدية بنجاح*",
    `${gift.emoji} ${gift.name}`,
    `إلى: ${recipient.name || recipient.phone}`,
    `المبلغ المخصوم: ${Number(gift.price).toFixed(2)} د.أ`,
    `الرصيد المتبقي: ${(Number(remainingBalanceCents) / 100).toFixed(2)} د.أ`,
  ].join("\n");
}

async function handleGiftCommand({
  sock,
  sender,
  recipient,
  giftId,
  debit,
  senderChatId,
}) {
  const gift = getGiftById(giftId);
  if (!gift) {
    await sock.sendMessage(senderChatId, { text: "❌ معرف الهدية غير موجود. استخدم معرفًا من قائمة الهدايا." });
    return { ok: false, reason: "gift_not_found" };
  }
  const priceCents = calculateGiftDebit({ price: gift.price }).priceCents;
  const debitResult = await debit({ priceCents, gift, sender, recipient });
  if (!debitResult || debitResult.ok !== true) {
    if (debitResult?.reason === "insufficient_balance") {
      await sock.sendMessage(senderChatId, { text: "❌ رصيد غير كافٍ لإرسال هذه الهدية." });
    }
    return debitResult || { ok: false, reason: "debit_failed" };
  }

  const recipientChatId = `${recipient.phone}@c.us`;
  await sock.sendMessage(recipientChatId, {
    text: formatGiftMessage(gift, { senderName: sender.name, recipientName: recipient.name }),
  });
  await sock.sendMessage(senderChatId, {
    text: formatGiftConfirmation(gift, recipient, debitResult.remainingBalanceCents),
  });
  return { ok: true, gift, recipient, remainingBalanceCents: debitResult.remainingBalanceCents };
}

module.exports = {
  gifts,
  getGiftById,
  formatGiftMessage,
  formatGiftConfirmation,
  handleGiftCommand,
};
