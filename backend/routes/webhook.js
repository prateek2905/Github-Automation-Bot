const express = require("express");
const db = require("../db");
const logger = require("../lib/logger");
const { verifyGithubSignature } = require("../lib/verify");

const router = express.Router();

const SUPPORTED_EVENTS = ["issues", "pull_request", "push", "installation", "installation_repositories"];

// kept deliberately thin: verify, dedupe, persist, ACK. The worker (worker.js)
// does the actual rule matching and GitHub/Slack calls, so a slow or failing
// downstream call never delays or drops the webhook response GitHub expects.
router.post("/github", express.raw({ type: "application/json" }), async (req, res) => {
  const signature = req.headers["x-hub-signature-256"];
  if (!verifyGithubSignature(req.body, signature)) {
    logger.warn("rejected webhook with invalid signature");
    return res.status(401).json({ message: "Invalid signature" });
  }

  const deliveryId = req.headers["x-github-delivery"];
  const eventType = req.headers["x-github-event"];
  if (!deliveryId || !eventType) {
    return res.status(400).json({ message: "Missing GitHub headers" });
  }

  if (eventType === "ping") {
    return res.status(200).json({ message: "pong" });
  }
  if (!SUPPORTED_EVENTS.includes(eventType)) {
    return res.status(202).json({ message: "Event type ignored" });
  }

  let payload;
  try {
    payload = JSON.parse(req.body.toString("utf8"));
  } catch (err) {
    return res.status(400).json({ message: "Invalid JSON payload" });
  }

  try {
    // deliveryId is unique, so GitHub's automatic redelivery of an event we
    // already recorded just no-ops here instead of creating a duplicate
    await db.event.upsert({
      where: { deliveryId },
      update: {},
      create: {
        deliveryId,
        installationId: payload.installation ? BigInt(payload.installation.id) : null,
        repoFullName: payload.repository ? payload.repository.full_name : null,
        eventType,
        action: payload.action || null,
        senderLogin: payload.sender ? payload.sender.login : null,
        title: payload.issue?.title || payload.pull_request?.title || null,
        payload,
      },
    });
  } catch (err) {
    logger.error({ err }, "failed to persist webhook event");
    return res.status(500).json({ message: "Failed to record event" });
  }

  res.status(200).json({ message: "Event received" });
});

module.exports = router;
