const config = require("../config");

async function postSlack(message) {
  if (!config.SLACK_WEBHOOK_URL) throw new Error("SLACK_WEBHOOK_URL not configured");

  const res = await fetch(config.SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: message }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Slack webhook failed: ${res.status} ${text}`);
  }
}

module.exports = { postSlack };
