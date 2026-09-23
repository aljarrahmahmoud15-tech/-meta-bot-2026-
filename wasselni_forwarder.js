const crypto = require("crypto");

const TARGET_URL = String(process.env.WASSELNI_OPERATIONS_WEBHOOK_URL || "https://wasselniop-mmatdchj.manus.space/api/whatsapp/events").replace(/\/$/, "");
const SECRET = String(process.env.WASSELNI_OPERATIONS_WEBHOOK_SECRET || "").trim();

function serializedId(value) {
  return String(value?._serialized || value?.id?._serialized || value?.id || value || "").trim();
}

async function postEvent(payload) {
  if (!SECRET || !TARGET_URL) {
    return { skipped: true, reason: "missing_forwarder_config" };
  }
  const body = JSON.stringify(payload);
  const signature = crypto.createHmac("sha256", SECRET).update(body).digest("hex");
  try {
    const response = await fetch(TARGET_URL, {
      method: "POST",
      headers: { "content-type": "application/json", "x-wasselni-signature": `sha256=${signature}` },
      body,
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json().catch(() => ({ ok: true }));
  } catch (error) {
    console.warn(`[Wasselni bridge] event ${payload.eventId} failed: ${error.message}`);
    return { skipped: false, error: error.message };
  }
}

async function forwardMessage(msg, { groupId, senderPhone, senderName, quotedMessageId } = {}) {
  const messageId = serializedId(msg?.id);
  if (!messageId || !groupId || !senderPhone) return { skipped: true, reason: "missing_message_fields" };
  return postEvent({
    eventId: `message:${messageId}`,
    type: "message",
    groupId,
    messageId,
    targetMessageId: quotedMessageId || undefined,
    senderPhone,
    senderName: senderName || senderPhone,
    text: String(msg?.body || "").trim(),
  });
}

async function forwardReaction(reaction, { groupId, senderPhone } = {}) {
  const targetMessageId = serializedId(reaction?.msgId);
  if (!targetMessageId || !groupId || !senderPhone) return { skipped: true, reason: "missing_reaction_fields" };
  const reactionValue = String(reaction?.reaction || "").trim();
  return postEvent({
    eventId: `reaction:${targetMessageId}:${senderPhone}:${reactionValue || "removed"}`,
    type: "reaction",
    groupId,
    targetMessageId,
    senderPhone,
    reaction: reactionValue,
  });
}

module.exports = { forwardMessage, forwardReaction };
